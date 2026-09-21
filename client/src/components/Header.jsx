import React from 'react';
import { Activity, RefreshCw, Radio, Layers, Flame, Zap, ShieldAlert } from 'lucide-react';

export default function Header({
  stats,
  cacheInfo,
  onRefresh,
  isRefreshing,
  ttlCountdown,
  selectedCategories,
  totalFiltered,
  sidebarOpen,
  setSidebarOpen
}) {
  return (
    <header className="h-16 bg-surface-900/90 backdrop-blur-md border-b border-slate-800 px-4 md:px-6 flex items-center justify-between z-30 select-none">
      {/* Brand & Live status */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 md:hidden transition-colors"
          title="Toggle Filters & List"
        >
          <Layers className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500/20 via-sky-500/10 to-transparent border border-cyan-500/30 text-cyan-400 shadow-inner">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                AegisWatch
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
                  LIVE
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 hidden sm:block">
              Real-Time Global Incident & Environmental Tracker
            </p>
          </div>
        </div>
      </div>

      {/* Center live metrics pills */}
      <div className="hidden lg:flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/60 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
          <span className="text-slate-400">Status:</span>
          <span className="text-emerald-400 font-medium">USGS & NASA Synced</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-xs text-red-300">
          <Activity className="w-3.5 h-3.5 text-red-400" />
          <span>Quakes:</span>
          <span className="font-mono font-bold">{stats.earthquakes || 0}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-orange-950/40 border border-orange-500/30 text-xs text-orange-300">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <span>Wildfires:</span>
          <span className="font-mono font-bold">{stats.wildfires || 0}</span>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-950/40 border border-sky-500/30 text-xs text-sky-300">
          <Zap className="w-3.5 h-3.5 text-sky-400" />
          <span>Storms:</span>
          <span className="font-mono font-bold">{stats.storms || 0}</span>
        </div>
      </div>

      {/* Right Cache & Refresh Controls */}
      <div className="flex items-center gap-3">
        {/* In-memory Cache Info badge */}
        <div className="hidden sm:flex flex-col items-end text-right">
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
            <span>Cache TTL:</span>
            <span className="text-cyan-400 font-bold">{ttlCountdown}s</span>
          </div>
          <span className="text-[10px] text-slate-500">
            {cacheInfo?.cached ? 'Serving from memory' : 'Fresh fetch'}
          </span>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all shadow-md active:scale-95 ${
            isRefreshing
              ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
              : 'bg-gradient-to-r from-sky-600 to-cyan-600 hover:from-sky-500 hover:to-cyan-500 text-white border border-cyan-400/30 hover:shadow-cyan-500/20'
          }`}
          title="Force refresh API data and bust cache"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}
