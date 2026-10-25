import React from 'react';
import { 
  LayoutDashboard, 
  Satellite, 
  Box, 
  CloudSun,
  RotateCw, 
  Droplet, 
  FlaskConical, 
  Bot, 
  TrendingUp, 
  FolderGit2,
  Sparkles
} from 'lucide-react';
import { translations } from '../data/translations';

export default function Navigation({ activeTab, setActiveTab, currentLang }) {
  const t = translations[currentLang] || translations.en;

  const tabs = [
    { id: 'dashboard', label: t.dashboard, icon: LayoutDashboard },
    { id: 'advisory', label: t.cropAdvisory, icon: Sparkles, highlight: true },
    { id: 'satellite', label: t.satelliteMap, icon: Satellite },
    { id: 'fieldTwin3D', label: t.fieldTwin3D, icon: Box, highlight: true },
    { id: 'climateRisk', label: t.climateRiskTab, icon: CloudSun },
    { id: 'rotation', label: t.cropRotation, icon: RotateCw },
    { id: 'soilWater', label: t.soilWater, icon: Droplet },
    { id: 'scenarios', label: t.scenarioLab, icon: FlaskConical },
    { id: 'aiAdvisor', label: t.aiAdvisor, icon: Bot, pulse: true },
    { id: 'profit', label: t.profitAnalysis, icon: TrendingUp },
    { id: 'gitSync', label: t.gitSync, icon: FolderGit2 }
  ];

  return (
    <nav className="bg-[#0b101f]/80 backdrop-blur-md border-b border-slate-800/80 sticky top-[57px] z-40 overflow-x-auto scrollbar-none">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 flex items-center gap-1 py-1.5 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all duration-200 relative ${
                isActive
                  ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-cyan-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'} ${tab.pulse ? 'animate-pulse text-cyan-400' : ''}`} />
              <span>{tab.label}</span>

              {tab.highlight && (
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  3D
                </span>
              )}

              {isActive && (
                <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
