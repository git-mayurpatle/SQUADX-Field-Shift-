
from pathlib import Path
from functools import lru_cache
import json
import os

import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from services.nasa_power import fetch_nasa_data
from services.geocoding import reverse_geocode
from train_yield_model_improved import origin_rows, prepare
from services.landsat_history import router as landsat_router
from services.soil_water import router as soil_water_router

app = FastAPI(title="Field Shift API")
app.include_router(landsat_router)
app.include_router(soil_water_router)

configured_frontend_origins = [
    origin.strip().rstrip("/")
    for origin in os.getenv("FRONTEND_ORIGINS", "").split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        *configured_frontend_origins,
    ],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/api/health")
def health():
    return {"status": "ok"}


@app.get("/api/nasa")
def nasa(lat: float, lon: float):
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    try:
        return fetch_nasa_data(lat, lon)
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Unable to retrieve NASA observations",
        )


@app.get("/api/location")
def get_location(lat: float, lon: float):
    if not (-90 <= lat <= 90 and -180 <= lon <= 180):
        raise HTTPException(status_code=400, detail="Invalid coordinates")

    try:
        return reverse_geocode(lat, lon)
    except Exception:
        raise HTTPException(
            status_code=502,
            detail="Location name unavailable",
        )


MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "faostat_yield_model_improved.joblib"
)
EVALUATION_PATH = MODEL_PATH.with_name("evaluation_improved.json")
DATASET_PATH = (
    Path(__file__).resolve().parent
    / "datasets"
    / "raw"
    / "faostat_yield_cleaned.csv"
)


@lru_cache(maxsize=1)
def load_yield_model():
    if not MODEL_PATH.is_file():
        raise FileNotFoundError(
            f"Model file not found: {MODEL_PATH}"
        )
    return joblib.load(MODEL_PATH)


@lru_cache(maxsize=1)
def load_yield_evaluation():
    if not EVALUATION_PATH.is_file():
        return None
    report = json.loads(EVALUATION_PATH.read_text(encoding="utf-8"))
    test_metrics = report.get("test_2023_2024")
    if not test_metrics:
        return None
    return {
        "forecast_years": [2023, 2024],
        "examples": report.get("test_examples"),
        **test_metrics,
    }


@lru_cache(maxsize=1)
def load_held_out_actuals():
    if not DATASET_PATH.is_file():
        return {}
    frame = prepare(DATASET_PATH)
    held_out = frame.loc[frame["Year"].between(2023, 2024)]
    return {
        (row.Area, row.Item, int(row.Year)): float(row.Value)
        for row in held_out.itertuples(index=False)
    }


@app.get("/api/predict/options")
def prediction_options():
    try:
        artifact = load_yield_model()
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Trained yield model unavailable",
        )

    return {
        "areas": artifact["known_areas"],
        "crops": artifact["known_crops"],
        "available_years": [2023, 2024],
        "scope": "Country-level historical backtest",
    }


@app.get("/api/predict")
def predict_yield(area: str, crop: str, year: int = 2023):
    if year not in (2023, 2024):
        raise HTTPException(
            status_code=400,
            detail="This model currently supports only 2023 and 2024 historical backtests",
        )

    try:
        artifact = load_yield_model()
    except Exception:
        raise HTTPException(
            status_code=503,
            detail="Trained yield model unavailable",
        )

    if area not in artifact["known_areas"]:
        raise HTTPException(
            status_code=400,
            detail="Unknown country/area. Check /api/predict/options",
        )

    if crop not in artifact["known_crops"]:
        raise HTTPException(
            status_code=400,
            detail="Unknown crop. Check /api/predict/options",
        )

    history = artifact["historical_data"]

    # Generate exactly the historical features used during training.
    features = origin_rows(
        history,
        origin=2022,
        horizons=(year - 2022,),
    )

    selected = features.loc[
        (features["Area"] == area)
        & (features["Item"] == crop)
        & (features["Year"] == year)
    ]

    if selected.empty:
        raise HTTPException(
            status_code=404,
            detail="Insufficient historical yield data for this country and crop",
        )

    row = selected.iloc[[0]]
    model_features = artifact["features"]

    try:
        ml_yield = max(
            0.0,
            float(artifact["model"].predict(row[model_features])[0]),
        )
    except Exception:
        raise HTTPException(
            status_code=500,
            detail="Unable to generate yield estimate",
        )

    baseline_yield = float(row.iloc[0]["last_yield"])
    evaluation = load_yield_evaluation()
    observed_yield = load_held_out_actuals().get((area, crop, year))

    return {
        "area": area,
        "crop": crop,
        "year": year,
        "unit": "kg/ha",
        "recommended_method": "last_observed_baseline",
        "recommended_yield": round(baseline_yield, 2),
        "ml_model": "Random Forest",
        "ml_predicted_yield": round(ml_yield, 2),
        "baseline_predicted_yield": round(baseline_yield, 2),
        "observed_yield": (
            round(observed_yield, 2) if observed_yield is not None else None
        ),
        "observed_yield_source": (
            "Bundled FAOSTAT yield dataset"
            if observed_yield is not None
            else None
        ),
        "scope": "Country-level historical backtest",
        "historical_origin_year": 2022,
        "aggregate_backtest": evaluation,
        "is_farm_level_prediction": False,
        "uses_nasa_or_soil_data": False,
        "warning": (
            "Historical evaluation only. These estimates are not "
            "validated forecasts for 2026 or for an individual farm."
        ),
    }
