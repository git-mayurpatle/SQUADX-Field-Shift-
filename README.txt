SQUADX Landsat replacement (no Sentinel Hub keys needed)

1. Copy src/components/SatelliteMap.jsx into your project (back up current file).
2. Copy backend/services/landsat_history.py into your project.
3. In backend/main.py add:
   from services.landsat_history import router as landsat_router
   after app = FastAPI(...): app.include_router(landsat_router)
4. From the backend folder:
   python -m pip install numpy rasterio pystac-client planetary-computer
   python -m uvicorn main:app --reload --port 8000
5. Run Vite as before; draw farm polygon.

Source: USGS/NASA Landsat Collection 2 Level-2, accessed through Microsoft's
public Planetary Computer STAC and signed cloud-hosted imagery.
No API credentials needed for basic access (subject to service rate limits).

IMPORTANT:
- Each year uses ONE selected clear Landsat scene from the full calendar year,
  not an annual composite or full year average. Each result includes its actual
  sceneDate; crop stages may differ between years.
- Each yearly observation includes its polygon median plus spatial NDVI cells
  aggregated from valid land pixels at ~30m resolution. The map displays those
  measured cells as the NDVI heatmap and outlines cells in the configured
  potential-stress NDVI range.
- Canopy cover is an approximate fractional-vegetation estimate derived from
  NDVI using bare-soil (0.20) and dense-vegetation (0.86) reference values. It
  is not a field-calibrated canopy measurement.
- The Esri background is current undated imagery; it is not a historical
  Landsat image layer. Canopy cover is not measured by this endpoint.
- Missing values are null; no fake measurements.
- This is a prepared implementation, not live-tested against your environment.
- A remote request may take a few minutes for ten years.
- Existing /api/satellite/history router from satellite_history.py must NOT
  be registered at the same time as this one.

Soil Health Diagnostics data sources
- SoilGrids v2 supplies modeled soil-property estimates at about 250 m. Most
  displayed chemistry/texture values use the 0-5 cm layer; bulk density uses
  the 15-30 cm layer as a compaction-context proxy, not a compaction diagnosis.
- With GPS coordinates and no drawn field, SoilGrids uses the nearest valid
  pixel to that point and Open-Meteo/DEM use the point itself. Draw a polygon
  for field-area medians and terrain relief.
- Open-Meteo Archive supplies delayed gridded rainfall and soil-moisture
  estimates. They are not real-time field sensor readings.
- Terrain relief is sampled from Copernicus DEM GLO-90 through Open-Meteo's
  elevation API. Relief is context only and is not used as measured slope.
- Soil management practice index is calculated as adopted practices / known
  yes-or-no answers × 100. It summarizes farmer-entered practice adoption; it
  is not a soil-recovery or soil-quality score and is not validated.
- The optional erosion-exposure screen requires farmer-entered slope and
  ground-cover estimates plus complete 90-day rainfall. It combines capped
  slope exposure (slope / 15%, weight 40%), bare-ground fraction (weight 35%),
  and capped rainfall exposure (rainfall / 500 mm, weight 25%). The result is
  an unvalidated relative index only—not RUSLE, a soil-loss estimate, or a
  validated risk class. It must not be used as an engineering or conservation
  prescription.
- SoilGrids bulk density at 15-30 cm is a modeled compaction-context proxy, not
  a diagnosis. The optional penetrometer reading is farmer-entered evidence;
  penetration resistance depends on crop, texture, and moisture. A single
  reading is not a field diagnosis.
- Crop seasonal water-demand values remain catalog references. The optional
  seven-day crop evapotranspiration (ETc) estimate uses Open-Meteo forecast
  reference evapotranspiration (ET₀) multiplied by representative crop
  coefficients, with generic crop-stage durations. These coefficients and
  stages are not locally calibrated; ETc is not net irrigation demand because
  effective rainfall, soil-water depletion, and irrigation efficiency are not
  modeled. Verify crop profiles and actual estimates against local agronomy
  guidance before operational use.
- No validated soil-recovery score, actual erosion-risk estimate, or
  confirmed compaction diagnosis is available. Validate any screening result
  against field observations before making management decisions.

Focused regression checks
- From the project root: node --test src\data\soilScreening.test.js
- From the backend folder: .venv\Scripts\python.exe -m unittest discover -s tests -v
