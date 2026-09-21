/**
 * Fallback telemetry dataset used when the remote backend is waking up,
 * offline, or if VITE_API_BASE_URL is not configured during initial setup.
 * Ensures the dashboard always renders an interactive, complete UI.
 */
export const FALLBACK_INCIDENTS = [
  {
    id: "usgs_ak024d9e1",
    source: "USGS",
    title: "M 5.8 - 42 km SSW of Nikolski, Alaska",
    category: "earthquake",
    magnitude: 5.8,
    magnitudeUnit: "mag",
    severity: "high",
    coordinates: {
      lat: 52.612,
      lng: -169.115
    },
    timestamp: Date.now() - 1000 * 60 * 35,
    dateFormatted: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    location: "42 km SSW of Nikolski, Alaska",
    url: "https://earthquake.usgs.gov/earthquakes/eventpage/ak024d9e1",
    details: {
      depthKm: 28.4,
      status: "reviewed"
    }
  },
  {
    id: "usgs_ci4019284",
    source: "USGS",
    title: "M 3.6 - 12 km ENE of Ridgecrest, California",
    category: "earthquake",
    magnitude: 3.6,
    magnitudeUnit: "mag",
    severity: "moderate",
    coordinates: {
      lat: 35.663,
      lng: -117.548
    },
    timestamp: Date.now() - 1000 * 60 * 75,
    dateFormatted: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    location: "12 km ENE of Ridgecrest, California",
    url: "https://earthquake.usgs.gov/earthquakes/eventpage/ci4019284",
    details: {
      depthKm: 6.2,
      status: "reviewed"
    }
  },
  {
    id: "usgs_nn0086712",
    source: "USGS",
    title: "M 2.4 - 28 km SE of Mina, Nevada",
    category: "earthquake",
    magnitude: 2.4,
    magnitudeUnit: "mag",
    severity: "low",
    coordinates: {
      lat: 38.188,
      lng: -117.892
    },
    timestamp: Date.now() - 1000 * 60 * 110,
    dateFormatted: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    location: "28 km SE of Mina, Nevada",
    url: "https://earthquake.usgs.gov/earthquakes/eventpage/nn0086712",
    details: {
      depthKm: 9.8,
      status: "reviewed"
    }
  },
  {
    id: "nasa_eonet_wildfire_6214",
    source: "NASA EONET",
    title: "Bridge Fire Complex - San Gabriel Mountains, CA",
    category: "wildfire",
    magnitude: 54800,
    magnitudeUnit: "acres",
    severity: "critical",
    coordinates: {
      lat: 34.281,
      lng: -117.724
    },
    timestamp: Date.now() - 1000 * 60 * 140,
    dateFormatted: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    location: "San Gabriel Mountains, California",
    url: "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6214",
    details: {
      categoryName: "Wildfires",
      status: "open"
    }
  },
  {
    id: "nasa_eonet_wildfire_6198",
    source: "NASA EONET",
    title: "Line Fire - San Bernardino National Forest",
    category: "wildfire",
    magnitude: 39200,
    magnitudeUnit: "acres",
    severity: "high",
    coordinates: {
      lat: 34.172,
      lng: -117.113
    },
    timestamp: Date.now() - 1000 * 60 * 200,
    dateFormatted: new Date(Date.now() - 1000 * 60 * 200).toISOString(),
    location: "Highland / San Bernardino County, CA",
    url: "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_6198",
    details: {
      categoryName: "Wildfires",
      status: "open"
    }
  },
  {
    id: "nasa_eonet_storm_5921",
    source: "NASA EONET",
    title: "Tropical Cyclone Bebinca - Northwest Pacific",
    category: "storm",
    magnitude: 70,
    magnitudeUnit: "kts",
    severity: "high",
    coordinates: {
      lat: 28.4,
      lng: 125.6
    },
    timestamp: Date.now() - 1000 * 60 * 60,
    dateFormatted: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    location: "East China Sea / Northwest Pacific Basin",
    url: "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_5921",
    details: {
      categoryName: "Severe Storms",
      status: "open"
    }
  },
  {
    id: "nasa_eonet_storm_5930",
    source: "NASA EONET",
    title: "Hurricane Francine - Gulf of Mexico",
    category: "storm",
    magnitude: 85,
    magnitudeUnit: "kts",
    severity: "high",
    coordinates: {
      lat: 27.9,
      lng: -91.8
    },
    timestamp: Date.now() - 1000 * 60 * 180,
    dateFormatted: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    location: "Gulf Coast / Southern Louisiana",
    url: "https://eonet.gsfc.nasa.gov/api/v3/events/EONET_5930",
    details: {
      categoryName: "Severe Storms",
      status: "open"
    }
  }
];

export const FALLBACK_STATS = {
  total: 7,
  earthquakes: 3,
  wildfires: 2,
  storms: 2,
  criticalCount: 1,
  highCount: 3,
  maxMagnitude: {
    earthquake: 5.8,
    wildfire: 54800,
    storm: 85
  }
};
