/**
 * Data Normalizer for USGS Earthquakes and NASA EONET events
 * Produces unified incident structure:
 * {
 *   id: string,
 *   title: string,
 *   category: 'earthquake' | 'wildfire' | 'storm',
 *   magnitude: number | null,
 *   magnitudeUnit: string,
 *   severity: 'low' | 'moderate' | 'high' | 'critical',
 *   coordinates: { lat: number, lng: number },
 *   timestamp: number,
 *   dateFormatted: string,
 *   source: string,
 *   url: string,
 *   location: string,
 *   details: object
 * }
 */

export function calculateSeverity(category, magnitude) {
  if (magnitude === null || magnitude === undefined || isNaN(magnitude)) {
    return 'moderate';
  }

  switch (category) {
    case 'earthquake':
      if (magnitude < 2.5) return 'low';
      if (magnitude < 4.5) return 'moderate';
      if (magnitude < 6.5) return 'high';
      return 'critical';

    case 'wildfire':
      // Magnitude typically in acres
      if (magnitude < 500) return 'low';
      if (magnitude < 5000) return 'moderate';
      if (magnitude < 25000) return 'high';
      return 'critical';

    case 'storm':
      // Magnitude typically in knots (kts)
      // < 34 kts: tropical depression, 34-63 kts: tropical storm, 64-95 kts: Cat 1-2, > 95 kts: Cat 3+
      if (magnitude < 35) return 'low';
      if (magnitude < 64) return 'moderate';
      if (magnitude < 95) return 'high';
      return 'critical';

    default:
      return 'moderate';
  }
}

/**
 * Normalizes USGS Earthquakes GeoJSON feature into standard Incident
 */
export function normalizeUSGSFeature(feature) {
  if (!feature || !feature.geometry || !feature.geometry.coordinates) {
    return null;
  }

  const [lng, lat, depth] = feature.geometry.coordinates;
  // Validate coordinates
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  const props = feature.properties || {};
  const mag = typeof props.mag === 'number' ? Math.round(props.mag * 10) / 10 : null;
  const time = props.time || Date.now();
  const title = props.title || `M ${mag ?? '?'} Earthquake - ${props.place || 'Unknown Location'}`;

  return {
    id: `usgs_${feature.id || props.code || Math.random().toString(36).slice(2, 9)}`,
    title,
    category: 'earthquake',
    magnitude: mag,
    magnitudeUnit: 'mag',
    severity: calculateSeverity('earthquake', mag),
    coordinates: {
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4))
    },
    timestamp: time,
    dateFormatted: new Date(time).toISOString(),
    source: 'USGS',
    url: props.url || `https://earthquake.usgs.gov/earthquakes/eventpage/${feature.id}`,
    location: props.place || 'Global Location',
    details: {
      depthKm: depth != null ? Math.round(depth * 10) / 10 : null,
      tsunamiWarning: Boolean(props.tsunami),
      feltReports: props.felt,
      significance: props.sig,
      status: props.status
    }
  };
}

/**
 * Normalizes NASA EONET event into standard Incident
 */
export function normalizeEONETEvent(event) {
  if (!event || !Array.isArray(event.geometry) || event.geometry.length === 0) {
    return null;
  }

  // Determine category
  let category = null;
  const categoryIds = (event.categories || []).map(c => c.id.toLowerCase());

  if (categoryIds.some(id => id.includes('wildfire'))) {
    category = 'wildfire';
  } else if (categoryIds.some(id => id.includes('storm') || id.includes('cyclone') || id.includes('hurricane') || id.includes('typhoon'))) {
    category = 'storm';
  } else {
    // Only map to earthquake, wildfire, or storm as required by specifications
    return null;
  }

  // Get the most recent geometry entry
  const geometries = event.geometry.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
  const latestGeom = geometries[geometries.length - 1];

  if (!latestGeom || !Array.isArray(latestGeom.coordinates)) {
    return null;
  }

  // Coordinates could be Point [lng, lat] or Polygon [[[lng, lat], ...]]
  let lng = null;
  let lat = null;

  if (latestGeom.type === 'Point' && latestGeom.coordinates.length >= 2) {
    lng = latestGeom.coordinates[0];
    lat = latestGeom.coordinates[1];
  } else if (Array.isArray(latestGeom.coordinates[0]) && Array.isArray(latestGeom.coordinates[0][0])) {
    // Polygon centroid approximation
    const ring = latestGeom.coordinates[0];
    const sum = ring.reduce((acc, pt) => [acc[0] + pt[0], acc[1] + pt[1]], [0, 0]);
    lng = sum[0] / ring.length;
    lat = sum[1] / ring.length;
  } else if (Array.isArray(latestGeom.coordinates[0]) && typeof latestGeom.coordinates[0][0] === 'number') {
    lng = latestGeom.coordinates[0][0];
    lat = latestGeom.coordinates[0][1];
  }

  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return null;
  }
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
    return null;
  }

  const rawMag = latestGeom.magnitudeValue;
  const mag = typeof rawMag === 'number' ? Math.round(rawMag * 10) / 10 : null;
  const unit = latestGeom.magnitudeUnit || (category === 'wildfire' ? 'acres' : category === 'storm' ? 'kts' : '');
  const time = latestGeom.date ? new Date(latestGeom.date).getTime() : Date.now();

  const sourceUrl = (event.sources && event.sources[0] && event.sources[0].url) || event.link || 'https://eonet.gsfc.nasa.gov/';

  return {
    id: `eonet_${event.id}`,
    title: event.title || `${category.toUpperCase()} Incident`,
    category,
    magnitude: mag,
    magnitudeUnit: unit,
    severity: calculateSeverity(category, mag),
    coordinates: {
      lat: Number(lat.toFixed(4)),
      lng: Number(lng.toFixed(4))
    },
    timestamp: time,
    dateFormatted: new Date(time).toISOString(),
    source: 'NASA EONET',
    url: sourceUrl,
    location: event.description || event.title,
    details: {
      observedDate: latestGeom.date,
      eonetCategories: (event.categories || []).map(c => c.title),
      historicPointsCount: event.geometry.length
    }
  };
}
