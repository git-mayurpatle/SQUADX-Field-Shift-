import React, { useState } from 'react';
import { 
  GitBranch, 
  CheckCircle2, 
  ExternalLink, 
  Copy, 
  Terminal, 
  Download, 
  FileText, 
  Sparkles,
  FolderGit2,
  X
} from 'lucide-react';

export default function GitSyncModal({ isOpen, onClose, activeField, nasaData }) {
  const [copied, setCopied] = useState(false);
  const repoUrl = "https://github.com/rupeshpatil14042006-cpu/NASA.git";

  if (!isOpen) return null;

  const gitPushCommand = `git add .\ngit commit -m "feat: SQUADX NASA Earth Observation & Crop Recommender Platform"\ngit branch -M main\ngit push -u origin main`;

  const copyCommand = () => {
    navigator.clipboard.writeText(gitPushCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportFarmReportJson = () => {
    const report = {
      project: "SQUADX - NASA Earth Observation Agricultural Intelligence",
      githubRepo: repoUrl,
      generatedAt: new Date().toISOString(),
      activeField: {
        name: activeField.name,
        location: activeField.location,
        coordinates: { lat: activeField.lat, lon: activeField.lon },
        areaAcres: activeField.totalAreaAcres,
        soilType: activeField.soilType,
        soilTexture: activeField.soilTexture,
        soilIndicators: activeField.soilIndicators,
        satelliteHealth: activeField.satelliteHealth,
        shiftFarmingPlots: activeField.plots
      },
      nasaClimateStats: {
        source: nasaData?.source || "NASA POWER",
        riskLevel: nasaData?.climateRiskLevel,
        riskScore: nasaData?.climateRiskScore,
        totalPrecipitationMm: nasaData?.totalPrecipitationMm,
        averageTempC: nasaData?.averageTempC,
        extremeHeatDays: nasaData?.extremeHeatDaysCount,
        longestDrySpellDays: nasaData?.longestDrySpellDays,
        activeAlerts: nasaData?.activeAlerts
      }
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `SQUADX_Farm_Report_${activeField.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="glass-panel-glow border border-slate-700 rounded-3xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 font-['Outfit']">
                GitHub Repository Synchronization
              </h2>
              <p className="text-xs text-slate-400">
                Connected Repository: <span className="text-cyan-300 font-mono text-[11px]">{repoUrl}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Remote Status Card */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Git Remote Origin Status:</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" /> Remote Configured & Linked
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-300 pt-2 border-t border-slate-800">
            <span>Branch: <b className="text-slate-100 font-mono">main</b></span>
            <span>Remote: <b className="text-cyan-400 font-mono">origin</b></span>
            <a 
              href={repoUrl} 
              target="_blank" 
              rel="noreferrer"
              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
            >
              <span>Open on GitHub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Ready to Push Snippet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-200 flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Terminal Push Command
            </span>
            <button
              onClick={copyCommand}
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold text-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              <span>{copied ? "Copied!" : "Copy Snippet"}</span>
            </button>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 font-mono text-xs text-emerald-300 overflow-x-auto whitespace-pre">
            {gitPushCommand}
          </div>
        </div>

        {/* Export Dossier Report */}
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                Download Comprehensive Farm Report
              </h4>
              <p className="text-xs text-slate-400">
                Full agronomic dossier with NASA stats, NDVI history, soil parameters, and 3-plan rotation simulation.
              </p>
            </div>
          </div>

          <button
            onClick={exportFarmReportJson}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
