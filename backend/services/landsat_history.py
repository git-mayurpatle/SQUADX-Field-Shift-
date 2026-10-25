"""10-year farm NDVI from USGS/NASA Landsat Collection 2 Level-2.
Data discovery/delivery: public Microsoft Planetary Computer STAC.
No Sentinel Hub credentials needed.
"""
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from functools import lru_cache
import math

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import numpy as np
import planetary_computer
import pystac_client
import rasterio
from rasterio.features import geometry_mask
from rasterio.warp import transform as transform_coords, transform_geom
from rasterio.windows import from_bounds, transform as window_transform
from rasterio.windows import Window

router = APIRouter(prefix="/api/satellite", tags=["satellite"])
STAC_URL = "https://planetarycomputer.microsoft.com/api/stac/v1"
YEARS = range(2016, 2026)
MAX_SPATIAL_CELLS_PER_SIDE = 24
BARE_SOIL_NDVI = 0.2
DENSE_VEGETATION_NDVI = 0.86

class FarmRequest(BaseModel):
    geometry: dict

def validate_polygon(geometry):
    if geometry.get("type") != "Polygon":
        raise HTTPException(400, "Draw a single farm polygon or rectangle.")
    rings = geometry.get("coordinates")
    if not isinstance(rings, list) or not rings or len(rings[0]) < 4:
        raise HTTPException(400, "Invalid farm polygon.")
    pts = [p for ring in rings for p in ring]
    if len(pts) > 2000:
        raise HTTPException(400, "Polygon has too many vertices.")
    for p in pts:
        if len(p) < 2 or not all(isinstance(x, (int, float)) and math.isfinite(x) for x in p[:2]):
            raise HTTPException(400, "Invalid coordinates.")
        if abs(p[0]) > 180 or abs(p[1]) > 90:
            raise HTTPException(400, "Coordinates outside longitude/latitude range.")
    xs = [p[0] for p in pts]
    ys = [p[1] for p in pts]
    if max(xs)-min(xs) > 0.2 or max(ys)-min(ys) > 0.2:
        raise HTTPException(400, "Farm polygon too large (maximum ~20 km).")
    return [min(xs), min(ys), max(xs), max(ys)]

def read_farm_band(asset, geometry, max_pixels=650):
    with rasterio.Env(GDAL_DISABLE_READDIR_ON_OPEN="YES", GDAL_HTTP_MAX_RETRY="2"):
        with rasterio.open(asset.href) as src:
            projected = transform_geom("EPSG:4326", src.crs, geometry)
            coords = [p for ring in projected["coordinates"] for p in ring]
            xs = [p[0] for p in coords]
            ys = [p[1] for p in coords]
            win = from_bounds(min(xs), min(ys), max(xs), max(ys), src.transform)
            win = win.round_offsets().round_lengths()
            win = Window(max(0, win.col_off), max(0, win.row_off),
                         min(src.width-max(0, win.col_off), max(1, win.width)),
                         min(src.height-max(0, win.row_off), max(1, win.height)))
            if win.width <= 0 or win.height <= 0:
                raise ValueError("Farm is outside Landsat scene")
            if win.width > max_pixels or win.height > max_pixels:
                raise ValueError("Farm is too large to process at full resolution")
            data = src.read(1, window=win)
            mask = geometry_mask([projected], out_shape=data.shape,
                                 transform=window_transform(win, src.transform),
                                 invert=True)
            return data, mask, window_transform(win, src.transform), src.crs


def build_spatial_cells(ndvi, valid, raster_transform, raster_crs):
    """Aggregate valid Landsat pixels into a bounded map-ready grid."""
    rows, cols = np.nonzero(valid)
    if not len(rows):
        return []

    block_size = max(
        1,
        math.ceil(max(valid.shape) / MAX_SPATIAL_CELLS_PER_SIDE),
    )
    blocks_per_row = math.ceil(valid.shape[1] / block_size)
    block_ids = (rows // block_size) * blocks_per_row + cols // block_size
    order = np.argsort(block_ids)
    sorted_ids = block_ids[order]
    starts = np.r_[0, np.flatnonzero(np.diff(sorted_ids)) + 1]
    ends = np.r_[starts[1:], len(order)]

    pixel_width = math.hypot(raster_transform.a, raster_transform.d)
    pixel_height = math.hypot(raster_transform.b, raster_transform.e)
    cell_data = []

    for start, end in zip(starts, ends):
        pixel_indices = order[start:end]
        cell_rows = rows[pixel_indices]
        cell_cols = cols[pixel_indices]
        block_row = int(cell_rows[0] // block_size)
        block_col = int(cell_cols[0] // block_size)
        row_start = block_row * block_size
        col_start = block_col * block_size
        row_size = min(block_size, valid.shape[0] - row_start)
        col_size = min(block_size, valid.shape[1] - col_start)

        x, y = raster_transform * (
            col_start + col_size / 2,
            row_start + row_size / 2,
        )
        radius_meters = math.hypot(
            pixel_width * col_size,
            pixel_height * row_size,
        ) / 2
        cell_data.append({
            "x": x,
            "y": y,
            "radiusMeters": round(radius_meters, 1),
            "ndvi": round(float(np.median(ndvi[cell_rows, cell_cols])), 3),
            "validPixels": int(len(pixel_indices)),
        })

    longitudes, latitudes = transform_coords(
        raster_crs,
        "EPSG:4326",
        [cell["x"] for cell in cell_data],
        [cell["y"] for cell in cell_data],
    )
    return [
        {
            "lat": round(latitude, 7),
            "lon": round(longitude, 7),
            "radiusMeters": cell["radiusMeters"],
            "ndvi": cell["ndvi"],
            "validPixels": cell["validPixels"],
        }
        for cell, latitude, longitude in zip(cell_data, latitudes, longitudes)
    ]

def compute_scene(item, geometry):
    signed = planetary_computer.sign(item)
    assets = signed.assets
    if not all(k in assets for k in ("red", "nir08", "qa_pixel")):
        return None
    red, inside, raster_transform, raster_crs = read_farm_band(
        assets["red"], geometry
    )
    nir, inside_nir, _, _ = read_farm_band(assets["nir08"], geometry)
    qa, inside_qa, _, _ = read_farm_band(assets["qa_pixel"], geometry)
    # Landsat C2 L2: reflectance = DN * 0.0000275 - 0.2.
    r = red.astype("float32") * 0.0000275 - 0.2
    n = nir.astype("float32") * 0.0000275 - 0.2
    # QA bits 0..5: fill, dilated cloud, cirrus, cloud, shadow, snow.
    # bit 7: water. Exclude all to estimate vegetation over land.
    clean = ((qa & 0b111111) == 0) & ((qa & 128) == 0)
    valid = inside & inside_nir & inside_qa & clean & (red != 0) & (nir != 0)
    valid &= (r > 0) & (n > 0) & ((r+n) > 0.01)
    if valid.sum() < 3:
        return None
    ndvi_grid = np.full(red.shape, np.nan, dtype="float32")
    np.divide(n-r, n+r, out=ndvi_grid, where=(n+r) != 0)
    valid &= np.isfinite(ndvi_grid)
    if valid.sum() < 3:
        return None
    ndvi_values = ndvi_grid[valid]
    if len(ndvi_values) < 3:
        return None
    vegetation_fraction = np.clip(
        (ndvi_values - BARE_SOIL_NDVI)
        / (DENSE_VEGETATION_NDVI - BARE_SOIL_NDVI),
        0,
        1,
    ) ** 2
    cells = build_spatial_cells(
        ndvi_grid,
        valid,
        raster_transform,
        raster_crs,
    )
    return {"ndvi": round(float(np.median(ndvi_values)), 3),
            "canopyCoverPercent": round(
                float(np.median(vegetation_fraction) * 100)
            ),
            "validPixels": int(len(ndvi_values)),
            "cells": cells,
            "date": item.datetime.date().isoformat(),
            "sceneId": item.id}

def process_year(year, bbox, geometry):
    # Use the full calendar year; the selected scene date is reported because
    # vegetation stages can differ between years.
    client = pystac_client.Client.open(STAC_URL)
    search = client.search(collections=["landsat-c2-l2"], bbox=bbox,
        datetime=f"{year}-01-01/{year}-12-31",
        query={"eo:cloud_cover": {"lt": 55}},
        max_items=80)
    items = list(search.items())
    # Prefer lowest scene-level cloud fraction, try several because local clouds differ.
    items.sort(key=lambda i: i.properties.get("eo:cloud_cover", 100))
    for item in items[:6]:
        try:
            result = compute_scene(item, geometry)
            if result:
                return {"date": str(year), "phase": "Calendar-year observation",
                        "ndvi": result["ndvi"], "observationCount": 1,
                        "canopyCoverPercent": result["canopyCoverPercent"],
                        "sceneDate": result["date"], "sceneId": result["sceneId"],
                        "validPixels": result["validPixels"],
                        "cells": result["cells"]}
        except Exception:
            continue
    return {"date": str(year), "phase": "No usable clear scene",
            "ndvi": None, "observationCount": 0, "sceneDate": None,
            "validPixels": 0, "cells": []}

@router.post("/history")
def satellite_history(request: FarmRequest):
    bbox = validate_polygon(request.geometry)
    results = {}
    try:
        with ThreadPoolExecutor(max_workers=3) as pool:
            jobs = {pool.submit(process_year, y, bbox, request.geometry): y for y in YEARS}
            for job in as_completed(jobs):
                year = jobs[job]
                try:
                    results[year] = job.result()
                except Exception as exc:
                    results[year] = {"date": str(year), "phase": "Data access failed",
                        "ndvi": None, "observationCount": 0, "sceneDate": None,
                        "validPixels": 0, "cells": []}
    except Exception as exc:
        raise HTTPException(502, f"Landsat service unavailable: {exc}")
    timeline = [results[y] for y in YEARS]
    return {"source": "USGS/NASA Landsat Collection 2 Level-2 via Microsoft Planetary Computer",
            "method": "Cloud-masked NDVI and NDVI-derived canopy estimate from one selected clear scene anywhere in each calendar year",
            "canopyCoverMethod": (
                "Approximate fractional vegetation cover from NDVI using "
                "bare-soil and dense-vegetation reference values; not "
                "field-calibrated"
            ),
            "resolutionMeters": 30, "timeline": timeline}
