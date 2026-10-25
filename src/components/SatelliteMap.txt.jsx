import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import area from "@turf/area";
import { Satellite, Calendar, AlertTriangle, MapPin } from "lucide-react";

export default function SatelliteMap({ activeField, currentLang }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polygonLayerRef = useRef(null);
  const ndviLayerGroupRef = useRef(null);
  const stressMarkersRef = useRef(null);
  const gpsMarkerRef = useRef(null);
  const accuracyCircleRef = useRef(null);
  const baseLayerRef = useRef(null);

  const [activeBaseLayer, setActiveBaseLayer] = useState('satellite'); // 'satellite' | 'modis' | 'osm'
  const [selectedTimelineIndex, setSelectedTimelineIndex] = useState(0);
  const [showNdviOverlay, setShowNdviOverlay] = useState(true);
  const [showStressZones, setShowStressZones] = useState(true);
  const [ndviOpacity, setNdviOpacity] = useState(0.65);
  const [clickedCoord, setClickedCoord] = useState(null);

  const isGps = Boolean(activeField?.isGpsLocation || activeField?.id === 'gps-current-location');
  const satelliteHealth = isGps ? null : activeField?.satelliteHealth;
  const timeline = satelliteHealth?.historicalNdviTimeline ?? [];
  const currentSnapshot = timeline[Math.min(selectedTimelineIndex, timeline.length - 1)] ?? null;
  const lat = Number(activeField?.lat);
  const lon = Number(activeField?.lon);
  const validCoords = Number.isFinite(lat) && Number.isFinite(lon) && Math.abs(lat) <= 90 && Math.abs(lon) <= 180;

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

  // Farm boundary drawing toolbar
  map.pm.addControls({
     position: "topright",
     drawMarker: false,
     drawCircleMarker: false,
     drawCircle: false,
     drawPolyline: false,
     drawText: false,
     drawRectangle: true,
     drawPolygon: true,
     editMode: true,
     dragMode: false,
     cutPolygon: false,
     removalMode: true,
     rotateMode: false,
  });
  map.on("pm:create", (event) => {
     const newLayer = event.layer;

    // Keep only one user-drawn farm boundary.
    if (polygonLayerRef.current) {
        map.removeLayer(polygonLayerRef.current);
      }

  polygonLayerRef.current = newLayer;

  const geojson = newLayer.toGeoJSON();
  const hectares = area(geojson) / 10000;
  const acres = hectares * 2.47105;

  newLayer.bindPopup(
    `Farm Area: ${acres.toFixed(2)} acres (${hectares.toFixed(2)} hectares)`
  ).openPopup();
});

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

  useEffect(() => { setSelectedTimelineIndex(Math.max(0, timeline.length - 1)); }, [activeField?.id]);

  // DEMO overlay only for preset fields; not a measured satellite NDVI product.
  useEffect(() => {
    const ndviGroup = ndviLayerGroupRef.current;
    const stressGroup = stressMarkersRef.current;
    if (!ndviGroup || !stressGroup) return;

    ndviGroup.clearLayers();
    stressGroup.clearLayers();

    if (showNdviOverlay && currentSnapshot && !isGps && Array.isArray(activeField?.polygonBounds) && activeField.polygonBounds.length >= 3) {
      const bounds = activeField.polygonBounds;
      const minLat = Math.min(...bounds.map(b => b[0]));
      const maxLat = Math.max(...bounds.map(b => b[0]));
      const minLon = Math.min(...bounds.map(b => b[1]));
      const maxLon = Math.max(...bounds.map(b => b[1]));

      const centerLat = (minLat + maxLat) / 2;
      const centerLon = (minLon + maxLon) / 2;

      // Color gradient based on current timeline NDVI
      const ndvi = currentSnapshot.ndvi;
      let fillColor = '#10b981'; // Green
      if (ndvi < 0.25) fillColor = '#a8a29e'; // Bare soil
      else if (ndvi < 0.45) fillColor = '#eab308'; // Yellow
      else if (ndvi < 0.65) fillColor = '#22c55e'; // Moderate green
      else fillColor = '#047857'; // High vigor dark green

      // Dynamic sub-zone rectangles
      const latStep = (maxLat - minLat) / 4;
      const lonStep = (maxLon - minLon) / 4;

      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          const subMinLat = minLat + i * latStep;
          const subMaxLat = subMinLat + latStep;
          const subMinLon = minLon + j * lonStep;
          const subMaxLon = subMinLon + lonStep;

          // Localized NDVI variance
          const isStressZone = (i === 3 && j === 3) || (i === 1 && j === 0);
          const cellColor = isStressZone ? '#ef4444' : fillColor;
          const cellOpacity = isStressZone ? ndviOpacity * 0.9 : ndviOpacity * (0.5 + 0.2);

          const rect = L.rectangle([[subMinLat, subMinLon], [subMaxLat, subMaxLon]], {
            color: 'transparent',
            fillColor: cellColor,
            fillOpacity: cellOpacity
          });

          rect.bindTooltip(`Zone [${i + 1},${j + 1}] • NDVI: ${isStressZone ? '0.34 (Stress)' : ndvi}`, {
            sticky: true,
            className: 'bg-slate-900 text-white text-xs border border-slate-700'
          });

          ndviGroup.addLayer(rect);
        }
      }

      // Add stress zone highlight markers if enabled
      if (showStressZones && satelliteHealth?.stressZonesCount > 0) {
        const stressLat = minLat + latStep * 3.5;
        const stressLon = minLon + lonStep * 3.5;

        const pulseCircle = L.circleMarker([stressLat, stressLon], {
          radius: 14,
          color: '#f43f5e',
          weight: 2,
          fillColor: '#ef4444',
          fillOpacity: 0.6
        });

        pulseCircle.bindPopup(`
          <div style="font-family: sans-serif; color: #0f172a; padding: 4px; max-width: 200px;">
            <b style="color: #e11d48; display: block; margin-bottom: 4px;">⚠️ Crop Stress Flagged</b>
            <p style="margin: 0; font-size: 11px;">${satelliteHealth?.stressNotes}</p>
          </div>
        `);

        stressGroup.addLayer(pulseCircle);
      }
    }
  }, [selectedTimelineIndex, showNdviOverlay, showStressZones, ndviOpacity, activeField, currentSnapshot, isGps, satelliteHealth]);

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
              High-resolution satellite view with time-series change detection & stress identification
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
            <p className="text-[10px] text-amber-300">{isGps ? "GPS location: satellite vegetation measurements unavailable" : "Preset demonstration data — not live NDVI"}</p>
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                Canopy Health Status
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {satelliteHealth?.vegetationStatus ?? "Not available"}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800">
              <div>
                <p className="text-[10px] text-slate-400">Timeline NDVI</p>
                <p className="text-xl font-black text-emerald-400 font-['Outfit']">
                  {currentSnapshot?.ndvi ?? "N/A"}
                </p>
                <p className="text-[10px] text-slate-400">{currentSnapshot?.phase ?? "No satellite data"}</p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400">Canopy Cover</p>
                <p className="text-xl font-black text-cyan-400 font-['Outfit']">
                  {satelliteHealth?.canopyCoveragePercent != null ? `${satelliteHealth.canopyCoveragePercent}%` : "N/A"}
                </p>
                <p className="text-[10px] text-slate-400">Estimated Density</p>
              </div>
            </div>

            {/* Stress Zone Alert */}
            {satelliteHealth?.stressZonesCount > 0 && (
              <div className="p-2 rounded-lg bg-rose-950/40 border border-rose-500/30 text-[11px] text-rose-300 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <span>{satelliteHealth?.stressNotes}</span>
              </div>
            )}
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
            <p className="text-slate-400 pt-1 border-t border-slate-800">Clicking the map selects a coordinate for inspection; real NDVI and soil moisture are not yet connected.</p>
          </div>
        )}

        {/* Floating Bottom: Time-Series Change Detection Slider */}
        <div className="absolute bottom-4 left-4 right-4 z-[400] glass-panel-glow p-4 rounded-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-slate-200">
                Vegetation Change Timeline (preset demo data; real NDVI integration pending)
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Selected Date:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {currentSnapshot?.date ?? "N/A"} ({currentSnapshot?.phase ?? "No satellite data"})
              </span>
            </div>
          </div>

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
                <span className="w-1/4 h-full bg-[#a8a29e]" title="<0.2 Bare Soil / Water"></span>
                <span className="w-1/4 h-full bg-[#ef4444]" title="0.2 - 0.35 High Stress"></span>
                <span className="w-1/4 h-full bg-[#eab308]" title="0.35 - 0.55 Moderate"></span>
                <span className="w-1/4 h-full bg-[#10b981]" title=">0.55 High Vigor"></span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#a8a29e]"></span> Fallow (&lt;0.2)</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ef4444]"></span> Crop Stress</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#eab308]"></span> Sparse</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#10b981]"></span> Dense Canopy (&gt;0.7)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
