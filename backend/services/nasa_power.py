import json
import requests
import pandas as pd
from datetime import date, timedelta

NASA_URL = "https://power.larc.nasa.gov/api/temporal/daily/point"
OPEN_METEO_URL = "https://archive-api.open-meteo.com/v1/archive"

PARAMETERS = [
    "T2M",
    "T2M_MAX",
    "T2M_MIN",
    "RH2M",
    "WS2M",
    "ALLSKY_SFC_SW_DWN"
]
LOOKBACK_DAYS = 90

def fetch_nasa_data(lat, lon):
    # Use an inclusive 90-day historical window ending 10 days ago.
    end = date.today() - timedelta(days=10)
    start = end - timedelta(days=LOOKBACK_DAYS - 1)

    params = {
        "latitude": lat,
        "longitude": lon,
        "start": start.strftime("%Y%m%d"),
        "end": end.strftime("%Y%m%d"),
        "community": "AG",
        "parameters": ",".join(PARAMETERS),
        "format": "JSON"
    }

    response = requests.get(
        NASA_URL, params=params, timeout=90
    )
    response.raise_for_status()

    payload = response.json()
    raw = payload["properties"]["parameter"]

    df = pd.DataFrame(raw)
    df.index.name = "date"
    df = df.replace(-999, float("nan"))

    quality_warnings = []
    rainfall_params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "daily": "precipitation_sum",
        "timezone": "Asia/Kolkata",
    }
    try:
        rainfall_response = requests.get(
            OPEN_METEO_URL, params=rainfall_params, timeout=90
        )
        rainfall_response.raise_for_status()
        rainfall_data = rainfall_response.json()["daily"]
        rainfall_by_date = {
            date_key.replace("-", ""): value
            for date_key, value in zip(
                rainfall_data["time"], rainfall_data["precipitation_sum"]
            )
            if value is not None
        }
        df["PRECIPITATION_MM"] = pd.Series(rainfall_by_date)
        if len(rainfall_by_date) != LOOKBACK_DAYS:
            quality_warnings.append(
                "Open-Meteo ERA5-Land returned incomplete daily rainfall coverage."
            )
    except (requests.RequestException, KeyError, TypeError, ValueError):
        df["PRECIPITATION_MM"] = float("nan")
        quality_warnings.append(
            "Open-Meteo ERA5-Land rainfall is temporarily unavailable; temperature and humidity are still from NASA POWER."
        )

    return {
        "latitude": lat,
        "longitude": lon,
        "source": "NASA POWER (temperature and humidity) + Open-Meteo (rainfall)",
        "precipitation_source": "Open-Meteo Historical Weather API (best-match daily precipitation, mm)",
        "period": {
            "start": str(start),
            "end": str(end),
            "days": LOOKBACK_DAYS
        },
        "quality_warnings": quality_warnings,
        "summary": {
            "avg_temperature_c": round(
                float(df["T2M"].mean()), 2
            ),
            "total_rainfall_mm": round(float(df["PRECIPITATION_MM"].sum()), 2)
            if df["PRECIPITATION_MM"].notna().all() else None,
            "avg_humidity_percent": round(
                float(df["RH2M"].mean()), 2
            )
        },
        "daily_data": json.loads(
    df.reset_index().to_json(
        orient="records",
        date_format="iso"
    )
)
    }
