import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { 
  Box, 
  Layers, 
  Sun, 
  CloudRain, 
  Flame, 
  RotateCcw, 
  Sparkles,
  Info
} from 'lucide-react';
import { CROPS } from '../data/cropsData';

const EMPTY_NDVI_CELLS = Object.freeze([]);

function updateCameraPosition(cameraRef, cameraAngleRef) {
  if (!cameraRef.current) return;
  const { theta, phi, radius } = cameraAngleRef.current;
  cameraRef.current.position.x = radius * Math.sin(phi) * Math.sin(theta);
  cameraRef.current.position.y = radius * Math.cos(phi);
  cameraRef.current.position.z = radius * Math.sin(phi) * Math.cos(theta);
  cameraRef.current.lookAt(0, 1, 0);
}

function createTerrainMaterial(mode, cells = [], latitude = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  if (mode === 'ndvi' && cells.length) {
    ctx.fillStyle = '#263626';
    ctx.fillRect(0, 0, 512, 512);

    const longitudes = cells.map((cell) => cell.lon);
    const latitudes = cells.map((cell) => cell.lat);
    const minLon = Math.min(...longitudes);
    const maxLon = Math.max(...longitudes);
    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const lonSpan = maxLon - minLon || 0.00001;
    const latSpan = maxLat - minLat || 0.00001;
    const maxCellRadius = Math.max(...cells.map((cell) => cell.radiusMeters || 0));
    const extentMeters = Math.max(
      lonSpan * 111_320 * Math.cos((latitude * Math.PI) / 180),
      latSpan * 111_320,
      maxCellRadius * 2,
    );
    const colorForNdvi = (ndvi) => ndvi < 0.2
      ? '#a8a29e'
      : ndvi < 0.35
        ? '#ef4444'
        : ndvi < 0.55
          ? '#eab308'
          : '#10b981';

    for (const cell of cells) {
      const x = ((cell.lon - minLon) / lonSpan) * 512;
      const y = ((maxLat - cell.lat) / latSpan) * 512;
      const radius = Math.max(5, ((cell.radiusMeters || 30) * 512) / extentMeters);
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = colorForNdvi(cell.ndvi);
      ctx.globalAlpha = 0.9;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (mode === 'stress') {
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#1e293b');
    grad.addColorStop(0.4, '#0284c7');
    grad.addColorStop(0.7, '#f59e0b');
    grad.addColorStop(1, '#ef4444');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);
  } else {
    ctx.fillStyle = '#261a12';
    ctx.fillRect(0, 0, 512, 512);
    ctx.strokeStyle = '#382517';
    ctx.lineWidth = 6;
    for (let i = 0; i < 512; i += 20) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(512, i);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  return new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.85,
    metalness: 0.1,
  });
}

function rebuildCropRows(group, stagePercent, numRows, mode, cropId) {
  while (group.children.length > 0) {
    const obj = group.children[0];
    group.remove(obj);
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) obj.material.dispose();
  }
  if (!cropId) return;

  const scale = (stagePercent / 100) * 1.5 + 0.2;
  const cropHeights = {
    maize: 2.2,
    soybean: 0.9,
    wheat: 1.25,
    cotton: 1.1,
    chickpea: 0.75,
    rice: 1.35,
    mustard: 1.3,
    millets: 1.15,
    pigeonpea: 1.8,
    moong: 0.65,
    cloverCover: 0.45,
  };
  const plantHeight = (cropHeights[cropId] ?? 1.1) * scale;
  const rowSpacing = 30 / numRows;
  const plantSpacing = 1.6;
  let plantColor = 0x22c55e;
  if (mode === 'ndvi') plantColor = 0x10b981;
  else if (mode === 'stress') plantColor = 0xf59e0b;

  const stemGeo = new THREE.CylinderGeometry(0.04 * scale, 0.07 * scale, plantHeight, 6);
  const leafGeo = new THREE.ConeGeometry(
    (cropId === 'maize' ? 0.65 : 0.4) * scale,
    (cropId === 'maize' ? 0.55 : 0.8) * scale,
    5,
  );
  const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d, roughness: 0.6 });
  const leafMat = new THREE.MeshStandardMaterial({ color: plantColor, roughness: 0.5 });

  for (let row = 0; row < numRows; row++) {
    const zPos = (row - numRows / 2) * rowSpacing;
    for (let x = -15; x <= 15; x += plantSpacing) {
      const plantObj = new THREE.Group();
      const elevation = Math.sin(x * 0.18) * Math.cos(zPos * 0.18) * 1.4
        + Math.sin(x * 0.35 + zPos * 0.2) * 0.6;
      const stem = new THREE.Mesh(stemGeo, stemMat);
      stem.position.y = plantHeight / 2;
      stem.castShadow = true;
      plantObj.add(stem);

      const leafCount = cropId === 'maize' ? 4 : cropId === 'wheat' || cropId === 'rice' ? 2 : 5;
      for (let leafIndex = 0; leafIndex < leafCount; leafIndex++) {
        const leaf = new THREE.Mesh(leafGeo, leafMat);
        const angle = (leafIndex / leafCount) * Math.PI * 2;
        leaf.position.set(
          Math.cos(angle) * (cropId === 'maize' ? 0.32 : 0.18) * scale,
          plantHeight * (0.45 + (leafIndex % 3) * 0.1),
          Math.sin(angle) * (cropId === 'maize' ? 0.32 : 0.18) * scale,
        );
        leaf.rotation.z = Math.cos(angle) * 0.8;
        leaf.rotation.x = Math.sin(angle) * 0.8;
        leaf.rotation.y = angle;
        leaf.castShadow = true;
        plantObj.add(leaf);
      }

      if (cropId === 'maize' || cropId === 'wheat' || cropId === 'millets' || cropId === 'rice') {
        const headGeo = cropId === 'maize'
          ? new THREE.SphereGeometry(0.16 * scale, 6, 5)
          : new THREE.ConeGeometry(0.12 * scale, 0.42 * scale, 5);
        const head = new THREE.Mesh(headGeo, new THREE.MeshStandardMaterial({
          color: cropId === 'maize' ? 0xfacc15 : 0xd6b45c,
          roughness: 0.7,
        }));
        head.position.y = plantHeight * (cropId === 'maize' ? 0.62 : 0.92);
        plantObj.add(head);
      } else if (cropId === 'cotton') {
        const boll = new THREE.Mesh(
          new THREE.SphereGeometry(0.16 * scale, 6, 5),
          new THREE.MeshStandardMaterial({ color: 0xf8fafc }),
        );
        boll.position.y = plantHeight * 0.82;
        plantObj.add(boll);
      }

      plantObj.position.set(x + (Math.random() - 0.5) * 0.2, elevation, zPos);
      group.add(plantObj);
    }
  }
}

export default function FieldTwin3D({
  activeField,
  satelliteData,
  soilWaterData,
  nasaData,
  isActive = true,
}) {
  const mountRef = useRef(null);
  const [viewMode, setViewMode] = useState('natural');
  const [weatherMode, setWeatherMode] = useState('sunny'); // 'sunny' | 'rain' | 'drought'
  const [growthStage, setGrowthStage] = useState(70); // 0% - 100%
  const [cropRowDensity, setCropRowDensity] = useState(14); // Number of rows
  const currentCropId = CROPS[activeField.currentCrop] ? activeField.currentCrop : '';
  const [scenarioCropId, setScenarioCropId] = useState(currentCropId);
  const activeCrop = CROPS[scenarioCropId] || null;
  const ndviObservations = useMemo(
    () => (satelliteData?.timeline ?? []).filter((observation) => observation.ndvi != null),
    [satelliteData?.timeline],
  );
  const selectedObservation = ndviObservations[ndviObservations.length - 1] ?? null;
  const ndviCells = selectedObservation?.cells ?? EMPTY_NDVI_CELLS;
  const measuredSoil = soilWaterData?.soil?.properties ?? {};
  const measuredWater = soilWaterData?.water ?? {};
  const latestAirTemperature = nasaData?.averageTempC;
  const latestObservationDate = selectedObservation?.sceneDate ?? selectedObservation?.date;
  const readSoilValue = (key) => measuredSoil[key]?.value;


  // Scene references
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const plantsGroupRef = useRef(null);
  const rainSystemRef = useRef(null);
  const terrainMeshRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const renderFrameRef = useRef(null);

  // Mouse interaction state
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const cameraAngleRef = useRef({ theta: Math.PI / 4, phi: Math.PI / 3, radius: 45 });

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight || 520;

    // 1. Scene & Camera setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.background = new THREE.Color(0x060a14);
    scene.fog = new THREE.FogExp2(0x060a14, 0.015);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    cameraRef.current = camera;
    updateCameraPosition(cameraRef, cameraAngleRef);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    rendererRef.current = renderer;
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 3. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.8);
    sunLight.position.set(30, 45, 25);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 1024;
    sunLight.shadow.mapSize.height = 1024;
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x166534, 0.5);
    scene.add(hemiLight);

    // 4. Terrain Grid Mesh
    const terrainGeo = new THREE.PlaneGeometry(36, 36, 40, 40);
    terrainGeo.rotateX(-Math.PI / 2);

    // Add subtle terrain elevation contours
    const pos = terrainGeo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const elevation = Math.sin(vx * 0.18) * Math.cos(vz * 0.18) * 1.4 + 
                        Math.sin(vx * 0.35 + vz * 0.2) * 0.6;
      pos.setY(i, elevation);
    }
    terrainGeo.computeVertexNormals();

    // Terrain is a procedural background; the Landsat mode uses sampled cells only.
    const terrainMat = createTerrainMaterial('natural');
    const terrain = new THREE.Mesh(terrainGeo, terrainMat);
    terrain.receiveShadow = true;
    scene.add(terrain);
    terrainMeshRef.current = terrain;

    // Add boundary fence/glow
    const fenceGeo = new THREE.BoxGeometry(36.2, 0.3, 36.2);
    const fenceMat = new THREE.MeshBasicMaterial({ color: 0x10b981, wireframe: true, transparent: true, opacity: 0.35 });
    const fence = new THREE.Mesh(fenceGeo, fenceMat);
    fence.position.y = 0.8;
    scene.add(fence);

    // 5. 3D Crops Group
    const plantsGroup = new THREE.Group();
    plantsGroupRef.current = plantsGroup;
    scene.add(plantsGroup);

    // 6. Rain particle system
    const rainGeo = new THREE.BufferGeometry();
    const rainCount = 1200;
    const rainPositions = new Float32Array(rainCount * 3);
    for (let i = 0; i < rainCount * 3; i += 3) {
      rainPositions[i] = (Math.random() - 0.5) * 45;
      rainPositions[i + 1] = Math.random() * 35;
      rainPositions[i + 2] = (Math.random() - 0.5) * 45;
    }
    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    const rainMat = new THREE.PointsMaterial({
      color: 0x67e8f9,
      size: 0.18,
      transparent: true,
      opacity: 0.7
    });
    const rainSystem = new THREE.Points(rainGeo, rainMat);
    rainSystem.visible = false;
    scene.add(rainSystem);
    rainSystemRef.current = rainSystem;

    // 7. Animation Loop
    const clock = new THREE.Clock();
    renderFrameRef.current = () => {
      const elapsedTime = clock.getElapsedTime();

      // Rain animation
      if (rainSystemRef.current && rainSystemRef.current.visible) {
        const positions = rainSystemRef.current.geometry.attributes.position.array;
        for (let i = 1; i < positions.length; i += 3) {
          positions[i] -= 0.65;
          if (positions[i] < 0) {
            positions[i] = 30 + Math.random() * 5;
          }
        }
        rainSystemRef.current.geometry.attributes.position.needsUpdate = true;
      }

      // Gentle wind breeze on plants
      if (plantsGroupRef.current) {
        plantsGroupRef.current.children.forEach((plant, idx) => {
          plant.rotation.z = Math.sin(elapsedTime * 2 + idx * 0.1) * 0.04;
        });
      }

      renderer.render(scene, camera);
    };

    // Resize handling
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
      renderFrameRef.current = null;
      if (rendererRef.current && rendererRef.current.domElement) {
        container.innerHTML = '';
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive || !renderFrameRef.current) return undefined;

    const animate = () => {
      renderFrameRef.current?.();
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };
    animationFrameIdRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
        animationFrameIdRef.current = null;
      }
    };
  }, [isActive]);

  // Rebuild crops when stage, density, or view mode changes
  useEffect(() => {
    if (plantsGroupRef.current) {
      rebuildCropRows(plantsGroupRef.current, growthStage, cropRowDensity, viewMode, scenarioCropId);
    }
  }, [growthStage, cropRowDensity, viewMode, scenarioCropId]);

  // Weather update
  useEffect(() => {
    if (!rainSystemRef.current || !sceneRef.current) return;
    rainSystemRef.current.visible = (weatherMode === 'rain');

    if (weatherMode === 'drought') {
      sceneRef.current.fog = new THREE.FogExp2(0x3a2e1d, 0.025);
      sceneRef.current.background = new THREE.Color(0x19140e);
    } else {
      sceneRef.current.fog = new THREE.FogExp2(0x060a14, 0.015);
      sceneRef.current.background = new THREE.Color(0x060a14);
    }
  }, [weatherMode]);

  // View mode update for terrain
  useEffect(() => {
    if (terrainMeshRef.current) {
      const oldMaterial = terrainMeshRef.current.material;
      terrainMeshRef.current.material = createTerrainMaterial(viewMode, ndviCells, activeField.lat);
      oldMaterial.map?.dispose();
      oldMaterial.dispose();
    }
  }, [viewMode, ndviCells, activeField.lat]);

  // Mouse Handlers for 3D Orbit Controls
  const handleMouseDown = (e) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!isDraggingRef.current) return;
    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;

    cameraAngleRef.current.theta -= deltaX * 0.008;
    cameraAngleRef.current.phi = Math.max(0.1, Math.min(Math.PI / 2.1, cameraAngleRef.current.phi - deltaY * 0.008));

    updateCameraPosition(cameraRef, cameraAngleRef);
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e) => {
    e.preventDefault();
    cameraAngleRef.current.radius = Math.max(15, Math.min(80, cameraAngleRef.current.radius + e.deltaY * 0.05));
    updateCameraPosition(cameraRef, cameraAngleRef);
  };

  const resetCamera = () => {
    cameraAngleRef.current = { theta: Math.PI / 4, phi: Math.PI / 3, radius: 45 };
    updateCameraPosition(cameraRef, cameraAngleRef);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl">
      {/* 3D WebGL Canvas Container */}
      <div 
        ref={mountRef} 
        className="w-full h-[540px] cursor-grab active:cursor-grabbing relative select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />

      {/* Floating HUD Overlay - Top Left */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
        <div className="glass-panel-glow px-4 py-2.5 rounded-xl pointer-events-auto max-w-sm">
          <div className="flex items-center gap-2">
            <Box className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-sm text-slate-100 font-['Outfit']">
              {activeField.name} — 3D Field Twin
            </h3>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Crop model: <span className="font-semibold text-emerald-300">{activeCrop?.name ?? "not selected"}</span>
            {activeCrop && currentCropId === scenarioCropId ? " (field record)" : activeCrop ? " (illustrative selection)" : ""}
            {activeField.totalAreaAcres != null ? ` • Area: ${activeField.totalAreaAcres} acres` : ""}
          </p>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
            {activeField.elevationMeters != null && <span>Preset elevation: {activeField.elevationMeters} m</span>}
            {latestAirTemperature != null && <span>NASA POWER mean air temp: {latestAirTemperature}°C</span>}
          </div>
          <div className="mt-2 max-w-sm text-[11px] text-amber-200">
            Procedural 3D illustration; crop shape, terrain relief, and weather controls are simulations, not a surveyed digital twin.
          </div>
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-300">
            <span>
              SoilGrids pH: {readSoilValue("ph") ?? "unavailable"}
              {readSoilValue("ph") != null ? " (modeled)" : ""}
            </span>
            <span>
              SoilGrids organic carbon: {readSoilValue("organicCarbonPercent") ?? "unavailable"}
              {readSoilValue("organicCarbonPercent") != null ? "% (modeled)" : ""}
            </span>
            <span>
              SoilGrids bulk density: {readSoilValue("bulkDensityGPerCm3") ?? "unavailable"}
              {readSoilValue("bulkDensityGPerCm3") != null ? " g/cm³ (proxy)" : ""}
            </span>
            <span>
              Root-zone moisture: {measuredWater.soilMoisture?.["7-28 cm"] ?? "unavailable"}
              {measuredWater.soilMoisture?.["7-28 cm"] != null ? " m³/m³ (modeled)" : ""}
            </span>
            <span>
              Historical rainfall: {measuredWater.rainfallTotalMm ?? "unavailable"}
              {measuredWater.rainfallTotalMm != null ? " mm / 90 days" : ""}
            </span>
            <span>
              NASA POWER mean air temp: {latestAirTemperature ?? "unavailable"}
              {latestAirTemperature != null ? `°C (${nasaData?.period?.start ?? ""} to ${nasaData?.period?.end ?? ""})` : ""}
            </span>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="glass-panel p-1.5 rounded-xl flex items-center gap-1 pointer-events-auto w-max">
          <button
            onClick={() => setViewMode('ndvi')}
            disabled={!ndviCells.length}
            title={ndviCells.length ? `Aggregated Landsat cells from ${latestObservationDate}` : "No spatial Landsat observation loaded. Draw a field boundary in Satellite Map first."}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'ndvi' 
                ? 'bg-emerald-500 text-slate-950 shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            } disabled:cursor-not-allowed disabled:opacity-40`}
          >
            <Layers className="w-3.5 h-3.5" />
            Landsat NDVI cells
          </button>
          <button
            onClick={() => setViewMode('natural')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'natural' 
                ? 'bg-emerald-500 text-slate-950 shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Natural Soil & Canopy
          </button>
          <button
            onClick={() => setViewMode('stress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              viewMode === 'stress' 
                ? 'bg-rose-500 text-white shadow-md' 
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            Heat stress (simulated)
          </button>
        </div>
        <div className="glass-panel px-3 py-2 rounded-lg max-w-sm text-[11px] text-slate-300 pointer-events-auto">
          {viewMode === 'ndvi'
            ? `Measured Landsat NDVI aggregates · ${latestObservationDate ?? "date unavailable"} · ${ndviCells.length} cells`
            : viewMode === 'stress'
              ? "Synthetic color scenario only; no thermal satellite observations are loaded."
              : "Soil color and relief are illustrative, not measured field surface data."}
        </div>
      </div>

      {/* Floating HUD Overlay - Top Right Weather Simulator */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-10 pointer-events-none">
        <div className="glass-panel p-1.5 rounded-xl flex items-center gap-1 pointer-events-auto">
          <button
            onClick={() => setWeatherMode('sunny')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              weatherMode === 'sunny' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            Sun (sim)
          </button>
          <button
            onClick={() => setWeatherMode('rain')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              weatherMode === 'rain' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            Rain (sim)
          </button>
          <button
            onClick={() => setWeatherMode('drought')}
            className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all ${
              weatherMode === 'drought' ? 'bg-orange-600 text-white font-bold' : 'text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            Dry spell (sim)
          </button>
        </div>

        <button
          onClick={resetCamera}
          className="glass-panel px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white pointer-events-auto flex items-center gap-1.5"
        >
          <RotateCcw className="w-3 h-3 text-cyan-400" />
          Reset 3D Orbit
        </button>
      </div>

      {/* Floating Bottom Controls: crop model and illustration settings */}
      <div className="absolute bottom-4 left-4 right-4 glass-panel p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-4 z-10">
        <label className="flex items-center gap-2 text-xs text-slate-300">
          Crop illustration
          <select
            value={scenarioCropId}
            onChange={(event) => setScenarioCropId(event.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-slate-100"
          >
            <option value="">No crop selected</option>
            {Object.values(CROPS).map((crop) => (
              <option key={crop.id} value={crop.id}>{crop.name}</option>
            ))}
          </select>
        </label>
        <div className="flex items-center gap-4 flex-1 min-w-[240px]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold text-slate-200">
              Canopy Growth Stage: <span className="text-emerald-400">{growthStage}%</span>
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="100"
            value={growthStage}
            disabled={!scenarioCropId}
            onChange={(e) => setGrowthStage(Number(e.target.value))}
            className="flex-1 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer disabled:opacity-40"
          />
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">
            Simulated row count:
          </span>
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            {[10, 14, 18].map((density) => (
              <button
                key={density}
                onClick={() => setCropRowDensity(density)}
                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  cropRowDensity === density 
                    ? 'bg-emerald-500 text-slate-950' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {density} Rows
              </button>
            ))}
          </div>
        </div>

        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click & Drag to Orbit • Scroll to Zoom</span>
        </div>
      </div>
    </div>
  );
}
