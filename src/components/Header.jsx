import React from 'react';
import { 
  Satellite, 
  Globe2, 
  GitBranch, 
  Volume2, 
  VolumeX, 
  MapPin, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { translations } from '../data/translations';

export default function Header({ 
  currentLang, 
  setCurrentLang, 
  activeField, 
  setActiveField, 
  presetFields, 
  audioEnabled, 
  setAudioEnabled,
  onOpenGitSync,
  nasaStatus
}) {
  const t = translations[currentLang] || translations.en;

  return (
    <header className="sticky top-0 z-50 bg-[#070b14]/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand Logo & NASA Title */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 via-cyan-500/10 to-transparent border border-emerald-500/30 shadow-lg shadow-emerald-500/10">
              <Satellite className="w-6 h-6 text-emerald-400 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 text-lg font-['Outfit']">
                  SQUADX
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300">
                  NASA Earthdata
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block font-medium">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          {/* Mobile Right Controls */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              title={audioEnabled ? "Mute Voice" : "Enable Voice"}
              className={`p-2 rounded-lg border text-xs transition-colors ${
                audioEnabled 
                  ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" 
                  : "bg-slate-800/80 border-slate-700 text-slate-400"
              }`}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <select
              value={currentLang}
              onChange={(e) => setCurrentLang(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
            >
              <option value="en">🇬🇧 EN</option>
              <option value="mr">🇮🇳 मराठी</option>
              <option value="hi">🇮🇳 हिन्दी</option>
            </select>
          </div>
        </div>

        {/* Center: Field Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 w-full md:w-auto shadow-inner">
            <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-xs text-slate-400 font-medium hidden lg:inline">
              {t.activeField}:
            </span>
            <select
              value={activeField?.id ?? ''}
              onChange={(e) => {
                const found = presetFields.find(f => f.id === e.target.value);
                if (found) setActiveField(found);
              }}
              className="bg-transparent text-sm text-slate-100 font-semibold focus:outline-none cursor-pointer w-full md:w-auto"
            >
              {!activeField && <option value="" disabled>Choose a location to begin</option>}
              {presetFields.some((field) => field.isGpsLocation) && (
                <optgroup
                  label="Recently used location (saved on this device)"
                  className="bg-slate-900 text-slate-400"
                >
                  {presetFields.filter((field) => field.isGpsLocation).map((field) => (
                    <option key={field.id} value={field.id} className="bg-slate-900 text-slate-100">
                      {field.name} · {field.lat.toFixed(4)}, {field.lon.toFixed(4)}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup
                label="Location history — sample fields"
                className="bg-slate-900 text-slate-400"
              >
                {presetFields.filter((field) => !field.isGpsLocation).map((field) => (
                  <option key={field.id} value={field.id} className="bg-slate-900 text-slate-100">
                    {field.name} ({field.location})
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Right Controls: NASA status, Voice toggle, Git Repo & Language */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* NASA Live Status Badge */}
          <div className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="font-medium text-[11px]">{nasaStatus || "NASA POWER Active"}</span>
          </div>

          {/* Voice Audio Toggle */}
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all ${
              audioEnabled 
                ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-sm shadow-emerald-500/20" 
                : "bg-slate-900 border-slate-700 text-slate-400 hover:text-slate-200"
            }`}
            title={audioEnabled ? "Voice Output Enabled" : "Voice Output Muted"}
          >
            {audioEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4" />}
            <span className="hidden xl:inline">{audioEnabled ? "Voice Audio ON" : "Voice OFF"}</span>
          </button>

          {/* GitHub Sync Button */}
          <button
            onClick={onOpenGitSync}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold shadow-sm transition-all hover:border-slate-600"
          >
            <GitBranch className="w-3.5 h-3.5 text-cyan-400" />
            <span>GitHub Sync</span>
          </button>

          {/* Language Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            <button
              onClick={() => setCurrentLang('en')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                currentLang === 'en' 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setCurrentLang('mr')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                currentLang === 'mr' 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              मराठी
            </button>
            <button
              onClick={() => setCurrentLang('hi')}
              className={`px-2.5 py-1 rounded text-xs font-semibold transition-all ${
                currentLang === 'hi' 
                  ? 'bg-emerald-500 text-slate-950 shadow-sm' 
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              हिन्दी
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
