import React, { useState, useMemo } from 'react';
import { deduplicateIncidents } from '../utils/deduplicate';
import {
  Activity,
  Flame,
  Zap,
  Sliders,
  Search,
  Filter,
  ArrowUpDown,
  Compass,
  ExternalLink,
  ChevronRight,
  Clock,
  MapPin,
  X
} from 'lucide-react';

export default function Sidebar({
  categories,
  onToggleCategory,
  minMagnitude,
  onMinMagnitudeChange,
  searchQuery,
  onSearchChange,
  incidents,
  filteredIncidents,
  selectedIncident,
  onSelectIncident,
  isOpen,
  onClose,
  stats
}) {
  const [sortBy, setSortBy] = useState('time'); // 'time' | 'magnitude'

  // Format relative time
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Recent';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${Math.max(1, seconds)}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Sort incidents & ensure deduplication
  const sortedIncidents = useMemo(() => {
    const list = deduplicateIncidents(filteredIncidents);
    if (sortBy === 'magnitude') {
      return list.sort((a, b) => (b.magnitude || 0) - (a.magnitude || 0));
    }
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [filteredIncidents, sortBy]);

  return (
    <aside
      id="incident-sidebar-panel"
      className="w-full md:w-96 bg-surface-900/95 md:bg-surface-900/85 backdrop-blur-xl md:border-r md:border-slate-800/40 flex flex-col shrink-0 static md:h-full transition-all"
    >
      {/* Sidebar Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
            Telemetry Filters
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 font-mono font-medium border border-slate-700">
            {filteredIncidents.length} shown
          </span>
        </div>
      </div>

      {/* Filter Controls Area */}
      <div className="p-4 space-y-4 bg-slate-950/40">
        {/* Category Checkboxes */}
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
            Incident Categories
          </label>
          <div className="grid grid-cols-1 gap-2">
            {/* Earthquakes Toggle */}
            <label
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                categories.earthquake
                  ? 'bg-red-950/40 border-red-500/40 text-red-100 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="filter-earthquake"
                  checked={categories.earthquake}
                  onChange={() => onToggleCategory('earthquake')}
                  className="w-4 h-4 rounded text-red-500 focus:ring-red-500/30 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"></span>
                  <Activity className="w-3.5 h-3.5 text-red-400" />
                  <span>Earthquakes (USGS)</span>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/20">
                {stats.earthquakes || 0}
              </span>
            </label>

            {/* Wildfires Toggle */}
            <label
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                categories.wildfire
                  ? 'bg-orange-950/40 border-orange-500/40 text-orange-100 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="filter-wildfire"
                  checked={categories.wildfire}
                  onChange={() => onToggleCategory('wildfire')}
                  className="w-4 h-4 rounded text-orange-500 focus:ring-orange-500/30 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]"></span>
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  <span>Wildfires (NASA)</span>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-orange-950/80 text-orange-300 border border-orange-500/20">
                {stats.wildfires || 0}
              </span>
            </label>

            {/* Storms Toggle */}
            <label
              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                categories.storm
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-100 shadow-sm'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  id="filter-storm"
                  checked={categories.storm}
                  onChange={() => onToggleCategory('storm')}
                  className="w-4 h-4 rounded text-cyan-500 focus:ring-cyan-500/30 bg-slate-900 border-slate-700 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 font-medium text-xs">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]"></span>
                  <Zap className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Severe Storms (NASA)</span>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/20">
                {stats.storms || 0}
              </span>
            </label>
          </div>
        </div>

        {/* Minimum Magnitude Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              Min Magnitude:
            </span>
            <span className="font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
              {minMagnitude === 0 ? 'All (≥ 0.0)' : `≥ ${minMagnitude.toFixed(1)}`}
            </span>
          </div>

          <input
            type="range"
            id="min-magnitude-slider"
            min="0"
            max="7.0"
            step="0.5"
            value={minMagnitude}
            onChange={(e) => onMinMagnitudeChange(parseFloat(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
          />

          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.0 (All)</span>
            <span>2.5 (Minor)</span>
            <span>4.5 (Moderate)</span>
            <span>6.0+ (Major)</span>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative pt-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            id="incident-search-input"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search city, region, or title..."
            className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-3.5 text-slate-400 hover:text-slate-200 text-xs"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Incident List Header & Sorting */}
      <div className="px-4 py-2.5 bg-slate-950/70 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">
          Incident Feed ({sortedIncidents.length})
        </span>

        <button
          onClick={() => setSortBy(sortBy === 'time' ? 'magnitude' : 'time')}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 font-mono transition-colors"
          title="Toggle sort order"
        >
          <ArrowUpDown className="w-3 h-3" />
          <span>Sort: {sortBy === 'time' ? 'Recent' : 'Magnitude'}</span>
        </button>
      </div>

      {/* Scrollable Incidents Feed */}
      <div className="max-h-[480px] md:max-h-none md:flex-1 overflow-y-auto p-2 space-y-1">
        {sortedIncidents.length === 0 ? (
          <div className="p-8 text-center text-slate-500 space-y-2">
            <Compass className="w-8 h-8 mx-auto text-slate-600 animate-pulse" />
            <p className="text-xs">No incidents match current filter criteria.</p>
            <button
              onClick={() => {
                onMinMagnitudeChange(0);
                onSearchChange('');
              }}
              className="text-xs text-cyan-400 hover:underline pt-1"
            >
              Reset filters
            </button>
          </div>
        ) : (
          sortedIncidents.map((incident) => {
            const isSelected = selectedIncident?.id === incident.id;
            const isEarthquake = incident.category === 'earthquake';
            const isWildfire = incident.category === 'wildfire';
            const isStorm = incident.category === 'storm';

            return (
              <div
                key={incident.id}
                onClick={() => onSelectIncident(incident)}
                className={`group p-2.5 rounded-xl transition-all cursor-pointer text-left border ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-lg shadow-cyan-500/10'
                    : 'bg-slate-900/40 border-transparent hover:bg-slate-800/50 hover:border-slate-700/50'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        isEarthquake
                          ? 'bg-red-500'
                          : isWildfire
                          ? 'bg-orange-500'
                          : 'bg-cyan-400'
                      }`}
                    ></span>
                    <span className="text-xs font-semibold text-slate-200 truncate group-hover:text-cyan-300 transition-colors">
                      {incident.title}
                    </span>
                  </div>

                  {/* Magnitude / Severity badge */}
                  {incident.magnitude !== null ? (
                    <span
                      className={`shrink-0 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${
                        isEarthquake
                          ? 'bg-red-950/60 border-red-500/30 text-red-300'
                          : isWildfire
                          ? 'bg-orange-950/60 border-orange-500/30 text-orange-300'
                          : 'bg-cyan-950/60 border-cyan-500/30 text-cyan-300'
                      }`}
                    >
                      {isEarthquake && `M ${incident.magnitude}`}
                      {isWildfire && `${incident.magnitude} ac`}
                      {isStorm && `${incident.magnitude} kts`}
                    </span>
                  ) : (
                    <span className="shrink-0 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pl-3.5">
                  <span className="flex items-center gap-1 truncate max-w-[180px]">
                    <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="truncate">{incident.location}</span>
                  </span>

                  <span className="flex items-center gap-1 font-mono text-[10px] text-slate-500 shrink-0">
                    <Clock className="w-2.5 h-2.5" />
                    {formatTimeAgo(incident.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-3 bg-slate-950 text-[11px] text-slate-500 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          USGS & NASA Feeds
        </span>
        <span className="text-slate-600">Click event to pan map</span>
      </div>
    </aside>
  );
}
