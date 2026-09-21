import React from 'react';
import { ShieldAlert, AlertTriangle, Activity, Flame, Zap, Gauge } from 'lucide-react';

export default function StatsBar({ stats, cacheInfo, incidentsCount }) {
  return (
    <div className="h-10 bg-surface-950/95 px-4 flex items-center justify-between text-xs text-slate-400 select-none overflow-x-auto whitespace-nowrap z-20">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono uppercase text-[10px]">Active Events:</span>
          <span className="font-bold text-white font-mono">{incidentsCount}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500"></span>
          <span className="text-slate-400">Earthquakes:</span>
          <span className="font-mono font-semibold text-red-300">{stats.earthquakes || 0}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500"></span>
          <span className="text-slate-400">Wildfires:</span>
          <span className="font-mono font-semibold text-orange-300">{stats.wildfires || 0}</span>
        </div>

        <div className="hidden sm:flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span className="text-slate-400">Storms:</span>
          <span className="font-mono font-semibold text-cyan-300">{stats.storms || 0}</span>
        </div>

        {stats.maxEarthquakeMag ? (
          <div className="hidden md:flex items-center gap-1.5 font-mono">
            <Gauge className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-500">Peak Quake:</span>
            <span className="font-bold text-amber-400">M {stats.maxEarthquakeMag}</span>
          </div>
        ) : null}

        {stats.severities?.critical ? (
          <div className="flex items-center gap-1 text-red-400 font-mono">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Critical: {stats.severities.critical}</span>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-4 text-[11px] font-mono text-slate-500">
        <span className="hidden lg:inline">
          USGS GeoJSON &bull; NASA EONET v3
        </span>
        <span>
          Synced: {stats.fetchedAt ? new Date(stats.fetchedAt).toLocaleTimeString() : 'Live'}
        </span>
      </div>
    </div>
  );
}
