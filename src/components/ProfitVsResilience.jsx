import React, { useState } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Droplet, 
  ShieldCheck, 
  PieChart, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight,
  Filter
} from 'lucide-react';
import { CROPS, SIMULATION_PLANS } from '../data/cropsData';

export default function ProfitVsResilience({ activeField, currentLang }) {
  // Farmer priority filter
  const [selectedPriority, setSelectedPriority] = useState('balanced'); // 'profit' | 'water' | 'soil' | 'balanced'
  const [currency, setCurrency] = useState('INR'); // 'INR' | 'USD'
  const exchangeRate = 0.012; // 1 INR ~ 0.012 USD

  const plans = Object.values(SIMULATION_PLANS);

  const formatMoney = (inr) => {
    if (currency === 'USD') {
      return `$${Math.round(inr * exchangeRate).toLocaleString()}`;
    }
    return `₹${inr.toLocaleString()}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
              Economic Profitability vs Ecological Sustainability
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Compare production input expenditures, gross revenue, groundwater draw, and soil natural capital appreciation across farming systems.
          </p>
        </div>

        {/* Currency Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Currency:</span>
          <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg p-0.5">
            <button
              onClick={() => setCurrency('INR')}
              className={`px-2.5 py-1 rounded text-xs font-bold ${
                currency === 'INR' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              ₹ INR
            </button>
            <button
              onClick={() => setCurrency('USD')}
              className={`px-2.5 py-1 rounded text-xs font-bold ${
                currency === 'USD' ? 'bg-emerald-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              $ USD
            </button>
          </div>
        </div>
      </div>

      {/* 2. Priority Selector Cards */}
      <div className="glass-panel-glow p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-emerald-400" />
          Select Farmer Operational Objective:
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { id: 'balanced', title: 'Balanced Resilience', desc: 'Optimize profit while preserving soil & water', highlight: 'Most Sustainable' },
            { id: 'profit', title: 'Maximum Cash Profit', desc: 'Prioritize short-term harvest gross revenue', highlight: 'High Capital' },
            { id: 'water', title: 'Water Conservation', desc: 'Curb irrigation & groundwater exhaustion', highlight: 'Drought Defense' },
            { id: 'soil', title: 'Soil Regeneration', desc: 'Rebuild organic carbon & microbial life', highlight: 'Long-term Yield' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedPriority(item.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                selectedPriority === item.id 
                  ? 'bg-slate-900 border-emerald-500/80 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40' 
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider bg-emerald-500/20 text-emerald-300">
                {item.highlight}
              </span>
              <h4 className="text-sm font-bold text-slate-100 mt-2 font-['Outfit']">{item.title}</h4>
              <p className="text-[11px] text-slate-400 mt-1">{item.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Detailed Financial & Environmental Breakdown Table */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">
          Comprehensive 4-Season Performance Comparison (Per Acre)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-3 px-4 font-semibold">Farming Strategy</th>
                <th className="py-3 px-4 font-semibold">Total Input Cost</th>
                <th className="py-3 px-4 font-semibold">Gross Harvest Revenue</th>
                <th className="py-3 px-4 font-semibold text-emerald-400">Net Farmer Profit</th>
                <th className="py-3 px-4 font-semibold text-cyan-400">Water Demand</th>
                <th className="py-3 px-4 font-semibold">Fertilizer Savings</th>
                <th className="py-3 px-4 font-semibold">Soil Recovery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {plans.map((p) => {
                const isTopPick = (selectedPriority === 'balanced' && p.id === 'optionA') ||
                                  (selectedPriority === 'soil' && p.id === 'optionB') ||
                                  (selectedPriority === 'water' && p.id === 'optionB') ||
                                  (selectedPriority === 'profit' && p.id === 'optionA');

                return (
                  <tr 
                    key={p.id}
                    className={`transition-colors ${
                      isTopPick ? 'bg-emerald-950/20 font-medium' : 'hover:bg-slate-900/50'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-100">
                      <div className="flex items-center gap-2">
                        {p.name.split(':')[0]}
                        {isTopPick && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.2 rounded bg-emerald-500/30 text-emerald-300">
                            OPTIMAL FOR GOAL
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 block font-normal">{p.description.slice(0, 55)}...</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">{formatMoney(p.netCostPerAcreInr)}</td>
                    <td className="py-3.5 px-4 text-slate-300">{formatMoney(p.grossRevenuePerAcreInr)}</td>
                    <td className="py-3.5 px-4 text-sm font-black text-emerald-400 font-['Outfit']">
                      {formatMoney(p.netProfitPerAcreInr)}
                    </td>
                    <td className="py-3.5 px-4 text-cyan-300 font-semibold">{p.totalWaterDemandMm} mm</td>
                    <td className="py-3.5 px-4 text-slate-300">
                      {p.organicNitrogenCreditKgAcre > 0 ? `+${p.organicNitrogenCreditKgAcre} kg N fixed` : 'Zero credit'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded font-bold text-[11px] bg-slate-900 border border-slate-700 text-emerald-300">
                        {p.soilRecoveryScore}/100
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Economic Takeaway Note */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-100">Economic Insight:</span> While continuous monoculture (Plan 1) seems familiar, high synthetic fertilizer and pesticide expenses reduce net margins. Adopting <b>Plan 2 (Diversification)</b> boosts net profit by <b className="text-emerald-400">+42% ({formatMoney(19000)}/acre higher)</b> due to biological nitrogen credits and reduced pest pressure!
          </div>
        </div>
      </div>
    </div>
  );
}
