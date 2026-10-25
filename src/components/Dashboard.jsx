import React from 'react';
import { 
  Satellite, 
  Box, 
  RotateCw, 
  Droplet, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  Bot, 
  MapPin, 
  ArrowRight, 
  Sparkles,
  Layers,
  Thermometer,
  CloudRain,
  Flame,
  Leaf
} from 'lucide-react';
import { CROPS } from '../data/cropsData';
import { translations } from '../data/translations';

export default function Dashboard({ 
  activeField, 
  setActiveTab, 
  nasaData, 
  satelliteFarmData,
  soilWaterData,
  currentLang 
}) {
  const t = translations[currentLang] || translations.en;
  const currentCrop = activeField.currentCrop
  ? CROPS[activeField.currentCrop] ?? null
  : null;

const isGps = activeField.isGpsLocation === true;
  const fieldSatelliteData = satelliteFarmData?.fieldId === activeField.id
    ? satelliteFarmData
    : null;
  const validSatelliteObservations = (fieldSatelliteData?.timeline || [])
    .filter((item) => Number.isFinite(item.ndvi));
  const latestSatelliteObservation = validSatelliteObservations.length
    ? validSatelliteObservations[validSatelliteObservations.length - 1]
    : null;
  const displayedAreaAcres = fieldSatelliteData?.areaAcres ?? activeField.totalAreaAcres;
  const fieldSoilWaterData = soilWaterData?.fieldId === activeField.id
    ? soilWaterData
    : null;
  const hasDrawnBoundary = Boolean(fieldSoilWaterData?.geometry);
  const soilProperties = fieldSoilWaterData?.data?.soil?.properties;
  const waterSnapshot = fieldSoilWaterData?.data?.water;
  const soilPH = soilProperties?.ph?.value;
  const soilCarbon = soilProperties?.organicCarbonPercent?.value;
  const rootZoneMoisture = waterSnapshot?.soilMoisture?.["7-28 cm"];
  const soilProfileLabel = hasDrawnBoundary
    ? soilPH != null ? `SoilGrids pH ${soilPH} · SOC ${soilCarbon ?? "N/A"}%` : fieldSoilWaterData.loading ? "Loading boundary soil estimate" : "SoilGrids estimate unavailable"
    : activeField.soilType ? `Preset (unverified): ${activeField.soilType}` : "Farmer soil input needed";
  const elevationMeters = activeField.elevationMeters ?? waterSnapshot?.elevationMeters;
  const soilCardValue = hasDrawnBoundary
    ? soilPH != null ? `pH ${soilPH}` : fieldSoilWaterData.loading ? "Loading..." : "N/A"
    : activeField.isDemoData ? "Demo" : "N/A";
  const soilCardDetail = hasDrawnBoundary
    ? soilCarbon != null ? `SOC ${soilCarbon}% · SoilGrids ~250 m` : "SoilGrids estimate unavailable for this boundary"
    : activeField.isDemoData ? "Preset profile; not lab-verified" : "Draw a boundary to request SoilGrids estimates";
  const waterCardValue = hasDrawnBoundary
    ? rootZoneMoisture != null ? `${(rootZoneMoisture * 100).toFixed(1)}%` : fieldSoilWaterData.loading ? "Loading..." : "N/A"
    : activeField.isDemoData ? "Demo" : "N/A";
  const waterCardDetail = hasDrawnBoundary
    ? `7-28 cm modeled moisture${waterSnapshot?.rainfallTotalMm != null ? ` · 90-day rain ${waterSnapshot.rainfallTotalMm} mm` : ""}`
    : activeField.isDemoData ? "Illustrative values, not measured ETc" : "Draw a boundary to request soil moisture and rainfall";

  const alerts = nasaData?.activeAlerts || [];

  return (
    <div className="space-y-6">
      {/* 1. Farm Overview Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-emerald-950/40 via-slate-900/90 to-cyan-950/40 border border-emerald-500/30 p-6 shadow-2xl">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Active Field Profile
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                {activeField.location} ({activeField.lat.toFixed(4)}°N, {activeField.lon.toFixed(4)}°E)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 font-['Outfit']">
              {activeField.name}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              {activeField.regionName} • Soil: <b className="text-emerald-300">{soilProfileLabel}</b> • Irrigation: <b className="text-cyan-300">{activeField.irrigationType || 'Farmer input needed'}</b>
            </p>
          </div>

          {/* Quick Field Specs Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-400 block font-medium">Total Area</span>
              <span className="text-xl font-black text-slate-100 font-['Outfit']">
                {displayedAreaAcres != null
                  ? `${displayedAreaAcres.toFixed(2)} Acres`
                  : 'Not selected'}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-400 block font-medium">Standing Crop</span>
              <span className="text-xl font-black text-emerald-400 font-['Outfit'] capitalize">
                {currentCrop?.name?.split(' ')[0] ?? 'Not provided'}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl px-4 py-2.5 text-center min-w-[100px]">
              <span className="text-[11px] text-slate-400 block font-medium">Elevation</span>
              <span className="text-xl font-black text-cyan-400 font-['Outfit']">
                {elevationMeters != null
                 ? `${activeField.elevationMeters == null ? "~" : ""}${Math.round(elevationMeters)} m`
                 : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        {/* Ambient background glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-1/3 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mb-20"></div>
      </div>

      {/* 2. Urgent NASA Early-Warning Alerts (if any) */}
      {alerts.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg shadow-rose-950/20">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">
                  NASA Climate Early-Warning Active
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded-full bg-rose-500/30 text-rose-200 font-extrabold">
                  {alerts[0].severity}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-semibold mt-0.5">
                {alerts[0].title}: {alerts[0].desc}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveTab('climateRisk')}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold whitespace-nowrap transition-all shrink-0"
          >
            Inspect Risks &rarr;
          </button>
        </div>
      )}

      {/* 3. Core 4 Health & Intelligence Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Satellite NDVI */}
        <div 
          onClick={() => setActiveTab('satellite')}
          className="glass-panel-glow p-4 rounded-2xl hover:border-emerald-500/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Mean NDVI Index</span>
              <Satellite className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-emerald-400 font-['Outfit']">
                {latestSatelliteObservation
                  ? latestSatelliteObservation.ndvi.toFixed(3)
                  : activeField.isDemoData ? 'Demo' : 'N/A'}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              {latestSatelliteObservation
                ? `Landsat scene ${latestSatelliteObservation.sceneDate || latestSatelliteObservation.date} · ${displayedAreaAcres?.toFixed(2) ?? 'Area unavailable'} acres`
                : fieldSatelliteData?.loading
                  ? 'Loading Landsat observations'
                  : fieldSatelliteData?.error
                    ? `Landsat unavailable: ${fieldSatelliteData.error}`
                    : activeField.isDemoData
                      ? 'Preset example, not live satellite data'
                      : 'Draw a boundary to request Landsat observations'}
            </p>
            {latestSatelliteObservation?.canopyCoverPercent != null && (
              <p className="text-[11px] text-slate-400 mt-1">
                Estimated canopy ~{latestSatelliteObservation.canopyCoverPercent}% (NDVI proxy)
              </p>
            )}
          </div>
          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>Live observations on the satellite map</span>
            <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold">
              View Map &rarr;
            </span>
          </div>
        </div>

        {/* Card 2: Climate Risk Indicator */}
        <div 
          onClick={() => setActiveTab('scenarios')}
          className="glass-panel p-4 rounded-2xl hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Field Climate Risk</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className={`text-3xl font-black font-['Outfit'] ${
                nasaData?.climateRiskLevel === 'Low' ? 'text-emerald-400' :
                nasaData?.climateRiskLevel === 'Moderate' ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {nasaData?.climateRiskLevel ?? 'Unavailable'}
              </span>
              <span className="text-xs text-slate-400">
                ({nasaData?.climateRiskScore ?? 'N/A'}/100)
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              {nasaData?.longestDrySpellDays != null
                ? `${nasaData.longestDrySpellDays}d dry spell`
                : 'Dry spell unavailable'}
              {' • '}
              {nasaData?.totalPrecipitationMm != null
                ? `${nasaData.totalPrecipitationMm}mm historical rain`
                : nasaData?.qualityWarnings?.length
                  ? 'Rainfall withheld pending validation'
                  : 'Historical rainfall unavailable'}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>NASA POWER + Open-Meteo Daily</span>
            <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold">
              Test Scenarios &rarr;
            </span>
          </div>
        </div>

        {/* Card 3: Boundary soil profile */}
        <div 
          onClick={() => setActiveTab('soilWater')}
          className="glass-panel p-4 rounded-2xl hover:border-teal-500/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{hasDrawnBoundary ? "Boundary Soil Profile" : "Soil Profile"}</span>
              <Leaf className="w-4 h-4 text-teal-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-teal-400 font-['Outfit']">
                {soilCardValue}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              {soilCardDetail}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{hasDrawnBoundary ? "SoilGrids prediction" : "Soil diagnostics"}</span>
            <span className="text-teal-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold">
              Soil Diagnostics &rarr;
            </span>
          </div>
        </div>

        {/* Card 4: Boundary soil water */}
        <div 
          onClick={() => setActiveTab('soilWater')}
          className="glass-panel p-4 rounded-2xl hover:border-cyan-500/50 transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>{hasDrawnBoundary ? "Root-Zone Soil Moisture" : "Soil & Water"}</span>
              <Droplet className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-black text-cyan-300 font-['Outfit']">
                {waterCardValue}
              </span>
            </div>
            <p className="text-xs text-slate-300 font-medium mt-1">
              {waterCardDetail}
            </p>
          </div>
          <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>{hasDrawnBoundary ? "Open-Meteo reanalysis" : "Water details"}</span>
            <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-bold">
              Water Calculator &rarr;
            </span>
          </div>
        </div>
      </div>

      {/* 3.5. Smart Crop & Market Advisory Launch Card (Handwritten Plan Workflow) */}
      <div 
        onClick={() => setActiveTab('advisory')}
        className="glass-panel p-6 rounded-3xl border border-emerald-500/40 bg-gradient-to-r from-emerald-950/70 via-slate-900 to-teal-950/60 hover:border-emerald-400 transition-all cursor-pointer group shadow-2xl relative overflow-hidden"
      >
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Featured Decision System
              </span>
              <span className="text-xs text-slate-400">
                90-day NASA POWER history • selected inputs • reference prices
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white font-['Outfit'] group-hover:text-emerald-300 transition-colors">
              Smart Crop & Market Advisory: Dual Strategy Engine (P-1 & P-2)
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Uses recent NASA POWER history, selected soil and crop assumptions, fixed crop rules, and static reference mandi prices. Validate outputs with local field and market data.
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-950/50 group-hover:scale-105 transition-all">
            <span>Launch Smart Advisory</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* 4. Quick Action Decision Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Action 1: 3D Field Twin Launcher */}
        <div 
          onClick={() => setActiveTab('fieldTwin3D')}
          className="glass-panel p-5 rounded-2xl hover:border-cyan-500/60 transition-all cursor-pointer group bg-gradient-to-br from-slate-900 to-cyan-950/30 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 w-max group-hover:scale-110 transition-transform">
              <Box className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Launch Interactive 3D Field Twin
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Explore 3D elevation contours, crop row canopy growth, and simulate rainfall vs drought in real-time WebGL.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 text-xs font-bold text-cyan-400 group-hover:translate-x-1 transition-transform">
            <span>Enter 3D Digital Twin</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Action 2: Crop Rotation Simulator */}
        <div 
          onClick={() => setActiveTab('rotation')}
          className="glass-panel p-5 rounded-2xl hover:border-emerald-500/60 transition-all cursor-pointer group bg-gradient-to-br from-slate-900 to-emerald-950/30 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-max group-hover:scale-110 transition-transform">
              <RotateCw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              Simulate 3 Crop Rotation Plans
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Compare baseline continuous monoculture against diversification and regenerative soil-building rotations over 4 seasons.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 text-xs font-bold text-emerald-400 group-hover:translate-x-1 transition-transform">
            <span>Simulate Rotations & Shift Farming</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>

        {/* Action 3: AI Voice Advisor */}
        <div 
          onClick={() => setActiveTab('aiAdvisor')}
          className="glass-panel p-5 rounded-2xl hover:border-teal-500/60 transition-all cursor-pointer group bg-gradient-to-br from-slate-900 to-teal-950/30 flex flex-col justify-between"
        >
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 w-max group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
              AI Voice Farm Advisor (मराठी / हिन्दी)
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Ask questions via voice microphone and listen to advice tailored to your farm acreage, budget, and water supply.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center gap-1.5 text-xs font-bold text-teal-400 group-hover:translate-x-1 transition-transform">
            <span>Speak with AI Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
