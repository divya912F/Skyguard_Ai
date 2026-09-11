import React, { useState } from 'react';
import { Compass, Radio, MapPin, Wind, Layers, Eye } from 'lucide-react';
import { Station } from '../types';

interface StationMapProps {
  stations: Station[];
  selectedStationId: number | null;
  onSelectStation: (id: number) => void;
  stationHealthMap?: Record<number, 'Healthy' | 'Warning' | 'Critical'>;
}

export const StationMap: React.FC<StationMapProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
  stationHealthMap = {},
}) => {
  const [hoveredStation, setHoveredStation] = useState<Station | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<string>('ALL');

  // Bounding box for India to map Lat/Lon to SVG viewBox (0,0) to (500, 520)
  // Lat range: approx 8°N to 34°N
  // Lon range: approx 68°E to 96°E
  const minLat = 8.0;
  const maxLat = 34.0;
  const minLon = 68.0;
  const maxLon = 96.0;

  const projectCoord = (lat: number, lon: number) => {
    const x = ((lon - minLon) / (maxLon - minLon)) * 420 + 40;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 440 + 35;
    return { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)) };
  };

  const regions = ['ALL', 'North', 'West', 'East', 'South', 'Central', 'Himalayan', 'North-East'];

  const filteredStations = stations.filter((s) => {
    if (selectedRegion === 'ALL') return true;
    return s.region === selectedRegion;
  });

  return (
    <div id="station-geospatial-map" className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 sm:p-5 backdrop-blur-md shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <Compass className="h-4 w-4 text-cyan-400 animate-spin-slow" />
            <h2 className="text-sm font-semibold text-slate-100">National AWS Geospatial Radar</h2>
            <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[11px] font-mono text-cyan-400 border border-cyan-500/20">
              Synoptic Grid (10 Nodes)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic distribution of IMD Automated Weather Stations with live telemetry health rings
          </p>
        </div>

        {/* Region Filter Chips */}
        <div className="flex items-center space-x-1 overflow-x-auto pb-1 max-w-full text-xs bg-slate-950 p-1 rounded-xl border border-slate-800">
          {regions.map((reg) => (
            <button
              key={reg}
              id={`filter-map-region-${reg.toLowerCase()}`}
              onClick={() => setSelectedRegion(reg)}
              className={`px-2.5 py-1 rounded-lg whitespace-nowrap font-medium transition-all ${
                selectedRegion === reg
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {reg}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
        {/* SVG Map Canvas */}
        <div className="lg:col-span-2 relative rounded-xl border border-slate-800/80 bg-slate-950/80 p-3 flex items-center justify-center overflow-hidden min-h-[380px]">
          {/* Subtle radar grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-950/20 via-slate-950/40 to-slate-950 pointer-events-none" />

          {/* SVG Map Container */}
          <svg
            viewBox="0 0 500 500"
            className="w-full h-80 sm:h-96 select-none relative z-10"
          >
            {/* Range Rings for Synoptic Radar feel */}
            <circle cx="250" cy="250" r="80" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="250" cy="250" r="150" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <circle cx="250" cy="250" r="220" fill="none" stroke="#1e293b" strokeWidth="1" strokeDasharray="3 3" />
            <line x1="250" y1="20" x2="250" y2="480" stroke="#1e293b" strokeWidth="0.7" strokeDasharray="2 2" />
            <line x1="20" y1="250" x2="480" y2="250" stroke="#1e293b" strokeWidth="0.7" strokeDasharray="2 2" />

            {/* Approximate India Border Reference Outline (Stylized polygonal guide) */}
            <path
              d="M 180 65 L 210 50 L 255 70 L 270 120 L 320 140 L 390 140 L 440 180 L 430 230 L 380 230 L 340 260 L 320 320 L 280 430 L 250 480 L 220 420 L 160 310 L 130 250 L 110 200 L 130 140 Z"
              fill="none"
              stroke="#334155"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.4"
            />

            {/* Inter-station synoptic telemetry links */}
            {filteredStations.map((st1, i) => {
              const p1 = projectCoord(st1.latitude, st1.longitude);
              const nextStation = filteredStations[(i + 1) % filteredStations.length];
              const p2 = projectCoord(nextStation.latitude, nextStation.longitude);
              return (
                <line
                  key={`link-${i}`}
                  x1={p1.x}
                  y1={p1.y}
                  x2={p2.x}
                  y2={p2.y}
                  stroke="#0891b2"
                  strokeWidth="0.8"
                  strokeOpacity="0.15"
                />
              );
            })}

            {/* Station Markers */}
            {filteredStations.map((station) => {
              const { x, y } = projectCoord(station.latitude, station.longitude);
              const isSelected = selectedStationId === station.location_id;
              const isHovered = hoveredStation?.location_id === station.location_id;
              const health = stationHealthMap[station.location_id] || 'Healthy';

              let ringColor = '#10b981'; // Emerald
              if (health === 'Critical') ringColor = '#f43f5e'; // Rose
              else if (health === 'Warning') ringColor = '#f59e0b'; // Amber

              return (
                <g
                  key={station.location_id}
                  id={`map-node-${station.location_id}`}
                  className="cursor-pointer transition-transform duration-200"
                  onClick={() => onSelectStation(station.location_id)}
                  onMouseEnter={() => setHoveredStation(station)}
                  onMouseLeave={() => setHoveredStation(null)}
                >
                  {/* Ping Animation for Active Node */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 18 : 12}
                    fill={ringColor}
                    fillOpacity={isSelected ? 0.25 : 0.12}
                    className="animate-ping"
                  />

                  {/* Outer Ring */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 13 : isHovered ? 11 : 8}
                    fill="#0f172a"
                    stroke={ringColor}
                    strokeWidth={isSelected ? 2.5 : 1.5}
                  />

                  {/* Inner Node Core */}
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 5 : 3.5}
                    fill={isSelected ? '#38bdf8' : ringColor}
                  />

                  {/* Station Name & Live Temperature Tag on Map */}
                  <g transform={`translate(${x + 10}, ${y - 9})`} className="cursor-pointer">
                    <rect
                      x={0}
                      y={0}
                      width={station.current_reading ? 76 : 56}
                      height={18}
                      rx={4}
                      fill="#0b1120"
                      stroke={isSelected ? '#38bdf8' : isHovered ? '#06b6d4' : '#334155'}
                      strokeWidth={isSelected ? 1.5 : 1}
                      fillOpacity={0.92}
                    />
                    <text
                      x={5}
                      y={12}
                      fill={isSelected ? '#38bdf8' : '#e2e8f0'}
                      fontSize="9"
                      fontWeight={isSelected ? 'bold' : '500'}
                      fontFamily="sans-serif"
                    >
                      {station.short_name || station.name.split(' ')[0]}
                    </text>
                    {station.current_reading && (
                      <text
                        x={48}
                        y={12}
                        fill="#fbbf24"
                        fontSize="8.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {station.current_reading.temperature.toFixed(1)}°
                      </text>
                    )}
                  </g>
                </g>
              );
            })}
          </svg>

          {/* Quick Compass Overlay */}
          <div className="absolute top-3 right-3 text-[10px] font-mono text-slate-400 bg-slate-900/80 px-2 py-1 rounded-md border border-slate-800">
            N 8°-34° / E 68°-96°
          </div>
        </div>

        {/* Station Inspector Sidebar */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col justify-between h-full">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Node Telemetry Card</span>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                {hoveredStation ? 'PREVIEW' : 'ACTIVE FOCUS'}
              </span>
            </div>

            {(() => {
              const active = hoveredStation || stations.find((s) => s.location_id === selectedStationId) || stations[0];
              if (!active) return null;
              const health = stationHealthMap[active.location_id] || 'Healthy';

              return (
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-white">{active.short_name || active.name.split(' ')[0]}</h3>
                      <span className="text-xs font-mono text-cyan-400 font-bold">Node #{active.location_id}</span>
                    </div>
                    <p className="text-xs text-cyan-300 font-medium">{active.location_name || active.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{active.state} • {active.region || 'Central'} Zone</p>
                  </div>

                  {(active.current_reading || active.nominal_reading) && (
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-white/10 space-y-1.5 shadow-inner">
                      <div className="flex items-center justify-between text-[10px]">
                        <span className="text-emerald-400 font-semibold uppercase tracking-wider flex items-center gap-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                          Live Observation ({active.current_reading?.timestamp || 'Real-time'})
                        </span>
                        {active.current_reading?.weather_condition && (
                          <span className="text-cyan-300 font-medium">{active.current_reading.weather_condition}</span>
                        )}
                      </div>
                      <div className="flex items-center justify-between font-mono text-xs">
                        <span className="text-amber-400 font-bold">{(active.current_reading?.temperature ?? active.nominal_reading?.temperature ?? 0).toFixed(1)}°C</span>
                        <span className="text-cyan-400 font-bold">{(active.current_reading?.relative_humidity ?? active.nominal_reading?.relative_humidity ?? 0).toFixed(0)}% RH</span>
                        <span className="text-emerald-400 font-bold">{(active.current_reading?.surface_pressure ?? active.nominal_reading?.surface_pressure ?? 0).toFixed(1)} hPa</span>
                      </div>
                      {active.current_reading?.wind_speed_kmh !== undefined && (
                        <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5 border-t border-white/5">
                          <span>Wind: {active.current_reading.wind_speed_kmh} km/h</span>
                          <span className="text-slate-400 font-mono">{active.current_reading.data_source || 'PMFBY WINDS Feed'}</span>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">1-Yr Anomalies</span>
                      <span className="font-semibold text-emerald-400 font-mono">
                        {active.annual_anomalies ? `${active.annual_anomalies} / 8,760` : '350 / 8,760'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Elevation</span>
                      <span className="font-semibold text-slate-200 font-mono">{active.elevation_m} meters</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Coordinates</span>
                      <span className="font-semibold text-slate-200 font-mono text-[11px]">
                        {active.latitude.toFixed(2)}°N, {active.longitude.toFixed(2)}°E
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800">
                      <span className="text-slate-400 block text-[10px]">Fleet Health</span>
                      <span className={`font-semibold font-mono text-[11px] ${
                        health === 'Healthy' ? 'text-emerald-400' : health === 'Warning' ? 'text-amber-400' : 'text-rose-400'
                      }`}>
                        ● {health}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      id="btn-focus-station"
                      onClick={() => onSelectStation(active.location_id)}
                      className="w-full py-2 px-3 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all flex items-center justify-center space-x-2"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>Focus Telemetry & Charts for Node #{active.location_id}</span>
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Hover on node for instant metadata</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <Radio className="h-2.5 w-2.5 animate-pulse" />
              Real-time Ingestion
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
