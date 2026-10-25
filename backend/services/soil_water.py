from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import date, timedelta
import math
from statistics import median

import numpy as np
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from rasterio.features import geometry_mask
from rasterio.io import MemoryFile

router = APIRouter(prefix="/api/soil-water", tags=["soil-water"])

SOILGRIDS_WCS_URL = "https://maps.isric.org/mapserv"
OPEN_METEO_ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
OPEN_METEO_ELEVATION_URL = "https://api.open-meteo.com/v1/elevation"
SOIL_DEPTH = "0-5cm"
SOILGRID_PROPERTIES = {
    "phh2o": ("ph", lambda value: value / 10),
    "soc": ("organicCarbonPercent", lambda value: value / 100),
    "clay": ("clayPercent", lambda value: value / 10),
    "sand": ("sandPercent", lambda value: value / 10),
    "silt": ("siltPercent", lambda value: value / 10),
    "nitrogen": ("totalNitrogenGPerKg", lambda value: value / 100),
    "bdod": ("bulkDensityGPerCm3", lambda value: value / 100),
}
SOIL_MOISTURE_VARIABLES = {
    "0-7 cm": "soil_moisture_0_to_7cm",
    "7-28 cm": "soil_moisture_7_to_28cm",
    "28-100 cm": "soil_moisture_28_to_100cm",
    "100-255 cm": "soil_moisture_100_to_255cm",
}
CROP_WATER_PROFILES = {
    "maize": {"durationDays": 105, "kc": {"initial": 0.30, "mid": 1.20, "end": 0.60}},
    "soybean": {"durationDays": 95, "kc": {"initial": 0.40, "mid": 1.15, "end": 0.50}},
    "wheat": {"durationDays": 115, "kc": {"initial": 0.30, "mid": 1.15, "end": 0.25}},
    "cotton": {"durationDays": 160, "kc": {"initial": 0.35, "mid": 1.15, "end": 0.50}},
    "chickpea": {"durationDays": 100, "kc": {"initial": 0.40, "mid": 1.15, "end": 0.35}},
    "rice": {"durationDays": 130, "kc": {"initial": 1.05, "mid": 1.20, "end": 0.90}},
    "mustard": {"durationDays": 110, "kc": {"initial": 0.35, "mid": 1.15, "end": 0.35}},
    "millets": {"durationDays": 85, "kc": {"initial": 0.30, "mid": 1.00, "end": 0.30}},
    "pigeonpea": {"durationDays": 175, "kc": {"initial": 0.40, "mid": 1.15, "end": 0.35}},
    "moong": {"durationDays": 62, "kc": {"initial": 0.40, "mid": 1.10, "end": 0.35}},
    "cloverCover": {"durationDays": 45, "kc": {"initial": 0.40, "mid": 1.05, "end": 0.80}},
}


class FarmGeometryRequest(BaseModel):
    geometry: dict | None = None
    latitude: float | None = None
    longitude: float | None = None


class CropDemandRequest(BaseModel):
    latitude: float
    longitude: float
    cropId: str
    plantingDate: date


def get_polygon_details(geometry):
    if geometry.get("type") != "Polygon":
        raise HTTPException(400, "Draw a single farm polygon or rectangle.")

    rings = geometry.get("coordinates")
    if not isinstance(rings, list) or not rings or len(rings[0]) < 4:
        raise HTTPException(400, "Invalid farm polygon.")

    points = rings[0]
    for point in points:
        if (
            len(point) < 2
            or not all(isinstance(value, (int, float)) and math.isfinite(value) for value in point[:2])
            or abs(point[0]) > 180
            or abs(point[1]) > 90
        ):
            raise HTTPException(400, "Invalid longitude/latitude coordinates.")

    longitudes = [point[0] for point in points[:-1]]
    latitudes = [point[1] for point in points[:-1]]
    min_lon, max_lon = min(longitudes), max(longitudes)
    min_lat, max_lat = min(latitudes), max(latitudes)
    if max_lon - min_lon > 0.2 or max_lat - min_lat > 0.2:
        raise HTTPException(400, "Farm polygon is too large for this endpoint (maximum about 20 km).")

    twice_area = 0.0
    centroid_lon = 0.0
    centroid_lat = 0.0
    for index, (lon, lat) in enumerate(points[:-1]):
        next_lon, next_lat = points[index + 1][:2]
        cross = lon * next_lat - next_lon * lat
        twice_area += cross
        centroid_lon += (lon + next_lon) * cross
        centroid_lat += (lat + next_lat) * cross

    if abs(twice_area) < 1e-12:
        center = (sum(longitudes) / len(longitudes), sum(latitudes) / len(latitudes))
    else:
        center = (centroid_lon / (3 * twice_area), centroid_lat / (3 * twice_area))

    return center, (min_lon, min_lat, max_lon, max_lat)


def fetch_soilgrid_property(property_code, geometry, bbox, center, depth=SOIL_DEPTH):
    min_lon, min_lat, max_lon, max_lat = bbox
    padding = 0.002
    params = {
        "map": f"/map/{property_code}.map",
        "SERVICE": "WCS",
        "VERSION": "2.0.1",
        "REQUEST": "GetCoverage",
        "COVERAGEID": f"{property_code}_{depth}_Q0.5",
        "SUBSET": [
            f"Long({min_lon - padding},{max_lon + padding})",
            f"Lat({min_lat - padding},{max_lat + padding})",
        ],
        "SUBSETTINGCRS": "http://www.opengis.net/def/crs/EPSG/0/4326",
        "OUTPUTCRS": "http://www.opengis.net/def/crs/EPSG/0/4326",
        "FORMAT": "GEOTIFF_INT16",
    }
    response = requests.get(SOILGRIDS_WCS_URL, params=params, timeout=60)
    response.raise_for_status()

    with MemoryFile(response.content) as memory_file:
        with memory_file.open() as dataset:
            pixels = dataset.read(1)
            if geometry is None:
                row, col = dataset.index(*center)
                values = np.array([], dtype=pixels.dtype)
                valid_rows, valid_cols = np.where(pixels > 0)
                point_distance_meters = None
                if valid_rows.size:
                    nearest = np.argmin((valid_rows - row) ** 2 + (valid_cols - col) ** 2)
                    nearest_row = int(valid_rows[nearest])
                    nearest_col = int(valid_cols[nearest])
                    values = np.array([pixels[nearest_row, nearest_col]])
                    pixel_lon, pixel_lat = dataset.xy(nearest_row, nearest_col)
                    dx = (pixel_lon - center[0]) * 111_320 * math.cos(math.radians(center[1]))
                    dy = (pixel_lat - center[1]) * 111_320
                    point_distance_meters = round(math.hypot(dx, dy))
            else:
                inside = geometry_mask(
                    [geometry],
                    out_shape=pixels.shape,
                    transform=dataset.transform,
                    invert=True,
                    all_touched=True,
                )
                values = pixels[inside & (pixels > 0)]
            if not values.size:
                row, col = dataset.index(*center)
                if 0 <= row < dataset.height and 0 <= col < dataset.width:
                    center_value = int(pixels[row, col])
                    if center_value > 0:
                        values = np.array([center_value])

    if not values.size:
        return None

    _, convert = SOILGRID_PROPERTIES[property_code]
    result = {
        "value": round(convert(float(median(values.tolist()))), 2),
        "pixels": int(values.size),
        "depth": depth,
    }
    if geometry is None:
        result["distanceFromPointMeters"] = point_distance_meters
    return result


def fetch_soilgrid(geometry, bbox, center):
    properties = {}
    warnings = []
    requests_to_make = [
        (code, SOIL_DEPTH) for code in SOILGRID_PROPERTIES if code != "bdod"
    ]
    requests_to_make.append(("bdod", "15-30cm"))
    with ThreadPoolExecutor(max_workers=7) as pool:
        jobs = {
            pool.submit(fetch_soilgrid_property, code, geometry, bbox, center, depth): (code, depth)
            for code, depth in requests_to_make
        }
        for job in as_completed(jobs):
            code, _ = jobs[job]
            result_key, _ = SOILGRID_PROPERTIES[code]
            try:
                properties[result_key] = job.result()
            except Exception as exc:
                properties[result_key] = None
                warnings.append(f"SoilGrids {code} data unavailable: {exc}")

    if not any(value is not None for value in properties.values()):
        warnings.append(
            "SoilGrids has no valid soil pixels near this GPS location."
            if geometry is None
            else "SoilGrids has no valid soil pixels inside this boundary."
        )

    return {
        "source": "ISRIC SoilGrids v2 median prediction",
        "resolutionMeters": 250,
        "depth": SOIL_DEPTH,
        "spatialScope": "farm boundary median" if geometry is not None else "nearest valid SoilGrids pixel to GPS point",
        "representativePoint": {"latitude": center[1], "longitude": center[0]},
        "properties": properties,
        "warnings": warnings,
    }


def fetch_terrain(geometry, center):
    if geometry is None:
        points = [(float(center[0]), float(center[1]))]
    else:
        ring = geometry["coordinates"][0]
        points = list(dict.fromkeys((float(point[0]), float(point[1])) for point in ring[:-1]))
        if len(points) > 99:
            stride = math.ceil(len(points) / 99)
            points = points[::stride][:99]
        points.append((float(center[0]), float(center[1])))

    params = {
        "latitude": ",".join(str(point[1]) for point in points),
        "longitude": ",".join(str(point[0]) for point in points),
    }
    response = requests.get(OPEN_METEO_ELEVATION_URL, params=params, timeout=30)
    response.raise_for_status()
    elevations = response.json().get("elevation", [])
    valid_elevations = [
        float(value)
        for value in elevations
        if isinstance(value, (int, float)) and math.isfinite(value)
    ]
    if len(valid_elevations) != len(points):
        raise ValueError("Elevation service returned incomplete terrain coverage.")

    minimum = min(valid_elevations)
    maximum = max(valid_elevations)
    if geometry is None:
        return {
            "source": "Copernicus DEM GLO-90 via Open-Meteo Elevation API",
            "resolutionMeters": 90,
            "sampleCount": 1,
            "elevationMeters": round(valid_elevations[0], 1),
            "elevationRangeMeters": None,
            "warnings": [],
        }

    return {
        "source": "Copernicus DEM GLO-90 via Open-Meteo Elevation API",
        "resolutionMeters": 90,
        "sampleCount": len(valid_elevations),
        "elevationRangeMeters": {
            "minimum": round(minimum, 1),
            "maximum": round(maximum, 1),
            "relief": round(maximum - minimum, 1),
        },
        "warnings": [],
    }


def fetch_water_history(center):
    end = date.today() - timedelta(days=5)
    start = end - timedelta(days=89)
    params = {
        "latitude": center[1],
        "longitude": center[0],
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "daily": "precipitation_sum",
        "hourly": ",".join(SOIL_MOISTURE_VARIABLES.values()),
        "timezone": "Asia/Kolkata",
    }

    response = requests.get(OPEN_METEO_ARCHIVE_URL, params=params, timeout=90)
    response.raise_for_status()
    payload = response.json()
    daily = payload["daily"]
    precipitation = daily.get("precipitation_sum", [])
    valid_precipitation = [
        float(value)
        for value in precipitation
        if isinstance(value, (int, float))
        and math.isfinite(value)
        and value >= 0
    ]
    complete_rainfall = len(valid_precipitation) == 90 and len(precipitation) == 90
    rainfall_total = round(sum(valid_precipitation), 1) if complete_rainfall else None

    hourly = payload.get("hourly", {})
    moisture = {}
    moisture_sample_counts = {}
    for depth, variable in SOIL_MOISTURE_VARIABLES.items():
        values = [
            float(value)
            for value in hourly.get(variable, [])[-24:]
            if isinstance(value, (int, float))
            and math.isfinite(value)
            and 0 <= value <= 1
        ]
        moisture[depth] = round(sum(values) / len(values), 3) if values else None
        moisture_sample_counts[depth] = len(values)

    warnings = []
    if rainfall_total is None:
        warnings.append("Open-Meteo precipitation did not cover all 90 requested days.")
    if not any(value is not None for value in moisture.values()):
        warnings.append("Open-Meteo soil moisture is unavailable for this location and period.")

    times = hourly.get("time", [])
    moisture_window = times[-24:] if times else []
    return {
        "source": "Open-Meteo Historical Weather API (best-match reanalysis)",
        "representativeGridPoint": {
            "latitude": payload.get("latitude"),
            "longitude": payload.get("longitude"),
        },
        "elevationMeters": payload.get("elevation"),
        "resolutionMeters": 9000,
        "period": {"start": start.isoformat(), "end": end.isoformat(), "days": 90},
        "rainfallTotalMm": rainfall_total,
        "rainfallCoverageDays": len(valid_precipitation),
        "soilMoisture": moisture,
        "soilMoistureSampleCounts": moisture_sample_counts,
        "soilMoistureUnit": "m³/m³",
        "soilMoistureAsOf": times[-1] if times else None,
        "soilMoistureWindowStart": moisture_window[0] if moisture_window else None,
        "soilMoistureWindowEnd": moisture_window[-1] if moisture_window else None,
        "warnings": warnings,
    }


@router.post("/crop-demand")
def crop_water_demand(request: CropDemandRequest):
    profile = CROP_WATER_PROFILES.get(request.cropId)
    if profile is None:
        raise HTTPException(400, "Crop has no configured FAO-style crop-coefficient profile.")
    if (
        not math.isfinite(request.latitude)
        or not math.isfinite(request.longitude)
        or abs(request.latitude) > 90
        or abs(request.longitude) > 180
    ):
        raise HTTPException(400, "Invalid latitude or longitude.")

    try:
        response = requests.get(
            OPEN_METEO_FORECAST_URL,
            params={
                "latitude": request.latitude,
                "longitude": request.longitude,
                "daily": "et0_fao_evapotranspiration,precipitation_sum",
                "forecast_days": 7,
                "timezone": "auto",
            },
            timeout=30,
        )
        response.raise_for_status()
        payload = response.json()
    except requests.RequestException as exc:
        raise HTTPException(502, f"Open-Meteo crop-water forecast unavailable: {exc}") from exc

    daily = payload.get("daily", {})
    forecast_dates = daily.get("time", [])
    et0_values = daily.get("et0_fao_evapotranspiration", [])
    precipitation_values = daily.get("precipitation_sum", [])
    if not forecast_dates or len(forecast_dates) != len(et0_values):
        raise HTTPException(502, "Open-Meteo returned incomplete ET₀ forecast data.")

    days_after_planting = (date.fromisoformat(forecast_dates[0]) - request.plantingDate).days
    duration = profile["durationDays"]
    kc_values = profile["kc"]
    etc_forecast = []
    for index, (day, et0) in enumerate(zip(forecast_dates, et0_values)):
        crop_day = days_after_planting + index
        progress = crop_day / duration
        if crop_day < 0 or progress > 1:
            kc = None
            stage = "not planted" if crop_day < 0 else "complete"
            etc = None
        elif progress < 0.2:
            kc, stage = kc_values["initial"], "initial"
            etc = round(et0 * kc, 1) if isinstance(et0, (int, float)) and math.isfinite(et0) else None
        elif progress < 0.5:
            ratio = (progress - 0.2) / 0.3
            kc = kc_values["initial"] + ratio * (kc_values["mid"] - kc_values["initial"])
            stage = "development"
            etc = round(et0 * kc, 1) if isinstance(et0, (int, float)) and math.isfinite(et0) else None
        elif progress < 0.85:
            kc, stage = kc_values["mid"], "mid-season"
            etc = round(et0 * kc, 1) if isinstance(et0, (int, float)) and math.isfinite(et0) else None
        else:
            ratio = min((progress - 0.85) / 0.15, 1)
            kc = kc_values["mid"] + ratio * (kc_values["end"] - kc_values["mid"])
            stage = "late-season"
            etc = round(et0 * kc, 1) if isinstance(et0, (int, float)) and math.isfinite(et0) else None

        precipitation = precipitation_values[index] if index < len(precipitation_values) else None
        etc_forecast.append({
            "date": day,
            "cropDay": max(crop_day, 0),
            "stage": stage,
            "kc": round(kc, 2) if kc is not None else None,
            "et0Mm": et0,
            "etcMm": etc,
            "precipitationMm": precipitation,
        })

    total_etc = [row["etcMm"] for row in etc_forecast if row["etcMm"] is not None]
    return {
        "source": "Open-Meteo 7-day forecast ET₀ × FAO-56-style single crop coefficient",
        "cropId": request.cropId,
        "plantingDate": request.plantingDate.isoformat(),
        "forecast": etc_forecast,
        "etcTotalMm": round(sum(total_etc), 1) if total_etc else None,
        "etcCoveredDays": len(total_etc),
        "coefficientProfile": profile["kc"],
        "assumptions": [
            "Crop stage durations use a generic fraction of the crop-catalog duration, not a locally calibrated phenology model.",
            "FAO-style Kc values are representative crop-group defaults and are not adjusted for local cultivar, humidity, wind, irrigation, or field management.",
            "ETc estimates are crop evapotranspiration, not net irrigation demand; effective rainfall, soil-water depletion, and irrigation efficiency are not modeled.",
        ],
    }


@router.post("")
def soil_water_for_boundary(request: FarmGeometryRequest):
    if request.geometry is not None:
        center, bbox = get_polygon_details(request.geometry)
    else:
        if request.latitude is None or request.longitude is None:
            raise HTTPException(400, "Provide a farm polygon or GPS latitude and longitude.")
        if (
            not math.isfinite(request.latitude)
            or not math.isfinite(request.longitude)
            or abs(request.latitude) > 90
            or abs(request.longitude) > 180
        ):
            raise HTTPException(400, "Invalid GPS latitude or longitude.")
        center = (request.longitude, request.latitude)
        bbox = (
            center[0] - 0.006,
            center[1] - 0.006,
            center[0] + 0.006,
            center[1] + 0.006,
        )
    soil = fetch_soilgrid(request.geometry, bbox, center)
    try:
        terrain = fetch_terrain(request.geometry, center)
    except Exception as exc:
        terrain = {
            "source": "Copernicus DEM GLO-90 via Open-Meteo Elevation API",
            "resolutionMeters": 90,
            "sampleCount": 0,
            "elevationRangeMeters": None,
            "warnings": [f"Terrain data unavailable: {exc}"],
        }
    try:
        water = fetch_water_history(center)
    except Exception as exc:
        water = {
            "source": "Open-Meteo Historical Weather API",
            "representativeGridPoint": None,
            "resolutionMeters": 9000,
            "period": None,
            "rainfallTotalMm": None,
            "rainfallCoverageDays": 0,
            "soilMoisture": {depth: None for depth in SOIL_MOISTURE_VARIABLES},
            "soilMoistureSampleCounts": {depth: 0 for depth in SOIL_MOISTURE_VARIABLES},
            "soilMoistureUnit": "m³/m³",
            "soilMoistureAsOf": None,
            "soilMoistureWindowStart": None,
            "soilMoistureWindowEnd": None,
            "warnings": [f"Water data unavailable: {exc}"],
        }

    return {"soil": soil, "water": water, "terrain": terrain}