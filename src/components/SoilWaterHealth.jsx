import React, { useState } from 'react';
import { 
  Droplet, 
  FlaskConical, 
  ShieldCheck, 
} from 'lucide-react';
import { CROPS } from '../data/cropsData';
import { getErosionExposureIndex, getPracticeAdoptionIndex, SOIL_PRACTICES } from '../data/soilScreening';
import { apiUrl } from '../services/apiBase';

export default function SoilWaterHealth({
  activeField,
  soilWaterData,
  soilScreeningInputs = {},
  onSoilScreeningInputChange,
}) {
  const [cropSelection, setCropSelection] = useState(null);
  const [plantingDate, setPlantingDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [cropDemand, setCropDemand] = useState(null);
  const [cropDemandLoading, setCropDemandLoading] = useState(false);
  const [cropDemandError, setCropDemandError] = useState('');
  const selectedCropId = cropSelection?.fieldId === activeField.id
    ? cropSelection.cropId
    : activeField.currentCrop || '';

  const isCurrentFieldData = soilWaterData?.fieldId === activeField.id;
  const hasLocationData = isCurrentFieldData && Boolean(soilWaterData.data);
  const hasDrawnBoundary = isCurrentFieldData && Boolean(soilWaterData.geometry);
  const isPointEstimate = hasLocationData && !hasDrawnBoundary;
  const isCurrentFieldLoading = isCurrentFieldData && soilWaterData.loading;
  const liveSoil = hasLocationData ? soilWaterData.data?.soil : null;
  const liveWater = hasLocationData ? soilWaterData.data?.water : null;
  const terrain = hasLocationData ? soilWaterData.data?.terrain : null;
  const soilProperties = liveSoil?.properties ?? null;
  const hasSoilGridValues = Object.values(soilProperties || {}).some((property) => property?.value != null);
  const isDemoProfile = activeField.isDemoData === true && !hasSoilGridValues && !isCurrentFieldLoading;
  const soilSourceLabel = hasSoilGridValues
    ? "SoilGrids estimate · 250 m"
    : isDemoProfile ? "Demo example" : "Unavailable";
  const soilValue = (key, demoValue) => soilProperties?.[key]?.value
    ?? (isDemoProfile ? demoValue : null);
  
  const activeCrop = CROPS[selectedCropId] || null;
  const baseWaterDemand = activeCrop?.waterDemandMm ?? null;
  const cropOptions = Object.values(CROPS);
  const cropDemandRange = {
    minimum: Math.min(...cropOptions.map((crop) => crop.waterDemandMm)),
    maximum: Math.max(...cropOptions.map((crop) => crop.waterDemandMm)),
  };

  const rainfallTotalMm = liveWater?.rainfallTotalMm ?? null;
  const rootZoneMoisture = liveWater?.soilMoisture?.["7-28 cm"] ?? null;
  const terrainRelief = terrain?.elevationRangeMeters?.relief;
  const terrainElevation = terrain?.elevationMeters;
  const bulkDensityEstimate = soilProperties?.bulkDensityGPerCm3;
  const bulkDensity = soilValue("bulkDensityGPerCm3", null);
  const soilTextureSummary = hasSoilGridValues
    ? `SoilGrids 0-5 cm: clay ${soilProperties.clayPercent?.value ?? "not returned"}%, silt ${soilProperties.siltPercent?.value ?? "not returned"}%, sand ${soilProperties.sandPercent?.value ?? "not returned"}%`
    : isDemoProfile
      ? `${activeField.soilTexture} • ${activeField.soilType}`
      : "Soil texture unavailable";
  const practiceIndex = getPracticeAdoptionIndex(soilScreeningInputs.practices);
  const erosionIndex = getErosionExposureIndex({
    slopePercent: soilScreeningInputs.slopePercent,
    groundCoverPercent: soilScreeningInputs.groundCoverPercent,
    rainfall90DayMm: rainfallTotalMm,
  });
  const currentCropDemand = cropDemand?.fieldId === activeField.id
    && cropDemand.cropId === activeCrop?.id
    && cropDemand.plantingDate === plantingDate
    ? cropDemand.result
    : null;

  const requestCropDemand = async () => {
    if (!activeCrop || !Number.isFinite(activeField.lat) || !Number.isFinite(activeField.lon)) {
      setCropDemandError("Select a crop and a location with valid coordinates.");
      return;
    }
    setCropDemandLoading(true);
    setCropDemandError('');
    setCropDemand(null);
    try {
      const response = await fetch(apiUrl("/api/soil-water/crop-demand"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: activeField.lat,
          longitude: activeField.lon,
          cropId: activeCrop.id,
          plantingDate,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.detail || "Crop water-demand estimate unavailable.");
      setCropDemand({
        fieldId: activeField.id,
        cropId: activeCrop.id,
        plantingDate,
        result,
      });
    } catch (error) {
      setCropDemandError(error.message || "Crop water-demand estimate unavailable.");
    } finally {
      setCropDemandLoading(false);
    }
  };


  return (
    <div className="space-y-6">
      {/* 1. Header */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <FlaskConical className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
              Soil Health Diagnostics & Water Budget Calculator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            {hasLocationData
              ? isPointEstimate
              ? "GPS-point SoilGrids, Copernicus DEM, and Open-Meteo historical estimates. SoilGrids uses the nearest valid 250 m pixel; these are not field-boundary averages or sensor readings."
                : "Boundary-specific SoilGrids estimates, Copernicus DEM terrain samples, and Open-Meteo historical soil-water data. These are modeled datasets, not field sensors."
              : hasDrawnBoundary
              ? "Boundary-specific SoilGrids soil estimates and Open-Meteo historical soil-water data. These are coarse model grids, not laboratory or field-sensor measurements."
              : isDemoProfile
                ? "Preset soil and water values are examples only. Draw a farm boundary to request location-based estimates."
                : "Location-specific data will load from the selected coordinates; draw a boundary for field-area summaries."}
          </p>
        </div>

        {/* Source Badge Legend */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-bold">
            {hasLocationData
              ? isPointEstimate
                ? "GPS point estimate · SoilGrids ~250 m · DEM ~90 m"
                : "SoilGrids ~250 m · Copernicus DEM ~90 m · Open-Meteo ~9 km"
              : hasDrawnBoundary || isCurrentFieldLoading
              ? isCurrentFieldLoading
                ? hasDrawnBoundary ? "Fetching boundary data..." : "Fetching location data..."
                : soilWaterData.error
                  ? "Some sources unavailable"
                  : "SoilGrids ~250 m · Copernicus DEM ~90 m · Open-Meteo ~9 km"
              : isDemoProfile ? "Demo/reference values" : "No farm boundary selected"}
          </span>
        </div>
      </div>

      {isCurrentFieldLoading && (
        <p role="status" className="rounded-lg border border-cyan-500/30 bg-cyan-950/30 px-4 py-3 text-xs text-cyan-200">
          {hasDrawnBoundary
            ? "Fetching SoilGrids soil properties, Copernicus DEM terrain, and Open-Meteo soil-water estimates for this boundary..."
            : "Fetching SoilGrids, Copernicus DEM, and Open-Meteo estimates for the selected location..."}
        </p>
      )}
      {isCurrentFieldData && soilWaterData.error && (
        <p role="alert" className="rounded-lg border border-rose-500/30 bg-rose-950/30 px-4 py-3 text-xs text-rose-200">
          {soilWaterData.error}
        </p>
      )}
      {[...(liveSoil?.warnings || []), ...(liveWater?.warnings || [])].map((warning) => (
        <p key={warning} role="status" className="rounded-lg border border-amber-500/30 bg-amber-950/30 px-4 py-3 text-xs text-amber-200">
          {warning}
        </p>
      ))}

      {/* 2. Dataset-backed soil profile */}
      <div className="glass-panel-glow p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                Field Soil Dataset Summary
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {hasSoilGridValues
                ? isPointEstimate
                  ? "Values below use the nearest valid SoilGrids model pixel to the selected GPS point; they are not a field-area average or field sample."
                  : "Values below are SoilGrids model estimates for this boundary, not field samples."
                : isDemoProfile
                  ? "Preset profile values are examples, not measurements from your field."
                  : soilWaterData.loading
                    ? "Fetching SoilGrids estimates for this boundary."
                    : hasLocationData
                      ? isPointEstimate
                        ? "No valid SoilGrids pixel was found near this GPS point; draw a boundary for area-based sampling."
                        : "No soil estimates were returned for this boundary."
                    : hasDrawnBoundary
                      ? "No soil estimates were returned for this boundary."
                      : "Draw a field boundary to request SoilGrids estimates for these soil indicators."}
            </p>
          </div>

          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            {hasSoilGridValues
              ? "SoilGrids estimate · 250 m"
              : isDemoProfile ? "Demo example" : soilWaterData.loading ? "Fetching estimates" : hasLocationData ? "No data returned" : "Boundary data needed"}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {[
            ["Soil pH", soilValue("ph", activeField.soilIndicators.ph.value), ""],
            ["Organic carbon", soilValue("organicCarbonPercent", activeField.soilIndicators.organicCarbonPercent.value), "%"],
            ["Clay", soilValue("clayPercent", null), "%"],
            ["Total nitrogen", soilValue("totalNitrogenGPerKg", null), " g/kg"],
          ].map(([label, value, unit]) => (
            <div key={label} className="bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              <p className="text-slate-400">{label}</p>
              <p className="text-lg font-bold text-slate-100 mt-1">
                {value == null
                  ? soilWaterData.loading ? "Loading..." : hasLocationData ? "Unavailable" : "Not supplied"
                  : `${value}${unit}`}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {hasSoilGridValues ? "SoilGrids modeled estimate" : isDemoProfile ? "Preset example" : hasDrawnBoundary ? "No dataset value returned" : "Requires boundary data"}
              </p>
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-amber-200">Soil management practice index</h4>
              <p className="text-[11px] text-slate-300">
                An unvalidated adoption summary—not a soil recovery or soil-quality score. Unknown answers are excluded.
              </p>
            </div>
            <span className="text-xl font-bold text-amber-100">
              {practiceIndex ? `${practiceIndex.score}%` : "—"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SOIL_PRACTICES.map(({ id, label }) => (
              <label key={id} className="text-xs text-slate-300 flex items-center justify-between gap-2">
                <span>{label}</span>
                <select
                  value={soilScreeningInputs.practices?.[id] == null
                    ? ""
                    : soilScreeningInputs.practices[id] ? "yes" : "no"}
                  onChange={(event) => onSoilScreeningInputChange?.("practices", {
                    ...soilScreeningInputs.practices,
                    [id]: event.target.value === "" ? null : event.target.value === "yes",
                  })}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1"
                  aria-label={label}
                >
                  <option value="">Unknown</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            ))}
          </div>
          <p className="text-[11px] text-slate-400">
            {practiceIndex
              ? `${practiceIndex.adopted} of ${practiceIndex.recorded} recorded practices are used. Score = yes / known answers × 100. It does not measure soil recovery over time.`
              : "Record one or more practices to calculate the adoption index."}
          </p>
        </div>
      </div>

      {/* 3. Multi-Source Soil Parameters Grid (Measured vs Estimated vs User) */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">
              Complete Soil Nutrients & Physical Health Ledger
            </h3>
            <p className="text-xs text-slate-400">
              {soilTextureSummary}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Soil pH */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Soil Reaction (pH, 0-5 cm)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {soilSourceLabel}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-100 font-['Outfit']">
                {soilValue("ph", activeField.soilIndicators.ph.value) ?? "Not available"}
              </span>
              <span className="text-xs text-emerald-400 font-semibold">
                {isDemoProfile ? activeField.soilIndicators.ph.label : hasSoilGridValues ? "Predicted pH; confirm with a soil test" : "No SoilGrids pixel available"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Interpretation depends on crop and local conditions; confirm with a laboratory soil test.</p>
          </div>

          {/* Soil Organic Carbon */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Organic Carbon (SOC)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {soilSourceLabel}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400 font-['Outfit']">
                {soilValue("organicCarbonPercent", activeField.soilIndicators.organicCarbonPercent.value) != null
                  ? `${soilValue("organicCarbonPercent", activeField.soilIndicators.organicCarbonPercent.value)}%`
                  : "Not available"}
              </span>
              <span className="text-xs text-amber-300 font-semibold">
                {isDemoProfile ? activeField.soilIndicators.organicCarbonPercent.label : hasSoilGridValues ? "Predicted organic carbon" : "No SoilGrids pixel available"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Regional model estimate only; use a laboratory test before making soil amendments.</p>
          </div>

          {/* Total Nitrogen */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{hasSoilGridValues ? "Total Nitrogen (0-5 cm)" : "Available Nitrogen (N)"}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                {soilSourceLabel}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400 font-['Outfit']">
                {hasSoilGridValues
                  ? soilProperties.totalNitrogenGPerKg?.value ?? "Not available"
                  : isDemoProfile ? activeField.soilIndicators.availableNitrogenKgHa.value : "Not available"}
              </span>
              <span className="text-xs text-slate-400">
                {hasSoilGridValues
                  ? "g/kg predicted total N; not plant-available N"
                  : `kg/ha (${isDemoProfile ? activeField.soilIndicators.availableNitrogenKgHa.label : "No soil test supplied"})`}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Total soil nitrogen is not plant-available nitrogen; a soil test is needed for fertilizer planning.</p>
          </div>

          {/* Satellite Soil Moisture Proxy */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Root-Zone Soil Moisture</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                {rootZoneMoisture != null ? "Open-Meteo estimate · ~9 km" : isDemoProfile ? "Demo example" : "Unavailable"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-cyan-400 font-['Outfit']">
                {rootZoneMoisture != null
                  ? `${(rootZoneMoisture * 100).toFixed(1)}%`
                  : isDemoProfile ? `${activeField.soilIndicators.satelliteSoilMoistureIndex.value * 100}%` : "Not available"}
              </span>
              <span className="text-xs text-cyan-300 font-semibold">Volumetric water · 7-28 cm</span>
            </div>
            <p className="text-[11px] text-slate-400">
              {liveWater?.soilMoistureAsOf
                ? `${liveWater.soilMoistureSampleCounts?.["7-28 cm"] ?? 0} hourly Open-Meteo reanalysis samples ending ${(liveWater.soilMoistureWindowEnd ?? liveWater.soilMoistureAsOf).replace("T", " ")}; not a field sensor.`
                : "Model estimate; not a field sensor measurement."}
            </p>
          </div>

          {/* Terrain context for erosion */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Terrain Relief (erosion context)</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                {terrain?.elevationRangeMeters || terrainElevation != null
                  ? "Copernicus DEM · 90 m"
                  : isDemoProfile ? "Demo example" : soilWaterData.loading ? "Loading DEM" : "Boundary data needed"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-400 font-['Outfit']">
                {terrainRelief != null
                  ? `${terrainRelief.toFixed(1)} m`
                  : terrainElevation != null
                    ? `${terrainElevation.toFixed(1)} m`
                  : isDemoProfile
                    ? activeField.soilIndicators.erosionRiskLevel.value
                    : soilWaterData.loading ? "Loading..." : hasDrawnBoundary ? "Unavailable" : "Draw boundary"}
              </span>
              <span className="text-xs text-slate-400">
                {terrainRelief != null
                  ? "sampled elevation range"
                  : terrainElevation != null ? "GPS point elevation" : isDemoProfile ? "preset example" : "DEM elevation"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {terrain?.elevationRangeMeters
                ? `${terrain.sampleCount} DEM samples, ${terrain.elevationRangeMeters.minimum}-${terrain.elevationRangeMeters.maximum} m elevation. Terrain context only; not a soil-loss or erosion-risk model.`
                : terrainElevation != null
                  ? "Single-point elevation estimate; slope and erosion risk require a boundary and additional soil/land-cover inputs."
                : isDemoProfile ? "Preset example only; no boundary DEM was sampled." : terrain?.warnings?.[0] ?? "Draw a boundary to sample terrain elevation."}
            </p>
            <div className="grid grid-cols-2 gap-2 pt-2">
              <label className="text-[11px] text-slate-300">
                Slope (%; enter field value)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={soilScreeningInputs.slopePercent ?? ""}
                  onChange={(event) => onSoilScreeningInputChange?.(
                    "slopePercent",
                    event.target.value === "" ? null : Number(event.target.value),
                  )}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                />
              </label>
              <label className="text-[11px] text-slate-300">
                Ground cover (%; field estimate)
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={soilScreeningInputs.groundCoverPercent ?? ""}
                  onChange={(event) => onSoilScreeningInputChange?.(
                    "groundCoverPercent",
                    event.target.value === "" ? null : Number(event.target.value),
                  )}
                  className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
                />
              </label>
            </div>
            <div className="rounded bg-slate-950/80 p-2 text-[11px] text-slate-300">
              <span className="font-semibold">90-day erosion exposure screen: </span>
              {erosionIndex
                ? `${erosionIndex.score}/100 (unvalidated relative index)`
                : "Enter slope and ground cover; complete 90-day rainfall data is also required."}
              <p className="mt-1 text-slate-400">
                Formula: 40% slope exposure (capped at 15%), 35% bare-ground fraction, 25% recent rainfall exposure (capped at 500 mm/90 days). Not RUSLE, predicted soil loss, or a validated risk classification.
              </p>
            </div>
          </div>

          {/* Subsoil bulk-density proxy */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">
                {isDemoProfile && bulkDensity == null ? "Preset Compaction Example" : "Subsoil Bulk Density"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                {bulkDensity != null
                  ? "SoilGrids · 250 m"
                  : isDemoProfile ? "Demo example" : soilWaterData.loading ? "Loading soil data" : "Boundary data needed"}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400 font-['Outfit']">
                {bulkDensity != null
                  ? `${bulkDensity.toFixed(2)} g/cm³`
                  : isDemoProfile
                    ? activeField.soilIndicators.compactionRisk.value
                    : soilWaterData.loading ? "Loading..." : hasDrawnBoundary ? "Unavailable" : "Draw boundary"}
              </span>
              <span className="text-xs text-amber-300">
                {bulkDensity != null ? soilProperties.bulkDensityGPerCm3.depth : isDemoProfile ? "Preset example" : "DEM depth"}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              {bulkDensity != null
                ? `Modeled bulk-density proxy${isPointEstimate && bulkDensityEstimate?.distanceFromPointMeters != null ? `; nearest valid pixel is about ${bulkDensityEstimate.distanceFromPointMeters} m from the GPS point` : ""}. It does not confirm a compacted layer; use a field penetrometer or core test for diagnosis.`
                : isDemoProfile ? activeField.soilIndicators.compactionRisk.label : soilProperties ? "No bulk-density estimate returned for this boundary." : soilWaterData.loading ? "Fetching the 15-30 cm bulk-density estimate." : soilWaterData.error || "Draw a boundary to fetch the modeled subsoil estimate."}
            </p>
            <label className="block text-[11px] text-slate-300">
              Optional penetrometer reading (MPa)
              <input
                type="number"
                min="0"
                max="10"
                step="0.01"
                value={soilScreeningInputs.penetrationResistanceMpa ?? ""}
                onChange={(event) => onSoilScreeningInputChange?.(
                  "penetrationResistanceMpa",
                  event.target.value === "" ? null : Number(event.target.value),
                )}
                className="mt-1 w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-slate-100"
              />
            </label>
            {Number.isFinite(soilScreeningInputs.penetrationResistanceMpa) && (
              <p className="text-[11px] text-slate-300">
                Recorded reading: {soilScreeningInputs.penetrationResistanceMpa.toFixed(2)} MPa.
                {soilScreeningInputs.penetrationResistanceMpa >= 2
                  ? " This may restrict roots in some crops/conditions; confirm at field capacity and across multiple points."
                  : " Interpret against crop, texture, and soil moisture; one reading cannot rule out compaction."}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 4. Historical Water Conditions and Crop-Demand Context */}
      <div className="glass-panel p-5 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Droplet className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                Historical Water Conditions & Crop-Demand Context
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical soil-water context plus a seven-day crop evapotranspiration estimate from forecast ET₀. ETc is not an irrigation prescription.
            </p>
          </div>

          <div className="text-right text-xs">
            <span className="text-slate-400">Current Crop:</span>
            <span className="font-bold text-slate-100 ml-1 capitalize">{activeCrop?.name ?? "Not selected"}</span>
          </div>
        </div>

        {/* Historical weather and forecast crop-demand estimate */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          {/* Crop demand estimate */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            <p className="text-slate-400">Catalog Seasonal Water Reference</p>
            <p className="text-2xl font-black text-cyan-300 font-['Outfit'] mt-1">
              {baseWaterDemand == null
                ? `${cropDemandRange.minimum}-${cropDemandRange.maximum} mm`
                : `${baseWaterDemand} mm`}
            </p>
            <label className="block mt-2 text-[11px] text-slate-400" htmlFor="soil-water-crop">
              Catalog crop
            </label>
            <select
              id="soil-water-crop"
              value={selectedCropId}
              onChange={(event) => {
                setCropSelection({ fieldId: activeField.id, cropId: event.target.value });
                setCropDemand(null);
                setCropDemandError('');
              }}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
            >
              <option value="">All catalog crops (range)</option>
              {cropOptions.map((crop) => (
                <option key={crop.id} value={crop.id}>{crop.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {activeCrop
                ? `${activeCrop.name} is a catalog reference for the full growing season.`
                : `Catalog range across ${cropOptions.length} crops; select a crop to estimate daily crop evapotranspiration.`}
            </p>
            <label className="block mt-3 text-[11px] text-slate-400">
              Planting date (used to estimate crop stage)
              <input
                type="date"
                value={plantingDate}
                onChange={(event) => {
                  setPlantingDate(event.target.value);
                  setCropDemand(null);
                  setCropDemandError('');
                }}
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
              />
            </label>
            <button
              type="button"
              onClick={requestCropDemand}
              disabled={!activeCrop || cropDemandLoading}
              className="mt-2 w-full rounded-md bg-cyan-700 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cropDemandLoading ? "Calculating forecast..." : "Estimate next 7 days"}
            </button>
            {cropDemandError && <p role="alert" className="mt-2 text-[11px] text-rose-300">{cropDemandError}</p>}
            {currentCropDemand && (
              <div className="mt-3 space-y-2 border-t border-slate-800 pt-2 text-[11px]">
                <p className="font-semibold text-cyan-200">
                  {currentCropDemand.etcTotalMm == null
                    ? "ETc forecast unavailable"
                    : `${currentCropDemand.etcTotalMm} mm estimated ETc over ${currentCropDemand.etcCoveredDays} covered days`}
                </p>
                <div className="max-h-32 space-y-1 overflow-y-auto text-slate-300">
                  {currentCropDemand.forecast.map((day) => (
                    <div key={day.date} className="flex justify-between gap-2">
                      <span>{day.date} · {day.stage}</span>
                      <span>{day.etcMm == null ? "ETc unavailable" : `${day.etcMm} mm`}</span>
                    </div>
                  ))}
                </div>
                <p className="text-slate-400">
                  {currentCropDemand.assumptions.join(" ")}
                </p>
              </div>
            )}
          </div>

          {/* Total Available Supply */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            <p className="text-slate-400">90-Day Historical Precipitation</p>
            <p className="text-2xl font-black text-emerald-400 font-['Outfit'] mt-1">
              {rainfallTotalMm == null
                ? isCurrentFieldLoading ? "Loading..." : hasLocationData ? "Incomplete data" : "Loading location data..."
                : `${rainfallTotalMm} mm`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {liveWater?.period
                ? `${liveWater.period.start} to ${liveWater.period.end} · Open-Meteo reanalysis · ${liveWater.rainfallCoverageDays ?? 0}/90 daily values`
                : soilWaterData.loading
                  ? "Loading boundary rainfall data..."
                  : soilWaterData.error
                    ? "Historical precipitation could not be loaded."
                    : "Draw a boundary to fetch historical precipitation."}
            </p>
          </div>

          {/* Water Balance Gap */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
            <p className="text-slate-400">Recent Root-Zone Moisture</p>
            <p className="text-2xl font-black text-cyan-300 font-['Outfit'] mt-1">
              {rootZoneMoisture == null
                ? isCurrentFieldLoading ? "Loading..." : hasLocationData ? "Unavailable" : "Loading location data..."
                : `${(rootZoneMoisture * 100).toFixed(1)}%`}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {liveWater?.soilMoistureAsOf
                ? `${liveWater.soilMoistureSampleCounts?.["7-28 cm"] ?? 0} hourly modeled samples for 7-28 cm ending ${(liveWater.soilMoistureWindowEnd ?? liveWater.soilMoistureAsOf).replace("T", " ")}; not a sensor reading.`
                : "Soil moisture unavailable without boundary data."}
            </p>
          </div>
        </div>
        <p className="rounded-lg border border-slate-700 bg-slate-900/70 px-4 py-3 text-[11px] text-slate-300">
          These values cannot be subtracted to estimate a water deficit: the crop-demand reference is seasonal, while rainfall covers the last 90 days. Irrigation, evapotranspiration, runoff, crop stage, and planting-date response are not modeled.
        </p>
      </div>
    </div>
  );
}
