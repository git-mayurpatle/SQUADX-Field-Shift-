import React, { useState } from 'react';
import { 
  FlaskConical, 
  CloudRain, 
  Thermometer, 
  Droplet, 
  AlertTriangle, 
  TrendingDown, 
  TrendingUp, 
  CheckCircle2, 
  HelpCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { CROPS } from '../data/cropsData';

export default function ScenarioLab({ activeField, currentLang }) {
  // Scenario simulation sliders
  const [rainfallAnomalyPercent, setRainfallAnomalyPercent] = useState(-20); // -50% to +50%
  const [tempIncreaseC, setTempIncreaseC] = useState(2.0); // 0.0 to 4.0 °C
  const [irrigationAvailablePercent, setIrrigationAvailablePercent] = useState(60); // 20% to 100%

  // Simulation calculations
  // Baseline crop yield sensitivity
  const currentCrop = CROPS[activeField.currentCrop] || CROPS.maize;

  // Temperature penalty: crops suffer if temp exceeds max limit
  const tempExcess = Math.max(0, (28 + tempIncreaseC) - (currentCrop.tempRange[1] - 4));
  const tempStressPercent = Math.min(60, tempExcess * 9);

  // Moisture penalty: combination of rain deficit and reduced irrigation
  const totalWaterFraction = (1 + rainfallAnomalyPercent / 100) * 0.5 + (irrigationAvailablePercent / 100) * 0.5;
  const moistureDeficitPercent = Math.max(0, (1 - totalWaterFraction) * 65);

  const combinedStressIndex = Math.min(95, Math.round(tempStressPercent + moistureDeficitPercent));
  const projectedYieldChange = Math.max(-85, Math.round(-combinedStressIndex * 0.9));

  // Determine which crops remain most resilient under this simulated scenario
  const cropList = Object.values(CROPS);
  const rankedResilientCrops = [...cropList].map((crop) => {
    let resilienceScore = 80;

    // Heat resistance
    if (crop.tempRange[1] >= 38) resilienceScore += 25;
    else if (crop.tempRange[1] <= 28) resilienceScore -= tempIncreaseC * 12;

    // Water demand resilience
    if (crop.waterCategory === 'Low') resilienceScore += 20;
    else if (crop.waterCategory === 'High') resilienceScore -= (moistureDeficitPercent * 0.6);

    // Legume bonus for nitrogen buffering
    if (crop.category === 'Legume' || crop.category === 'Millet') resilienceScore += 15;

    return {
      ...crop,
      simulatedScore: Math.round(Math.max(10, Math.min(99, resilienceScore)))
    };
  }).sort((a, b) => b.simulatedScore - a.simulatedScore);

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <FlaskConical className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
              What-If Climate Scenario Simulator
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Stress-test your farm against extreme climate disruptions: drought, abnormal heatwaves, and restricted canal/groundwater irrigation.
          </p>
        </div>

        {/* Disclaimer Tag */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 max-w-xs">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>Exploratory sensitivity analysis (not a weather forecast prediction).</span>
        </div>
      </div>

      {/* 2. Interactive Scenario Sliders */}
      <div className="glass-panel-glow p-5 rounded-2xl space-y-5">
        <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
          Configure Simulated Climate Stress Variables:
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Slider 1: Rainfall Anomaly */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <CloudRain className="w-4 h-4 text-cyan-400" />
                Rainfall Anomaly
              </span>
              <span className={`font-black text-sm ${rainfallAnomalyPercent < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {rainfallAnomalyPercent > 0 ? `+${rainfallAnomalyPercent}%` : `${rainfallAnomalyPercent}%`}
              </span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={rainfallAnomalyPercent}
              onChange={(e) => setRainfallAnomalyPercent(Number(e.target.value))}
              className="w-full accent-cyan-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-50% Drought</span>
              <span>Normal</span>
              <span>+50% Excess</span>
            </div>
          </div>

          {/* Slider 2: Temperature Offset */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-amber-400" />
                Temperature Increase
              </span>
              <span className="font-black text-sm text-amber-400">
                +{tempIncreaseC}°C
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="4"
              step="0.5"
              value={tempIncreaseC}
              onChange={(e) => setTempIncreaseC(Number(e.target.value))}
              className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0°C (Baseline)</span>
              <span>+2°C (Moderate)</span>
              <span>+4°C (Extreme)</span>
            </div>
          </div>

          {/* Slider 3: Irrigation Availability */}
          <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-teal-400" />
                Irrigation Available
              </span>
              <span className={`font-black text-sm ${irrigationAvailablePercent < 50 ? 'text-rose-400' : 'text-teal-400'}`}>
                {irrigationAvailablePercent}%
              </span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="10"
              value={irrigationAvailablePercent}
              onChange={(e) => setIrrigationAvailablePercent(Number(e.target.value))}
              className="w-full accent-teal-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>20% (Severely Capped)</span>
              <span>60%</span>
              <span>100% (Full Supply)</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Simulated Impact on Current Crop */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Stress Index */}
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <p className="text-xs text-slate-400">Simulated Crop Stress Index</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-['Outfit'] ${
              combinedStressIndex >= 60 ? 'text-rose-400' :
              combinedStressIndex >= 30 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {combinedStressIndex}%
            </span>
            <span className="text-xs text-slate-400">
              {combinedStressIndex >= 60 ? 'Severe Vulnerability' : combinedStressIndex >= 30 ? 'Moderate Strain' : 'Low Stress'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Thermal + Soil moisture deficit combined
          </p>
        </div>

        {/* Projected Yield Impact */}
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <p className="text-xs text-slate-400">Projected Yield Impact on {currentCrop.name}</p>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-black font-['Outfit'] flex items-center ${
              projectedYieldChange < 0 ? 'text-rose-400' : 'text-emerald-400'
            }`}>
              {projectedYieldChange}%
            </span>
            <span className="text-xs text-slate-400">
              {projectedYieldChange < -30 ? 'High Production Loss' : 'Tolerable Decline'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Baseline expected yield: {currentCrop.avgYieldQuintalPerAcre} q/acre
          </p>
        </div>

        {/* Action Strategy */}
        <div className="glass-panel p-4 rounded-xl space-y-1">
          <p className="text-xs text-slate-400">Recommended Adaptation Strategy</p>
          <p className="text-sm font-bold text-slate-200 mt-1">
            {combinedStressIndex >= 50 
              ? "Transition immediately to drought-hardy Millets or short-cycle Pulses" 
              : "Apply organic straw mulch and advance sowing by 8 days"}
          </p>
          <p className="text-[11px] text-emerald-400 font-medium mt-1">
            Preserves 22% subsoil moisture from evaporation
          </p>
        </div>
      </div>

      {/* 4. Dynamically Ranked Resilient Crops Under This Scenario */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">
              Ranked Crop Resilience Under Current What-If Scenario
            </h3>
            <p className="text-xs text-slate-400">
              Which crops maintain highest viability under Rainfall: {rainfallAnomalyPercent}%, Temp: +{tempIncreaseC}°C, Irrigation: {irrigationAvailablePercent}%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rankedResilientCrops.slice(0, 4).map((crop, idx) => (
            <div 
              key={crop.id}
              className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3 relative overflow-hidden"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Rank #{idx + 1} Choice
                </span>
                <span className="text-xs font-black text-emerald-400">
                  {crop.simulatedScore}/100 Fit
                </span>
              </div>

              <div>
                <h4 className="text-base font-bold text-slate-100 font-['Outfit']">
                  {crop.name}
                </h4>
                <p className="text-[11px] text-slate-400">{crop.category} • {crop.durationDays} Days</p>
              </div>

              <div className="p-2 rounded-lg bg-slate-950 text-xs text-slate-300 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Water Need:</span>
                  <span className="text-cyan-300 font-semibold">{crop.waterDemandMm} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Max Temp Limit:</span>
                  <span className="text-amber-300 font-semibold">{crop.tempRange[1]}°C</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-300 line-clamp-2">
                {crop.benefits}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
