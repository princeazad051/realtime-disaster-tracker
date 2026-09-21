import { incidentCache } from '../cache.js';
import { normalizeUSGSFeature, normalizeEONETEvent } from './normalizer.js';

const USGS_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
const NASA_EONET_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events?status=open';
const CACHE_KEY = 'global_incidents_data';
const TIMEOUT_MS = 12000;

/**
 * Fetch with timeout using AbortController
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'User-Agent': 'DisasterTracker/1.0',
        'Accept': 'application/json',
        ...(options.headers || {})
      }
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

/**
 * Fetch live data from USGS
 */
async function fetchUSGS() {
  try {
    const res = await fetchWithTimeout(USGS_URL);
    if (!res.ok) throw new Error(`USGS HTTP error ${res.status}`);
    const data = await res.json();
    const features = Array.isArray(data.features) ? data.features : [];
    return features
      .map(normalizeUSGSFeature)
      .filter(Boolean);
  } catch (err) {
    console.error('[incidentService] Error fetching USGS data:', err.message);
    return [];
  }
}

/**
 * Fetch live data from NASA EONET
 */
async function fetchEONET() {
  try {
    const res = await fetchWithTimeout(NASA_EONET_URL);
    if (!res.ok) throw new Error(`NASA EONET HTTP error ${res.status}`);
    const data = await res.json();
    const events = Array.isArray(data.events) ? data.events : [];
    return events
      .map(normalizeEONETEvent)
      .filter(Boolean);
  } catch (err) {
    console.error('[incidentService] Error fetching NASA EONET data:', err.message);
    return [];
  }
}

/**
 * Main service method to get normalized incidents, backed by 5-minute in-memory cache
 */
export async function getIncidents(forceRefresh = false) {
  // Check cache first
  if (!forceRefresh) {
    const cached = incidentCache.get(CACHE_KEY);
    if (cached) {
      return {
        ...cached,
        cacheInfo: incidentCache.getMetadata(CACHE_KEY)
      };
    }
  }

  console.log(`[incidentService] ${forceRefresh ? 'Forced refresh' : 'Cache miss'}: Fetching fresh data from USGS and NASA EONET...`);

  const startTime = Date.now();
  const [earthquakes, eonetEvents] = await Promise.all([
    fetchUSGS(),
    fetchEONET()
  ]);

  const wildfires = eonetEvents.filter(e => e.category === 'wildfire');
  const storms = eonetEvents.filter(e => e.category === 'storm');

  // Combined normalized incidents sorted by timestamp desc (freshest first)
  const allIncidents = [...earthquakes, ...wildfires, ...storms].sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
  );

  const stats = {
    total: allIncidents.length,
    earthquakes: earthquakes.length,
    wildfires: wildfires.length,
    storms: storms.length,
    maxEarthquakeMag: earthquakes.reduce((max, e) => (e.magnitude && e.magnitude > max ? e.magnitude : max), 0),
    severities: {
      critical: allIncidents.filter(i => i.severity === 'critical').length,
      high: allIncidents.filter(i => i.severity === 'high').length,
      moderate: allIncidents.filter(i => i.severity === 'moderate').length,
      low: allIncidents.filter(i => i.severity === 'low').length
    },
    sources: {
      usgs: earthquakes.length,
      nasa: eonetEvents.length
    },
    fetchedAt: new Date().toISOString(),
    fetchDurationMs: Date.now() - startTime
  };

  const payload = {
    success: true,
    stats,
    incidents: allIncidents
  };

  // Cache for 5 minutes (300,000 ms)
  incidentCache.set(CACHE_KEY, payload, 5 * 60 * 1000);

  return {
    ...payload,
    cacheInfo: incidentCache.getMetadata(CACHE_KEY)
  };
}

/**
 * Invalidate cache
 */
export function invalidateCache() {
  incidentCache.delete(CACHE_KEY);
  return { success: true, message: 'Cache invalidated successfully' };
}
