import React, { useEffect, useRef, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { deduplicateIncidents } from '../utils/deduplicate';
import {
  ExternalLink,
  MapPin,
  Clock,
  Activity,
  Flame,
  Zap,
  Maximize2,
  Minimize2,
  Layers,
  Compass,
  AlertTriangle
} from 'lucide-react';

// Create custom colored DivIcon for each category
const createIncidentIcon = (category, magnitude, isSelected) => {
  let color = '#ef4444'; // Red for Earthquake
  let ringClass = 'marker-pin-quake';
  let badgeLabel = 'EQ';
  let svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="m2 12 5-5 5 10 5-10 5 5"/>
    </svg>`;

  if (category === 'wildfire') {
    color = '#f97316'; // Orange for Wildfire
    ringClass = 'marker-pin-fire';
    badgeLabel = 'WF';
    svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
      </svg>`;
  } else if (category === 'storm') {
    color = '#06b6d4'; // Blue/Cyan for Storm
    ringClass = 'marker-pin-storm';
    badgeLabel = 'ST';
    svgIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>`;
  }

  const size = isSelected ? 38 : (magnitude && magnitude >= 5.0 ? 32 : 26);
  const borderWidth = isSelected ? '3px' : '2px';

  return L.divIcon({
    className: 'custom-incident-marker',
    html: `
      <div class="relative flex items-center justify-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-125 z-50' : 'hover:scale-115'}">
        <div class="absolute inset-0 rounded-full ${ringClass} opacity-80" style="width: ${size}px; height: ${size}px; margin: auto;"></div>
        <div class="relative flex items-center justify-center rounded-full text-white shadow-xl" style="
          width: ${size}px;
          height: ${size}px;
          background: ${isSelected ? '#ffffff' : color};
          color: ${isSelected ? color : '#ffffff'};
          border: ${borderWidth} solid ${isSelected ? color : 'rgba(255,255,255,0.9)'};
          box-shadow: 0 0 16px ${color};
        ">
          ${svgIcon}
        </div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2]
  });
};

/**
 * Controller component inside MapContainer to handle flyTo / panTo
 */
function MapFlyController({ selectedIncident, resetTrigger }) {
  const map = useMap();

  useEffect(() => {
    if (selectedIncident && selectedIncident.coordinates) {
      const { lat, lng } = selectedIncident.coordinates;
      map.flyTo([lat, lng], 7, {
        animate: true,
        duration: 1.5
      });
    }
  }, [selectedIncident, map]);

  useEffect(() => {
    if (resetTrigger > 0) {
      map.flyTo([20, 0], 2.5, {
        animate: true,
        duration: 1.2
      });
    }
  }, [resetTrigger, map]);

  return null;
}

export default function MapView({
  incidents,
  selectedIncident,
  onSelectIncident,
  onOpenDetails
}) {
  const [baseMap, setBaseMap] = useState('dark'); // 'dark' | 'streets'
  const [resetTrigger, setResetTrigger] = useState(0);
  const markerRefs = useRef({});

  // When selectedIncident changes, open its popup
  useEffect(() => {
    if (selectedIncident && markerRefs.current[selectedIncident.id]) {
      markerRefs.current[selectedIncident.id].openPopup();
    }
  }, [selectedIncident]);

  // Open-source standard OpenStreetMap tiles (no API key / no watermark)
  const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Ensure each incident displays exactly once
  const uniqueIncidents = useMemo(() => {
    return deduplicateIncidents(incidents);
  }, [incidents]);

  return (
    <div className="relative flex-1 h-full w-full bg-slate-950 overflow-hidden">
      <MapContainer
        center={[20, 0]}
        zoom={2.5}
        minZoom={2}
        maxZoom={19}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom={true}
        className={`h-full w-full z-10 ${baseMap === 'dark' ? 'dark-map-tiles' : ''}`}
        worldCopyJump={false}
      >
        <TileLayer
          key={baseMap}
          url={OSM_TILE_URL}
          attribution={OSM_ATTRIBUTION}
          maxZoom={19}
          noWrap={true}
          bounds={[[-85, -180], [85, 180]]}
        />

        <MapFlyController
          selectedIncident={selectedIncident}
          resetTrigger={resetTrigger}
        />

        {uniqueIncidents.map((incident) => {
          const isSelected = selectedIncident?.id === incident.id;
          const { lat, lng } = incident.coordinates;
          const icon = createIncidentIcon(incident.category, incident.magnitude, isSelected);

          const isQuake = incident.category === 'earthquake';
          const isFire = incident.category === 'wildfire';
          const isStorm = incident.category === 'storm';

          return (
            <Marker
              key={incident.id}
              position={[lat, lng]}
              icon={icon}
              ref={(ref) => {
                if (ref) {
                  markerRefs.current[incident.id] = ref;
                }
              }}
              eventHandlers={{
                click: () => onSelectIncident(incident)
              }}
            >
              <Popup className="incident-leaflet-popup">
                <div className="w-72 sm:w-80 p-4 space-y-3 bg-surface-900 text-slate-100 rounded-xl">
                  {/* Popup Header */}
                  <div className="flex items-center justify-between gap-2 pb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          isQuake
                            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]'
                            : isFire
                            ? 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]'
                            : 'bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)]'
                        }`}
                      ></span>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                        {incident.category}
                      </span>
                    </div>

                    <span
                      className={`text-xs font-mono font-bold px-2 py-0.5 rounded border ${
                        incident.severity === 'critical'
                          ? 'bg-red-950 text-red-300 border-red-500/40'
                          : incident.severity === 'high'
                          ? 'bg-amber-950 text-amber-300 border-amber-500/40'
                          : incident.severity === 'moderate'
                          ? 'bg-sky-950 text-sky-300 border-sky-500/40'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}
                    >
                      {incident.severity.toUpperCase()}
                    </span>
                  </div>

                  {/* Title & Location */}
                  <div>
                    <h3 className="text-sm font-semibold text-white leading-snug">
                      {incident.title}
                    </h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                      <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>{incident.location}</span>
                    </p>
                  </div>

                  {/* Data Metrics Grid */}
                  <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-950/80 rounded-lg border border-slate-800 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px]">
                        {isQuake ? 'MAGNITUDE' : isFire ? 'BURN AREA' : 'WIND SPEED'}
                      </span>
                      <span className="text-slate-200 font-bold text-sm">
                        {incident.magnitude !== null
                          ? `${incident.magnitude} ${incident.magnitudeUnit || ''}`
                          : 'Not recorded'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">COORDINATES</span>
                      <span className="text-slate-200 text-xs">
                        {lat.toFixed(2)}°, {lng.toFixed(2)}°
                      </span>
                    </div>

                    {incident.details?.depthKm !== undefined && (
                      <div>
                        <span className="text-slate-500 block text-[10px]">DEPTH</span>
                        <span className="text-slate-200 text-xs">
                          {incident.details.depthKm} km
                        </span>
                      </div>
                    )}

                    <div>
                      <span className="text-slate-500 block text-[10px]">TELEMETRY SOURCE</span>
                      <span className="text-cyan-400 text-xs font-semibold">
                        {incident.source}
                      </span>
                    </div>
                  </div>

                  {/* Date/Time */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      {new Date(incident.timestamp).toUTCString().slice(5, 22)} UTC
                    </span>
                  </div>

                  {/* Action link */}
                  {incident.url && (
                    <a
                      href={incident.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-cyan-300 border border-slate-700/60 transition-colors"
                    >
                      <span>Official Telemetry Page</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Floating Map Controls & Legend */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        {/* Reset View Button */}
        <button
          onClick={() => setResetTrigger((prev) => prev + 1)}
          className="p-2.5 rounded-xl bg-surface-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 shadow-xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-medium"
          title="Reset Global View"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span className="hidden sm:inline">Reset View</span>
        </button>

        {/* Base Layer Switcher */}
        <button
          onClick={() => setBaseMap((prev) => (prev === 'dark' ? 'streets' : 'dark'))}
          className="p-2.5 rounded-xl bg-surface-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/60 shadow-xl backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 text-xs font-medium"
          title="Toggle Map Style"
        >
          <Layers className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">{baseMap === 'dark' ? 'Dark View' : 'Standard View'}</span>
        </button>
      </div>

      {/* Interactive Legend (Bottom Right) */}
      <div className="absolute bottom-6 right-4 z-20 bg-surface-900/90 backdrop-blur-md border border-slate-800 p-3 rounded-xl shadow-2xl text-xs space-y-2 select-none pointer-events-auto">
        <div className="font-semibold text-slate-300 uppercase tracking-wider text-[11px] pb-1 text-slate-400">
          Incident Markers
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.9)]"></span>
            <span className="text-slate-300">Earthquakes</span>
            <span className="text-slate-500 font-mono text-[10px] ml-auto">USGS</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.9)]"></span>
            <span className="text-slate-300">Wildfires</span>
            <span className="text-slate-500 font-mono text-[10px] ml-auto">NASA</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.9)]"></span>
            <span className="text-slate-300">Storms</span>
            <span className="text-slate-500 font-mono text-[10px] ml-auto">NASA</span>
          </div>
        </div>
      </div>
    </div>
  );
}
