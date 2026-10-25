import React, { useState } from 'react';
import { 
  Rocket, 
  GitBranch, 
  ExternalLink, 
  CheckCircle2, 
  Terminal, 
  Copy, 
  Download, 
  Layers, 
  Cpu, 
  Globe2, 
  Sparkles,
  BookOpen,
  Award
} from 'lucide-react';

export default function NasaChallengeDossier({ activeField, nasaData, onOpenGitModal }) {
  const [copied, setCopied] = useState(false);
  const repoUrl = "https://github.com/rupeshpatil14042006-cpu/NASA.git";

  const gitPushCommand = `git add .\ngit commit -m "feat: SQUADX NASA Earth Observation & Crop Rotation Platform"\ngit branch -M main\ngit push -u origin main`;

  const copyCommand = () => {
    navigator.clipboard.writeText(gitPushCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Challenge Header */}
      <div className="glass-panel p-6 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-cyan-950/20 to-emerald-950/30 border border-cyan-500/30">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Rocket className="w-6 h-6 animate-pulse" />
            </span>
            <span className="text-xs uppercase font-extrabold tracking-widest text-cyan-400">
              NASA International Space Apps Challenge
            </span>
          </div>
          <h2 className="text-2xl font-black text-slate-100 font-['Outfit']">
            SQUADX : Earth Observation Agro-Intelligence Platform
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Harnessing NASA Earth Science Data (POWER, MODIS, Landsat, GPM) to drive precision crop rotation, 3D field twin visualization, water budgeting, and multilingual farmer advisory.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <a
            href={repoUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-100 text-xs font-bold transition-all shadow-md"
          >
            <GitBranch className="w-4 h-4 text-cyan-400" />
            <span>GitHub Repository</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            onClick={exportReport}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
          >
            <Download className="w-4 h-4" />
            <span>Print / Save PDF Dossier</span>
          </button>
        </div>
      </div>

      {/* 2. GitHub Automatic Connection Status */}
      <div className="glass-panel-glow p-5 rounded-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-100 font-['Outfit']">
              Automated Git Repository Integration
            </h3>
          </div>
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Connected to GitHub
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-slate-400 block font-medium">Remote Origin Target:</span>
            <p className="font-mono text-cyan-300 font-bold text-xs break-all">
              {repoUrl}
            </p>
            <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span>Local Workspace: <b className="text-slate-200">SQUADX</b></span>
              <span>Branch: <b className="text-emerald-400">main</b></span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-medium">Push to Remote Script:</span>
              <button
                onClick={copyCommand}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold text-[11px]"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? "Copied!" : "Copy"}</span>
              </button>
            </div>
            <div className="p-2 rounded-lg bg-slate-950 font-mono text-[11px] text-emerald-300 overflow-x-auto whitespace-pre">
              {gitPushCommand}
            </div>
          </div>
        </div>
      </div>

      {/* 3. NASA Earth Observation Data Matrix */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
          <Globe2 className="w-4 h-4 text-emerald-400" />
          NASA Earth Observation Datasets Integrated in SQUADX
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              NASA POWER
            </span>
            <h4 className="font-bold text-slate-100 text-sm">Agroclimatology API</h4>
            <p className="text-slate-400 leading-relaxed">
              Daily point reanalysis supplying 2-meter air temperature (T2M), precipitation (PRECTOTCORR), and surface solar insolation for crop evapotranspiration calculations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              MODIS Terra / Aqua
            </span>
            <h4 className="font-bold text-slate-100 text-sm">Vegetation Health & NDVI</h4>
            <p className="text-slate-400 leading-relaxed">
              Provides multi-temporal NDVI index and broad-area canopy coverage tracking to identify seasonal anomalies and crop stress zones.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Landsat 8 / 9
            </span>
            <h4 className="font-bold text-slate-100 text-sm">Field-Scale Multispectral</h4>
            <p className="text-slate-400 leading-relaxed">
              High-resolution 30-meter optical and thermal bands enabling individual sub-plot boundary monitoring, hardpan compaction detection, and localized stress demarcation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
              NASA GPM IMERG
            </span>
            <h4 className="font-bold text-slate-100 text-sm">Precipitation Observations</h4>
            <p className="text-slate-400 leading-relaxed">
              Global Precipitation Measurement satellite constellation providing early rainfall deficit warnings and dry spell length calculations.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
              NASA Earthdata & GIBS
            </span>
            <h4 className="font-bold text-slate-100 text-sm">Global Imagery Browse</h4>
            <p className="text-slate-400 leading-relaxed">
              Web Map Tile Service (WMTS) delivering near-real-time full-resolution true-color and false-color satellite base layers to the Leaflet interactive map.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
              NASA SMAP
            </span>
            <h4 className="font-bold text-slate-100 text-sm">Soil Moisture Active-Passive</h4>
            <p className="text-slate-400 leading-relaxed">
              Root-zone soil moisture indicators calibrated with local soil texture measurements to detect crop water stress before visual canopy wilting occurs.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Complete Implementation Architecture Workflow */}
      <div className="glass-panel p-5 rounded-2xl space-y-4">
        <h3 className="text-sm font-bold text-slate-100 font-['Outfit'] flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-400" />
          5-Step Decision Making Workflow Built for Judges & Farmers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="font-extrabold text-emerald-400 text-sm">01</span>
            <h5 className="font-bold text-slate-200">Field Profile</h5>
            <p className="text-slate-400 text-[11px]">GPS coordinates, soil texture, pH, lab vs satellite labels.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="font-extrabold text-cyan-400 text-sm">02</span>
            <h5 className="font-bold text-slate-200">NASA Ingestion</h5>
            <p className="text-slate-400 text-[11px]">Live POWER API query, rainfall, drought index, NDVI history.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="font-extrabold text-amber-400 text-sm">03</span>
            <h5 className="font-bold text-slate-200">Rotation Engine</h5>
            <p className="text-slate-400 text-[11px]">Sequential recommendations ("What to plant next") & Shift farming.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="font-extrabold text-purple-400 text-sm">04</span>
            <h5 className="font-bold text-slate-200">Compare Plans</h5>
            <p className="text-slate-400 text-[11px]">3-plan simulation: Water, nitrogen credit, soil score & profit.</p>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="font-extrabold text-teal-400 text-sm">05</span>
            <h5 className="font-bold text-slate-200">AI Voice Explain</h5>
            <p className="text-slate-400 text-[11px]">Natural explanation in Marathi, Hindi, English with speech output.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
