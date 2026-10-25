import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import area from "@turf/area";
import { Satellite, Calendar, MapPin } from "lucide-react";
import { apiUrl } from "../services/apiBase";

export default function SatelliteMap({ activeField, savedFarmData, onFarmDataChange, currentLang }) {
  const savedData = savedFarmData?.fieldId === activeField.id ? savedFarmData : null;
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const ndviLayerGroupRef = useRef(null);
  const stressMarkersRef = useRef(null);
  const gpsMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const baseLayerRef = useRef(null);
  const drawnBoundaryRef = useRef(null);
  const [farmBoundary, setFarmBoundary] = useState(savedData?.geometry ?? null);
  const [farmAreaAcres, setFarmAreaAcres] = useState(savedData?.areaAcres ?? null);
  const [history, setHistory] = useState(savedData?.timeline ?? []);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const [activeBaseLayer, setActiveBaseLayer] = useState('satellite'); // 'satellite' | 'modis' | 'osm'
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState(0);
  const [showNdviOverlay, setShowNdviOverlay] = useState(true);
  const [showStressZones, setShowStressZones] = useState(true);
  const [ndviOpacity, setNdviOpacity] = useState(0.65);
  const [clickedCoord, setClickedCoord] = useState(null);

  const isGps = Boolean(activeField?.isGpsLocation || activeField?.id === 'gps-current-location');
  const timeline = history;
  const currentSnapshot = timeline[Math.min(selectedTimelineIndex, timeline.length - 1)] ?? null;
  const validObservations = timeline.filter((item) => Number.isFinite(item.ndvi));
  const firstObservation = validObservations[0] ?? null;
  const lastObservation = validObservations[validObservations.length - 1] ?? null;
  const ndviChange = firstObservation && lastObservation
    ? lastObservation.ndvi - firstObservation.ndvi
    : null;
  const canopyCoverPercent = currentSnapshot?.canopyCoverPercent;
  const vegetationStatus = currentSnapshot?.ndvi == null
    ? "Not available"
    : currentSnapshot.ndvi < 0.2
      ? "Little vegetation"
      : currentSnapshot.ndvi < 0.35
        ? "Potential stress"
        : currentSnapshot.ndvi < 0.55
          ? "Moderate vegetation"
          : "High vegetation";
  const lat = Number(activeField?.lat);
  const lon = Number(activeField?.lon);
  const validCoords = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

  useEffect(() => {
    onFarmDataChange?.({
      fieldId: activeField.id,
      geometry: farmBoundary,
      areaAcres: farmAreaAcres,
      timeline: history,
      loading: historyLoading,
      error: historyError
    });
  }, [activeField.id, farmBoundary, farmAreaAcres, history, historyLoading, historyError, onFarmDataChange]);

  // Create Leaflet map only once. Coordinates are updated by a separate effect.
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;
    const initialLat = validCoords ? lat : 20;
    const initialLon = validCoords ? lon : 0;
    const map = L.map(mapContainerRef.current, {
      center: [initialLat, initialLon],
      zoom: 15,
      zoomControl: false,
      attributionControl: true
    });
    mapInstanceRef.current = map;

    baseLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      maxZoom: 19,
      attribution: 'Imagery © Esri and contributors'
    }).addTo(map);

    // Layer groups for dynamic overlays
    const ndviGroup = L.layerGroup().addTo(map);
    const stressGroup = L.layerGroup().addTo(map);
    ndviLayerGroupRef.current = ndviGroup;
    stressMarkersRef.current = stressGroup;

    // User-drawn boundary: separate from preset polygons.
    map.pm.addControls({ position: "topright", drawMarker: false, drawCircleMarker: false,
      drawCircle: false, drawPolyline: false, drawText: false, drawRectangle: true,
      drawPolygon: true, editMode: true, dragMode: false, cutPolygon: false,
      removalMode: true, rotateMode: false });

    const updateBoundary = (layer) => {
      const feature = layer.toGeoJSON();
      if (feature.geometry?.type !== "Polygon") return;
      const acres = area(feature) / 4046.8564224;
      setFarmBoundary(feature.geometry);
      setFarmAreaAcres(acres);
      layer.bindPopup(`Farm Area: ${acres.toFixed(2)} acres`).openPopup();
    };
    const removeBoundaryState = (layer) => {
      if (drawnBoundaryRef.current !== layer) return;
      drawnBoundaryRef.current = null;
      setFarmBoundary(null);
      setFarmAreaAcres(null);
      setHistory([]);
      setHistoryError("");
    };
    const bindBoundaryEvents = (layer) => {
      layer.on("pm:edit", () => updateBoundary(layer));
      layer.on("pm:remove", () => removeBoundaryState(layer));
    };

    map.on("pm:create", ({ layer }) => {
      if (drawnBoundaryRef.current && map.hasLayer(drawnBoundaryRef.current))
        map.removeLayer(drawnBoundaryRef.current);
      drawnBoundaryRef.current = layer;
      bindBoundaryEvents(layer);
      updateBoundary(layer);
    });

    if (farmBoundary) {
      const restoredLayer = L.geoJSON({
        type: "Feature",
        properties: {},
        geometry: farmBoundary
      }, {
        style: { color: "#3b82f6", weight: 3, fillColor: "#3b82f6", fillOpacity: 0.12 }
      }).getLayers()[0];
      if (restoredLayer) {
        drawnBoundaryRef.current = restoredLayer;
        bindBoundaryEvents(restoredLayer);
        const acres = farmAreaAcres ?? area(restoredLayer.toGeoJSON()) / 4046.8564224;
        restoredLayer.bindPopup(`Farm Area: ${acres.toFixed(2)} acres`);
        restoredLayer.addTo(map);
      }
    }

    // Map click listener
    map.on('click', (e) => {
      setClickedCoord({
        lat: e.latlng.lat.toFixed(5),
        lon: e.latlng.lng.toFixed(5),
        selected: true
      });
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Fetch real, cloud-filtered Landsat NDVI for the drawn farm boundary.
  useEffect(() => {
    if (!farmBoundary) { setHistory([]); setHistoryError(""); return; }
    const controller = new AbortController();
    async function load() {
      setHistoryLoading(true); setHistoryError("");
      try {
        const response = await fetch(apiUrl("/api/satellite/history"), {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ geometry: farmBoundary }), signal: controller.signal
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.detail || "Satellite history unavailable");
        const nextTimeline = result.timeline || [];
        setHistory(nextTimeline);
        setSelectedTimelineIndex(Math.max(
          0,
          nextTimeline.findLastIndex((item) => item.ndvi != null)
        ));
      } catch (err) {
        if (err.name !== "AbortError") setHistoryError(err.message);
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    }
    load();
    return () => controller.abort();
  }, [farmBoundary]);

  // Fly to new coordinates and update marker and GPS accuracy radius.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !validCoords) return;
    map.flyTo([lat, lon], activeBaseLayer === 'modis' ? 9 : 15, { animate: true, duration: 1.5 });
    if (gpsMarkerRef.current) map.removeLayer(gpsMarkerRef.current);
    if (accuracyCircleRef.current) map.removeLayer(accuracyCircleRef.current);
    gpsMarkerRef.current = L.circleMarker([lat, lon], {
      radius: 9, color: '#ffffff', weight: 2, fillColor: '#0284c7', fillOpacity: 1
    }).addTo(map).bindPopup(isGps ? 'Detected GPS position' : 'Selected field location');
    const accuracy = Number(activeField?.accuracy);
    if (isGps && Number.isFinite(accuracy) && accuracy > 0) {
      accuracyCircleRef.current = L.circle([lat, lon], {
        radius: accuracy, color: '#38bdf8', weight: 1, fillColor: '#38bdf8', fillOpacity: 0.12
      }).addTo(map);
    }
  }, [lat, lon, validCoords, isGps, activeField?.accuracy, activeBaseLayer]);

  // Keep field boundaries synchronized without recreating the map.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (polygonLayerRef.current) {
      map.removeLayer(polygonLayerRef.current);
      polygonLayerRef.current = null;
    }
    const bounds = !isGps && activeField?.polygonBounds;
    if (Array.isArray(bounds) && bounds.length >= 3) {
      polygonLayerRef.current = L.polygon(bounds, {
        color: '#10b981', weight: 3, fillColor: '#10b981', fillOpacity: 0.15, dashArray: '4, 4'
      }).addTo(map);
    }
  }, [activeField?.polygonBounds, isGps]);

  // Switch satellite, MODIS, and street map layers.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (baseLayerRef.current) map.removeLayer(baseLayerRef.current);
    const sources = {
      satellite: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', 19, 'Imagery © Esri and contributors'],
      modis: ['https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/MODIS_Terra_CorrectedReflectance_TrueColor/default/2026-03-01/GoogleMapsCompatible_Level9/{z}/{y}/{x}.jpg', 9, 'NASA GIBS MODIS Terra (2026-03-01)'],
      osm: ['https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', 19, '© OpenStreetMap contributors']
    };
    const [url, maxZoom, attribution] = sources[activeBaseLayer];
    baseLayerRef.current = L.tileLayer(url, { maxZoom, attribution }).addTo(map);
    if (map.getZoom() > maxZoom) map.setZoom(maxZoom);
  }, [activeBaseLayer]);

  useEffect(() => {
    setSelectedTimelineIndex(Math.max(
      0,
      timeline.findLastIndex((item) => item.ndvi != null)
    ));
  }, [activeField?.id]);

  // Render the actual spatial NDVI samples returned for the selected year.
  useEffect(() => {
    const ndviGroup = ndviLayerGroupRef.current;
    const stressGroup = stressMarkersRef.current;
    if (!ndviGroup || !stressGroup) return;

    ndviGroup.clearLayers();
    stressGroup.clearLayers();

    const cells = currentSnapshot?.cells ?? [];
    for (const cell of cells) {
      const color = cell.ndvi < 0.2
        ? '#a8a29e'
        : cell.ndvi < 0.35
          ? '#ef4444'
          : cell.ndvi < 0.55
            ? '#eab308'
            : '#10b981';

      if (showNdviOverlay) {
        const sample = L.circle([cell.lat, cell.lon], {
          radius: cell.radiusMeters,
          color,
          weight: 1,
          fillColor: color,
          fillOpacity: ndviOpacity
        });
        sample.bindTooltip(`Landsat NDVI: ${cell.ndvi.toFixed(3)} (${cell.validPixels} valid pixels)`, {
          sticky: true,
          className: 'bg-slate-900 text-white text-xs border border-slate-700'
        });
        ndviGroup.addLayer(sample);
      }

      if (showStressZones && cell.ndvi >= 0.2 && cell.ndvi < 0.35) {
        const stressOutline = L.circle([cell.lat, cell.lon], {
          radius: cell.radiusMeters,
          color: '#f43f5e',
          weight: 3,
          fillOpacity: 0
        });
        stressOutline.bindTooltip(`Potential vegetation stress: NDVI ${cell.ndvi.toFixed(3)}`, {
          sticky: true,
          className: 'bg-slate-900 text-white text-xs border border-rose-500'
        });
        stressGroup.addLayer(stressOutline);
      }
    }
  }, [currentSnapshot, showNdviOverlay, showStressZones, ndviOpacity]);

  return (
    <div className="space-y-4">
      {/* Top Map Control Bar */}
      <div className="glass-panel p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100 font-['Outfit']">
              Earth Observation & NDVI Health Monitor
            </h2>
            <p className="text-xs text-slate-400">
              Satellite base map and cloud-filtered Landsat 8/9 vegetation history for drawn fields
            </p>
          </div>
        </div>

        {/* Base Layer Switcher */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Layer:</span>
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1">
            <button
              onClick={() => setActiveBaseLayer('satellite')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeBaseLayer === 'satellite' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Esri World Imagery
            </button>
            <button
              onClick={() => setActiveBaseLayer('modis')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeBaseLayer === 'modis' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              NASA MODIS Terra
            </button>
            <button
              onClick={() => setActiveBaseLayer('osm')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeBaseLayer === 'osm' ? 'bg-emerald-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Terrain Map
            </button>
          </div>
        </div>
      </div>

      {/* Main Map Viewport & Overlays */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl h-[560px]">
        {/* Leaflet Map DOM Element */}
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Floating Top Left: Health Metrics Card */}
        <div className="absolute top-4 left-4 z-[400] flex flex-col gap-2 max-w-xs">
          <div className="glass-panel-glow p-3.5 rounded-xl text-xs space-y-2">
            <p className="text-[10px] text-amber-300">{isGps ? "Draw a farm boundary to request historical NDVI" : "Draw a farm boundary to request historical NDVI"}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Canopy Health Status
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {vegetationStatus}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <div>
                <p className="text-[10px] text-slate-400">Timeline NDVI</p>
                <p className="text-xl font-black text-emerald-400 font-['Outfit']">
                  {currentSnapshot?.ndvi?.toFixed(3) ?? "N/A"}
                </p>
                <p className="text-[10px] text-slate-400">
                  {currentSnapshot?.observationCount
                    ? `${currentSnapshot.observationCount} usable Landsat scene · ${currentSnapshot.validPixels ?? 0} valid 30 m pixels`
                    : "No usable observations"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Canopy Cover</p>
                <p className="text-xl font-black text-cyan-400 font-['Outfit']">
                  {canopyCoverPercent != null ? `~${canopyCoverPercent}%` : "N/A"}
                </p>
                <p className="text-[10px] text-slate-400">Approx. NDVI-derived cover</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400">
              {currentSnapshot?.validPixels > 0 && currentSnapshot.validPixels < 3
                ? "Very few clear pixels; this estimate is highly uncertain."
                : "Approximate fractional cover from NDVI (bare-soil 0.20, dense canopy 0.86); not field-calibrated."}
            </p>
          </div>

          {/* Toggle Switches */}
          <div className="glass-panel p-2 rounded-xl flex items-center justify-between text-xs gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showNdviOverlay}
                onChange={(e) => setShowNdviOverlay(e.target.checked)}
                className="accent-emerald-500 rounded"
              />
              <span>NDVI Heatmap</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300 hover:text-white">
              <input
                type="checkbox"
                checked={showStressZones}
                onChange={(e) => setShowStressZones(e.target.checked)}
                className="accent-rose-500 rounded"
              />
              <span>Stress Zones</span>
            </label>
          </div>
        </div>

        {/* Floating Top Right: Click Inspector */}
        {clickedCoord && (
          <div className="absolute top-4 right-4 z-[400] glass-panel-glow p-3 rounded-xl max-w-xs text-xs space-y-1 animate-in fade-in">
            <div className="flex items-center justify-between font-bold text-slate-200">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <MapPin className="w-3.5 h-3.5" />
                Spot Coordinate
              </span>
              <button 
                onClick={() => setClickedCoord(null)}
                className="text-slate-400 hover:text-white text-xs px-1"
              >
                ✕
              </button>
            </div>
            <p className="text-slate-300">Lat: {clickedCoord.lat}, Lon: {clickedCoord.lon}</p>
            <p className="text-slate-400 pt-1 border-t border-slate-800">Measured Landsat NDVI is shown on analyzed farm cells; soil moisture is not connected to this map.</p>
          </div>
        )}

        {/* Real-data status; never substitute fabricated NDVI. */}
        <div className="absolute bottom-44 right-4 z-[400] max-w-sm rounded-xl bg-slate-950/90 p-3 text-xs text-white">
          <div>{farmAreaAcres == null ? "Draw a rectangle or polygon to load satellite history." : `Selected farm: ${farmAreaAcres.toFixed(2)} acres`}</div>
          {historyLoading && <div className="text-cyan-300">Retrieving satellite observations...</div>}
          {historyError && <div className="text-amber-300">{historyError}</div>}
          {!historyLoading && !historyError && farmBoundary && history.length === 0 && <div>No usable observations found.</div>}
        </div>

        {/* Floating Bottom: Time-Series Change Detection Slider */}
        <div className="absolute bottom-4 left-4 right-4 z-[400] glass-panel-glow p-4 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">
                Landsat NDVI History (cloud-filtered observations)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Selected Date:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {currentSnapshot?.sceneDate ?? currentSnapshot?.date ?? "N/A"} ({currentSnapshot?.ndvi == null ? "No observation" : `NDVI ${currentSnapshot.ndvi.toFixed(3)}`})
              </span>
            </div>
          </div>

          <p className="mb-2 text-[11px] text-slate-300">
            {historyLoading
              ? "Loading measured observations..."
              : !farmBoundary
                ? "Draw a farm boundary to summarize its available observations."
                : validObservations.length === 0
                  ? "No usable Landsat observations are available; a trend cannot be calculated."
                  : validObservations.length === 1
                    ? `One usable Landsat observation (${firstObservation.sceneDate || firstObservation.date}); not enough data for a trend.`
                    : `NDVI ${ndviChange > 0 ? "increased" : ndviChange < 0 ? "decreased" : "was unchanged"} by ${Math.abs(ndviChange).toFixed(3)} from ${firstObservation.date} (${firstObservation.sceneDate || "scene date unavailable"}) to ${lastObservation.date} (${lastObservation.sceneDate || "scene date unavailable"}). One clear scene anywhere in each calendar year; dates and crop stages may differ.`}
          </p>

          {/* Timeline Range Slider */}
          <div className="relative pt-1">
            <input
              type="range"
              min="0"
              max={Math.max(0, timeline.length - 1)}
              value={selectedTimelineIndex}
              onChange={(e) => setSelectedTimelineIndex(Number(e.target.value))}
              className="w-full accent-emerald-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            {/* Timeline Tick Labels */}
            <div className="flex justify-between text-[10px] text-slate-400 mt-1.5 font-medium px-1">
              {timeline.map((item, idx) => (
                <span 
                  key={idx}
                  className={`cursor-pointer transition-colors ${
                    idx === selectedTimelineIndex ? 'text-emerald-300 font-bold' : 'hover:text-slate-200'
                  }`}
                  onClick={() => setSelectedTimelineIndex(idx)}
                >
                  {item.date}
                </span>
              ))}
            </div>
          </div>

          {/* NDVI Legend Bar */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <span>NDVI Index:</span>
              <div className="flex items-center h-2.5 rounded overflow-hidden w-40 border border-slate-700">
                <span className="w-1/4 h-full bg-[#a8a29e]" title="<0.2 Little or no vegetation"></span>
                <span className="w-1/4 h-full bg-[#ef4444]" title="0.2 - 0.35 Potential vegetation stress"></span>
                <span className="w-1/4 h-full bg-[#eab308]" title="0.35 - 0.55 Moderate"></span>
                <span className="w-1/4 h-full bg-[#10b981]" title=">0.55 High vegetation"></span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a8a29e]"></span> Little vegetation (&lt;0.2)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> Potential stress (0.2–0.35)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#eab308]"></span> Sparse</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span> High vegetation (&gt;0.55)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
