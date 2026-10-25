"""Sentinel Hub Statistical API: polygon-wide cloud-filtered monthly NDVI history."""
import os
from datetime import date
from concurrent.futures import ThreadPoolExecutor
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Any

router = APIRouter(prefix="/api/satellite", tags=["satellite"])
TOKEN_URL = "https://services.sentinel-hub.com/auth/realms/main/protocol/openid-connect/token"
STATS_URL = "https://services.sentinel-hub.com/api/v1/statistics"
EVALSCRIPT = '''//VERSION=3
function setup() {
  return {input: [{bands: ["B04", "B08", "SCL", "dataMask"]}],
          output: [{id: "ndvi", bands: 1, sampleType: "FLOAT32"},
                   {id: "dataMask", bands: 1}]};
}
function evaluatePixel(s) {
  const good = s.dataMask === 1 && [4,5,6,7].includes(s.SCL);
  const denom = s.B08 + s.B04;
  return {ndvi: [good && denom > 0 ? (s.B08 - s.B04) / denom : 0],
          dataMask: [good && denom > 0 ? 1 : 0]};
}'''

class HistoryRequest(BaseModel):
    geometry: dict[str, Any]

def validate_polygon(g):
    if g.get("type") != "Polygon":
        raise HTTPException(400, "Draw one polygon or rectangle")
    rings = g.get("coordinates")
    if not isinstance(rings, list) or not rings or not isinstance(rings[0], list):
        raise HTTPException(400, "Invalid polygon coordinates")
    if len(rings[0]) < 4 or len(rings[0]) > 150:
        raise HTTPException(400, "Polygon must have 3–149 vertices")
    for ring in rings:
        for point in ring:
            if len(point) < 2 or not (-180 <= point[0] <= 180 and -90 <= point[1] <= 90):
                raise HTTPException(400, "Invalid longitude or latitude")
    return g

@router.post("/history")
def satellite_history(body: HistoryRequest):
    geometry = validate_polygon(body.geometry)
    client_id = os.getenv("SENTINEL_HUB_CLIENT_ID")
    client_secret = os.getenv("SENTINEL_HUB_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(503, "Configure SENTINEL_HUB_CLIENT_ID and SENTINEL_HUB_CLIENT_SECRET in the backend")
    try:
        token_response = requests.post(TOKEN_URL, data={"grant_type": "client_credentials",
            "client_id": client_id, "client_secret": client_secret}, timeout=25)
        token_response.raise_for_status()
        token = token_response.json()["access_token"]
    except (requests.RequestException, KeyError, ValueError):
        raise HTTPException(502, "Satellite service authentication failed")

    # Last 10 complete calendar years; current year can be added later as partial.
    end_year = date.today().year - 1
    years = list(range(end_year - 9, end_year + 1))
    headers = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

    def get_year(year):
        payload = {
            "input": {"bounds": {"geometry": geometry}, "data": [{"type": "sentinel-2-l2a"}]},
            "aggregation": {"timeRange": {"from": f"{year}-01-01T00:00:00Z",
                                           "to": f"{year + 1}-01-01T00:00:00Z"},
                            "aggregationInterval": {"of": "P1M"},
                            "evalscript": EVALSCRIPT,
                            "resx": 20, "resy": 20},
            "calculations": {"ndvi": {"statistics": {"default": {"percentiles": {"k": [50]}}}}}
        }
        response = requests.post(STATS_URL, headers=headers, json=payload, timeout=90)
        response.raise_for_status()
        monthly = []
        for item in response.json().get("data", []):
            output = item.get("outputs", {}).get("ndvi", {}).get("bands", {}).get("B0", {})
            stats = output.get("stats", {})
            mean = stats.get("mean")
            valid = stats.get("sampleCount", 0) - stats.get("noDataCount", 0)
            if mean is not None and valid > 0:
                monthly.append((float(mean), int(valid)))
        # Each monthly mean is weighted by number of usable pixels (not a pixel-perfect yearly mosaic).
        total = sum(count for _, count in monthly)
        return {"date": str(year), "ndvi": round(sum(v*c for v,c in monthly)/total, 3) if total else None,
                "observationCount": len(monthly)}

    try:
        with ThreadPoolExecutor(max_workers=3) as pool:
            timeline = list(pool.map(get_year, years))
    except requests.RequestException:
        raise HTTPException(502, "Sentinel Hub statistics request failed; check API access, quota, and polygon")
    return {"source": "Sentinel-2 L2A via Sentinel Hub Statistical API",
            "method": "SCL cloud-masked NDVI; weighted monthly pixel means",
            "timeline": timeline}
