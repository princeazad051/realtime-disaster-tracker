import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import StatsBar from './components/StatsBar';
import { Radio, RefreshCw, AlertCircle } from 'lucide-react';

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({});
  const [cacheInfo, setCacheInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter states
  const [categories, setCategories] = useState({
    earthquake: true,
    wildfire: true,
    storm: true
  });
  const [minMagnitude, setMinMagnitude] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // TTL Countdown state
  const [ttlCountdown, setTtlCountdown] = useState(300);

  // Fetch incidents data
  const loadIncidents = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '') : '';
      const endpoint = `${apiBase}${isRefresh ? '/api/incidents/refresh' : '/api/incidents'}`;
      const method = isRefresh ? 'POST' : 'GET';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        throw new Error(`API error HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.success) {
        setIncidents(data.incidents || []);
        setStats(data.stats || {});
        setCacheInfo(data.cacheInfo || null);
        if (data.cacheInfo?.ttlRemainingSeconds) {
          setTtlCountdown(data.cacheInfo.ttlRemainingSeconds);
        } else {
          setTtlCountdown(300);
        }
      } else {
        throw new Error(data.error || 'Failed to load telemetry data');
      }
    } catch (err) {
      console.error('[App] Error fetching incidents:', err);
      setError(err.message || 'Network connection failed');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadIncidents(false);
  }, [loadIncidents]);

  // TTL countdown timer interval (1s)
  useEffect(() => {
    const timer = setInterval(() => {
      setTtlCountdown((prev) => {
        if (prev <= 1) {
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Category toggle handler
  const handleToggleCategory = (categoryKey) => {
    setCategories((prev) => {
      const updated = { ...prev, [categoryKey]: !prev[categoryKey] };
      // Ensure at least one category remains selected
      if (!updated.earthquake && !updated.wildfire && !updated.storm) {
        return prev;
      }
      return updated;
    });
  };

  // Filtered incidents memo
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // 1. Category filter
      if (!categories[incident.category]) {
        return false;
      }

      // 2. Minimum magnitude slider filter
      if (minMagnitude > 0) {
        if (incident.category === 'earthquake') {
          if (incident.magnitude === null || incident.magnitude < minMagnitude) {
            return false;
          }
        } else if (incident.category === 'storm') {
          // Approximate storm wind scale: minMag 3 = 45 kts, minMag 4.5 = 64 kts, minMag 6 = 90 kts
          const stormThreshold = minMagnitude * 15;
          if (incident.magnitude !== null && incident.magnitude < stormThreshold) {
            return false;
          }
        } else if (incident.category === 'wildfire') {
          // If magnitude is present (acres), filter out very small brush events
          if (minMagnitude >= 4.0 && incident.severity === 'low') {
            return false;
          }
        }
      }

      // 3. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = incident.title && incident.title.toLowerCase().includes(q);
        const matchesLocation = incident.location && incident.location.toLowerCase().includes(q);
        const matchesId = incident.id && incident.id.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLocation && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [incidents, categories, minMagnitude, searchQuery]);

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden select-none">
      {/* Top Header */}
      <Header
        stats={stats}
        cacheInfo={cacheInfo}
        onRefresh={() => loadIncidents(true)}
        isRefreshing={isRefreshing}
        ttlCountdown={ttlCountdown}
        selectedCategories={categories}
        totalFiltered={filteredIncidents.length}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content: Sidebar + World Map */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Radio className="w-8 h-8 animate-ping" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Initializing Global Telemetry
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Aggregating live events from USGS Earthquakes & NASA EONET...
              </p>
            </div>
          </div>
        )}

        {/* Error Notification Bar */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-950/90 border border-red-500/50 text-red-200 px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-3 backdrop-blur-md">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
            <span className="text-xs font-medium">{error}</span>
            <button
              onClick={() => loadIncidents(false)}
              className="text-xs bg-red-800 hover:bg-red-700 px-2 py-1 rounded text-white font-medium ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Sidebar Controls & Feed */}
        <Sidebar
          categories={categories}
          onToggleCategory={handleToggleCategory}
          minMagnitude={minMagnitude}
          onMinMagnitudeChange={setMinMagnitude}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          incidents={incidents}
          filteredIncidents={filteredIncidents}
          selectedIncident={selectedIncident}
          onSelectIncident={setSelectedIncident}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          stats={stats}
        />

        {/* Interactive World Map */}
        <MapView
          incidents={filteredIncidents}
          selectedIncident={selectedIncident}
          onSelectIncident={setSelectedIncident}
        />
      </div>

      {/* Bottom Telemetry Status Bar */}
      <StatsBar
        stats={stats}
        cacheInfo={cacheInfo}
        incidentsCount={filteredIncidents.length}
      />
    </div>
  );
}
