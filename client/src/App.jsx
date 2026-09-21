import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import StatsBar from './components/StatsBar';
import { deduplicateIncidents } from './utils/deduplicate';
import { FALLBACK_INCIDENTS, FALLBACK_STATS } from './utils/fallbackData';
import { Radio, RefreshCw, AlertCircle } from 'lucide-react';

// Fallback production backend URL (e.g. Render) when VITE_API_BASE_URL is not set on Vercel
const DEFAULT_BACKEND_URL = 'https://realtime-disaster-tracker.onrender.com';

const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL && import.meta.env.VITE_API_BASE_URL.trim() !== '') {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }
  if (import.meta.env.DEV) {
    return '';
  }
  return DEFAULT_BACKEND_URL;
};

export default function App() {
  const [incidents, setIncidents] = useState([]);
  const [stats, setStats] = useState({});
  const [cacheInfo, setCacheInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const [serverStatus, setServerStatus] = useState('idle'); // 'idle' | 'fetching' | 'waking' | 'ready' | 'error'

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

  // Fetch incidents data with Render cold-start detection and non-JSON safety
  const loadIncidents = useCallback(async (isRefresh = false) => {
    if (isRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);
    setServerStatus('fetching');

    // 3-second cold start timer for free Render instances
    const coldStartTimer = setTimeout(() => {
      setServerStatus('waking');
    }, 3000);

    try {
      const apiBase = getApiBaseUrl();
      const endpoint = `${apiBase}${isRefresh ? '/api/incidents/refresh' : '/api/incidents'}`;
      const method = isRefresh ? 'POST' : 'GET';

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      const contentType = res.headers.get('content-type') || '';

      // Safeguard against Vercel SPA routing returning index.html (200 OK text/html)
      if (!contentType.includes('application/json')) {
        throw new Error(
          `Backend returned non-JSON response (${contentType || 'HTML'}). Verify VITE_API_BASE_URL.`
        );
      }

      if (!res.ok) {
        throw new Error(`API error HTTP ${res.status}: ${res.statusText || 'Server Error'}`);
      }

      const data = await res.json();
      if (data.success) {
        clearTimeout(coldStartTimer);
        setServerStatus('ready');
        const uniqueData = deduplicateIncidents(data.incidents || []);
        setIncidents(uniqueData);
        setStats(data.stats || {});
        setCacheInfo(data.cacheInfo || null);
        setIsFallbackMode(false);
        setError(null);
        if (data.cacheInfo?.ttlRemainingSeconds) {
          setTtlCountdown(data.cacheInfo.ttlRemainingSeconds);
        } else {
          setTtlCountdown(300);
        }
      } else {
        clearTimeout(coldStartTimer);
        setServerStatus('error');
        throw new Error(data.error || 'Failed to load telemetry data');
      }
    } catch (err) {
      clearTimeout(coldStartTimer);
      setServerStatus('error');
      console.warn('[AegisWatch] Failed to fetch live telemetry, using fallback:', err);
      setError(err.message || 'Unable to connect to telemetry backend');
      
      // Never render a blank screen: populate fallback data if no incidents exist yet
      setIncidents((current) => {
        if (current.length === 0) {
          setIsFallbackMode(true);
          setStats(FALLBACK_STATS);
          return FALLBACK_INCIDENTS;
        }
        return current;
      });
    } finally {
      clearTimeout(coldStartTimer);
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
    const unique = deduplicateIncidents(incidents);
    return unique.filter((incident) => {
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

  // Handle incident selection with mobile smooth scroll
  const handleSelectIncident = useCallback((incident) => {
    setSelectedIncident(incident);
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  return (
    <div className="min-h-screen md:h-screen w-full flex flex-col bg-background overflow-x-hidden md:overflow-hidden select-none">
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

      {/* Render Cold Start Loading Toast Banner */}
      {serverStatus === 'waking' && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-md pointer-events-auto">
          <div className="bg-slate-900/95 border border-cyan-500/50 text-slate-100 px-4 py-3 rounded-2xl shadow-2xl shadow-cyan-500/20 backdrop-blur-xl flex items-center gap-3 animate-pulse">
            <div className="relative flex items-center justify-center w-5 h-5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-semibold text-cyan-300">
                Waking up free backend server, please wait a moment...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Content: Map & Sidebar Stacked Vertically on Mobile (<768px), Side-by-Side on Desktop */}
      <div className="flex-1 flex flex-col md:flex-row relative min-h-0 overflow-y-auto md:overflow-hidden">
        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 z-50 bg-background/90 backdrop-blur-md flex flex-col items-center justify-center gap-4 text-center px-4">
            <div className="relative flex items-center justify-center w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-[0_0_20px_rgba(6,182,212,0.3)]">
              <Radio className="w-8 h-8 animate-ping" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Initializing Global Telemetry
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                {serverStatus === 'waking'
                  ? 'Waking up free backend server, please wait a moment...'
                  : 'Aggregating live events from USGS Earthquakes & NASA EONET...'}
              </p>
            </div>
          </div>
        )}

        {/* Error / Fallback Telemetry Banner */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 border border-amber-500/50 text-slate-100 px-4 py-2.5 rounded-2xl shadow-2xl flex items-center gap-3 backdrop-blur-md max-w-lg w-[92%] animate-pulse">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-amber-300">
                {isFallbackMode ? 'Telemetry Standby (Cached Fallback)' : 'Telemetry Connection Notice'}
              </p>
              <p className="text-[11px] text-slate-300 truncate">
                {error}
              </p>
            </div>
            <button
              onClick={() => loadIncidents(false)}
              className="text-xs bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 px-3 py-1.5 rounded-lg font-medium transition-colors ml-2 shrink-0 flex items-center gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          </div>
        )}

        {/* Interactive World Map (Top on Mobile with 52vh, Right on Desktop) */}
        <div className="w-full h-[52vh] min-h-[360px] md:h-full md:flex-1 shrink-0 relative order-1 md:order-2">
          <MapView
            incidents={filteredIncidents}
            selectedIncident={selectedIncident}
            onSelectIncident={handleSelectIncident}
          />
        </div>

        {/* Sidebar Controls & Feed (Beneath Map on Mobile, Pinned Left on Desktop) */}
        <div className="w-full md:w-96 md:h-full shrink-0 order-2 md:order-1">
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
            onSelectIncident={handleSelectIncident}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            stats={stats}
          />
        </div>
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
