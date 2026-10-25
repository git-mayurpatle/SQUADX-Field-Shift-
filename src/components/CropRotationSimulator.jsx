import React, { useState } from 'react';
import { 
  RotateCw, 
  ArrowRight, 
  CheckCircle2, 
  ShieldCheck, 
  Droplet, 
  Sparkles, 
  AlertCircle, 
  TrendingUp, 
  Layers, 
  MapPin, 
  ChevronRight,
  Leaf
} from 'lucide-react';
import { CROPS, SIMULATION_PLANS } from '../data/cropsData';
import { translations } from '../data/translations';

export default function CropRotationSimulator({ activeField, currentLang }) {
  const t = translations[currentLang] || translations.en;
  
  // State for sequential crop advisory
  const [selectedPreviousCrop, setSelectedPreviousCrop] = useState(activeField.currentCrop || 'maize');
  // State for active plan tab in simulator
  const [activePlanId, setActivePlanId] = useState('optionA');
  // State for Shift Farming allocation view
  const [activeShiftSeason, setActiveShiftSeason] = useState('season1');

  const currentCropObj = CROPS[selectedPreviousCrop] || CROPS.maize;
  const recommendations = currentCropObj.successionRecommendations || [];

  const allCropsList = Object.values(CROPS);

  // Shift farming simulated plot allocation
  const shiftSeasons = {
    season1: {
      name: "Season 1: Kharif 2026",
      allocations: [
        { plotId: activeField.plots[0]?.id || "p1", plotName: activeField.plots[0]?.name || "Plot A", crop: "soybean", rationale: "Restores nitrogen to flat terrace with drip access." },
        { plotId: activeField.plots[1]?.id || "p2", plotName: activeField.plots[1]?.name || "Plot B", crop: "millets", rationale: "Deep taproots protect slope against rainfall runoff erosion." },
        { plotId: activeField.plots[2]?.id || "p3", plotName: activeField.plots[2]?.name || "Plot C", crop: "maize", rationale: "Thrives in high moisture retention clay depression." }
      ]
    },
    season2: {
      name: "Season 2: Rabi 2026-27",
      allocations: [
        { plotId: activeField.plots[0]?.id || "p1", plotName: activeField.plots[0]?.name || "Plot A", crop: "wheat", rationale: "Capitalizes on 55 kg/ha biological nitrogen fixed by soybean." },
        { plotId: activeField.plots[1]?.id || "p2", plotName: activeField.plots[1]?.name || "Plot B", crop: "chickpea", rationale: "Low water demand legume for sloping soil with micro-sprinkler." },
        { plotId: activeField.plots[2]?.id || "p3", plotName: activeField.plots[2]?.name || "Plot C", crop: "mustard", rationale: "Biofumigant roots sanitize heavy soil after cereal harvest." }
      ]
    },
    season3: {
      name: "Season 3: Zaid / Summer 2027",
      allocations: [
        { plotId: activeField.plots[0]?.id || "p1", plotName: activeField.plots[0]?.name || "Plot A", crop: "moong", rationale: "Short 60-day catch crop builds soil humus before next monsoon." },
        { plotId: activeField.plots[1]?.id || "p2", plotName: activeField.plots[1]?.name || "Plot B", crop: "cloverCover", rationale: "Summer green cover prevents wind erosion and builds carbon." },
        { plotId: activeField.plots[2]?.id || "p3", plotName: activeField.plots[2]?.name || "Plot C", crop: "moong", rationale: "Utilizes residual reservoir moisture in the basin." }
      ]
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <RotateCw className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
              {t.rotationRuleTitle} & Shift Farming Engine
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Optimize 2-4 season crop successions, compare side-by-side rotation plans, and intelligently shift crops across plots based on soil and water resources.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 border border-slate-700/80 px-3.5 py-2 rounded-xl">
          <Leaf className="w-4 h-4 text-emerald-400" />
          <div className="text-xs">
            <p className="text-slate-400">Current Field Crop:</p>
            <p className="font-bold text-slate-100 capitalize">{activeField.currentCrop}</p>
          </div>
        </div>
      </div>

      {/* 2. Interactive Succession Engine: "What to plant after X" */}
      <div className="glass-panel-glow p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {t.afterCropQuestion}
            </h3>
            <p className="text-xs text-slate-300">
              Select your recently harvested or standing crop to calculate optimal biological follow-up crops:
            </p>
          </div>

          {/* Harvested Crop Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={selectedPreviousCrop}
              onChange={(e) => setSelectedPreviousCrop(e.target.value)}
              className="bg-slate-900 border border-emerald-500/40 text-emerald-300 text-sm font-bold rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-400 shadow-inner"
            >
              {allCropsList.map((crop) => (
                <option key={crop.id} value={crop.id} className="bg-slate-950 text-slate-100">
                  {crop.name} ({crop.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Selected Crop Profile Badge */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800/80 text-xs">
          <div>
            <span className="text-slate-400">Crop Category:</span>
            <p className="font-semibold text-slate-200">{currentCropObj.category}</p>
          </div>
          <div>
            <span className="text-slate-400">Water Demand:</span>
            <p className="font-semibold text-cyan-300">{currentCropObj.waterDemandMm} mm ({currentCropObj.waterCategory})</p>
          </div>
          <div>
            <span className="text-slate-400">Nitrogen Balance:</span>
            <p className="font-semibold text-emerald-400">
              {currentCropObj.nitrogenFixationKgHa > 0 ? `+${currentCropObj.nitrogenFixationKgHa} kg/ha (Fixed)` : `-${currentCropObj.nitrogenDemandKgHa} kg/ha (Drained)`}
            </p>
          </div>
          <div>
            <span className="text-slate-400">Root System:</span>
            <p className="font-semibold text-slate-200">{currentCropObj.rootDepth}</p>
          </div>
        </div>

        {/* Succession Recommendations Cards */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            Top Ranked Succession Crops After {currentCropObj.name}:
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recommendations.map((rec, idx) => {
              const nextCrop = CROPS[rec.nextCropId];
              if (!nextCrop) return null;

              return (
                <div 
                  key={idx}
                  className="bg-slate-900/90 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/5 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        Rank #{idx + 1} Recommendation
                      </span>
                      <span className="text-[11px] font-semibold text-cyan-400">
                        {rec.suitability} Suitability
                      </span>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-base font-bold text-slate-100 font-['Outfit']">
                        {nextCrop.name}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {nextCrop.category}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {currentLang === 'mr' ? rec.reasonMr : currentLang === 'hi' ? rec.reasonHi : rec.reason}
                    </p>
                  </div>

                  {/* Micro specs */}
                  <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Water: {nextCrop.waterDemandMm}mm</span>
                    <span className="text-emerald-400 font-medium">
                      {nextCrop.nitrogenFixationKgHa > 0 ? `+${nextCrop.nitrogenFixationKgHa}kg N Fix` : `Duration: ${nextCrop.durationDays}d`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warning: Crops to Avoid */}
        {currentCropObj.avoidAfter && currentCropObj.avoidAfter.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
            <div>
              <span className="font-bold">Agronomic Warning:</span> Avoid immediate monoculture of {currentCropObj.name}. Continuous planting increases host-specific soil pests (nematodes, wilt, root borer) and accelerates micronutrient exhaustion.
            </div>
          </div>
        )}
      </div>

      {/* 3. Crop Rotation Simulator: Side-by-Side 3 Plans Comparison */}
      <div className="glass-panel p-5 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <Layers className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                Crop Rotation Simulator (Side-by-Side 3 Plans)
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Compare baseline monoculture with diversification and regenerative soil-building rotations over 4 seasons.
            </p>
          </div>

          {/* Plan selector pills */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1">
            {Object.values(SIMULATION_PLANS).map((plan) => (
              <button
                key={plan.id}
                onClick={() => setActivePlanId(plan.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activePlanId === plan.id
                    ? 'bg-emerald-500 text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {plan.id === 'baseline' ? 'Plan 1: Monoculture' : plan.id === 'optionA' ? 'Plan 2: Diversified' : 'Plan 3: Regenerative'}
              </button>
            ))}
          </div>
        </div>

        {/* 3-Column Comparative Overview Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Object.values(SIMULATION_PLANS).map((plan) => {
            const isSelected = activePlanId === plan.id;

            return (
              <div 
                key={plan.id}
                onClick={() => setActivePlanId(plan.id)}
                className={`rounded-2xl p-4 border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected 
                    ? 'bg-slate-900/90 border-emerald-500/60 shadow-xl shadow-emerald-500/10 ring-1 ring-emerald-500/40' 
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      plan.id === 'baseline' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                      plan.id === 'optionA' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                      'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {plan.id === 'baseline' ? 'Baseline Plan' : plan.id === 'optionA' ? 'Diversification' : 'Regenerative'}
                    </span>

                    <span className="text-xs font-bold text-slate-300">
                      Score: <span className="text-emerald-400 font-black">{plan.soilRecoveryScore}/100</span>
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-100">
                    {plan.name}
                  </h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {plan.description}
                  </p>

                  {/* 4-Season Sequence Badge List */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Crop Sequence Timeline:
                    </span>
                    <div className="space-y-1">
                      {plan.sequence.map((seq, sIdx) => {
                        const crop = CROPS[seq.cropId];
                        return (
                          <div key={sIdx} className="flex items-center justify-between text-xs bg-slate-900/70 px-2 py-1 rounded-lg border border-slate-800">
                            <span className="text-slate-400 text-[11px]">{seq.season}</span>
                            <span className="font-semibold text-slate-200">{crop ? crop.name : seq.cropId}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Key Comparative Metrics */}
                <div className="pt-4 mt-4 border-t border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-cyan-400" /> Water Demand:
                    </span>
                    <span className="font-bold text-cyan-300">{plan.totalWaterDemandMm} mm</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Soil N Credit:
                    </span>
                    <span className="font-bold text-emerald-400">+{plan.organicNitrogenCreditKgAcre} kg N/acre</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Climate Risk:</span>
                    <span className={`font-bold ${
                      plan.climateRiskLevel === 'Low' ? 'text-emerald-400' :
                      plan.climateRiskLevel === 'Moderate' ? 'text-amber-400' : 'text-rose-400'
                    }`}>
                      {plan.climateRiskLevel} ({plan.climateRiskScore}%)
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80">
                    <span className="text-slate-400">Est. Net Profit:</span>
                    <span className="font-black text-slate-100 text-sm">₹{plan.netProfitPerAcreInr.toLocaleString()}/acre</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Shift Farming Across Multiple Plots */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <MapPin className="w-4 h-4" />
              </span>
              <h3 className="text-base font-bold text-slate-100 font-['Outfit']">
                {t.shiftFarmingTitle}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
              {t.shiftFarmingDesc}
            </p>
          </div>

          {/* Season Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-xl p-1">
            {Object.keys(shiftSeasons).map((sKey) => (
              <button
                key={sKey}
                onClick={() => setActiveShiftSeason(sKey)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                  activeShiftSeason === sKey 
                    ? 'bg-teal-500 text-slate-950 font-bold' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {shiftSeasons[sKey].name.split(':')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Current Season Shift Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {shiftSeasons[activeShiftSeason].allocations.map((alloc, idx) => {
            const crop = CROPS[alloc.crop];
            const originalPlot = activeField.plots.find(p => p.id === alloc.plotId) || activeField.plots[idx] || {};

            return (
              <div key={idx} className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-slate-200">{alloc.plotName}</span>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-cyan-300 font-medium">
                    {originalPlot.acres || 3} Acres
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 text-xs space-y-1">
                  <div className="flex justify-between text-slate-400">
                    <span>Slope / Drainage:</span>
                    <span className="text-slate-200">{originalPlot.slope || '2% (Flat)'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Irrigation Infrastructure:</span>
                    <span className="text-slate-200">{originalPlot.waterAccess || 'Drip'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Soil Reaction:</span>
                    <span className="text-emerald-400 font-semibold">pH {originalPlot.soilPh || 7.2}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400">Shifted Crop:</span>
                  <span className="text-sm font-bold text-emerald-400">{crop ? crop.name : alloc.crop}</span>
                </div>

                <p className="text-[11px] text-slate-300 italic">
                  💡 {alloc.rationale}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
