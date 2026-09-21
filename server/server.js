import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getIncidents, invalidateCache } from './services/incidentService.js';
import { incidentCache } from './cache.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

// Dynamic CORS support for Render & Vercel
const rawOrigins = process.env.ALLOWED_ORIGINS || process.env.CLIENT_URL;
const allowedOrigins = rawOrigins
  ? rawOrigins.split(',').map((s) => s.trim())
  : '*';

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin || allowedOrigins === '*' || (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin))) {
      return callback(null, true);
    }
    // Permissive callback in case Vercel preview domains are used
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`[API] ${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cache: incidentCache.getMetadata('global_incidents_data')
  });
});

/**
 * Main incidents endpoint
 * Supports query parameters:
 *  - category: 'earthquake' | 'wildfire' | 'storm' | 'all'
 *  - minMag: number (e.g. 3.0)
 *  - search: string (filter by title/location)
 *  - refresh: boolean ('true' to bypass cache)
 */
app.get('/api/incidents', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true';
    const data = await getIncidents(forceRefresh);

    let incidents = data.incidents;

    // Optional category filtering on backend
    if (req.query.category && req.query.category !== 'all') {
      const categories = req.query.category.split(',').map(c => c.trim().toLowerCase());
      incidents = incidents.filter(i => categories.includes(i.category));
    }

    // Optional minMag filtering on backend
    if (req.query.minMag !== undefined && req.query.minMag !== '') {
      const min = parseFloat(req.query.minMag);
      if (!isNaN(min)) {
        incidents = incidents.filter(i => i.magnitude !== null && i.magnitude >= min);
      }
    }

    // Optional search text filtering
    if (req.query.search) {
      const query = req.query.search.toLowerCase().trim();
      incidents = incidents.filter(i =>
        (i.title && i.title.toLowerCase().includes(query)) ||
        (i.location && i.location.toLowerCase().includes(query))
      );
    }

    // Limit handling: default to 1500 most recent events to prevent browser map overload unless limit=all
    if (req.query.limit && req.query.limit !== 'all') {
      const limit = parseInt(req.query.limit, 10);
      if (!isNaN(limit) && limit > 0) {
        incidents = incidents.slice(0, limit);
      }
    } else if (!req.query.limit) {
      incidents = incidents.slice(0, 1500);
    }

    // Ensure incidents are strictly deduplicated by unique ID before sending JSON response
    const seenIds = new Set();
    const deduplicatedIncidents = incidents.filter((i) => {
      if (!i || !i.id || seenIds.has(i.id)) return false;
      seenIds.add(i.id);
      return true;
    });

    res.json({
      success: true,
      totalReturned: deduplicatedIncidents.length,
      stats: data.stats,
      cacheInfo: data.cacheInfo,
      incidents: deduplicatedIncidents
    });
  } catch (err) {
    console.error('[API] Error in /api/incidents:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve incident telemetry',
      details: err.message
    });
  }
});

/**
 * Quick aggregate stats endpoint
 */
app.get('/api/incidents/stats', async (req, res) => {
  try {
    const data = await getIncidents(false);
    res.json({
      success: true,
      stats: data.stats,
      cacheInfo: data.cacheInfo
    });
  } catch (err) {
    console.error('[API] Error in /api/incidents/stats:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve stats',
      details: err.message
    });
  }
});

/**
 * Explicit cache invalidation and refresh endpoint
 */
app.post('/api/incidents/refresh', async (req, res) => {
  try {
    invalidateCache();
    const data = await getIncidents(true);
    res.json({
      success: true,
      message: 'Cache invalidated and re-fetched successfully',
      stats: data.stats,
      cacheInfo: data.cacheInfo
    });
  } catch (err) {
    console.error('[API] Error refreshing incidents:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh incidents',
      details: err.message
    });
  }
});

// Start Express server
const server = app.listen(PORT, () => {
  console.log(`🚀 Incident Tracker API Server running at http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   - GET  http://localhost:${PORT}/api/incidents`);
  console.log(`   - GET  http://localhost:${PORT}/api/incidents/stats`);
  console.log(`   - POST http://localhost:${PORT}/api/incidents/refresh`);
  console.log(`   - GET  http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => console.log('HTTP server closed'));
});
