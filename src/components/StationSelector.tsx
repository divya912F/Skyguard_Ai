import React from 'react';
import { MapPin, Navigation, Radio, Globe, ShieldCheck, Sparkles, Thermometer, Droplets, Gauge } from 'lucide-react';
import { Station } from '../types';

interface StationSelectorProps {
  stations: Station[];
  selectedStationId: number | null;
  onSelectStation: (id: number | null) => void;
}

export const StationSelector: React.FC<StationSelectorProps> = ({
  stations,
  selectedStationId,
  onSelectStation,
}) => {
  return (
    <div id="station-selector-section" className="mb-6 rounded-2xl border border-white/10 bg-slate-900/75 p-4 sm:p-5 backdrop-blur-md shadow-xl transition-all">
      {/* Header & Quality Benchmark Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div className="flex items-start sm:items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mt-0.5 sm:mt-0">
            <MapPin className="h-4 w-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">National IMD Meteorological AWS Network</h2>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                1-Year QA: 3,504 Anomalies / 87,600 Readings (4.00%)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              10 Regional Automated Weather Stations configured with site-specific observatory locations and calibrated ground-truth telemetry.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            id="station-filter-all"
            onClick={() => onSelectStation(null)}
            className={`flex items-center space-x-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all ${
              selectedStationId === null
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30 ring-1 ring-cyan-400'
                : 'border border-white/10 bg-slate-800/80 text-slate-300 hover:bg-slate-700/80'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>All Stations (Fleet Aggregate)</span>
          </button>
        </div>
      </div>

      {/* Grid of 10 stations with location-based names and real-time readings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {stations.map((station) => {
          const isSelected = selectedStationId === station.location_id;
          const reading = station.current_reading || station.nominal_reading;
          const advisory = station.quality_advisory;
          const isBad = advisory?.status === 'bad' || station.current_reading?.is_anomaly;

          return (
            <button
              key={station.location_id}
              id={`station-card-${station.location_id}`}
              onClick={() => onSelectStation(station.location_id)}
              className={`group relative flex flex-col p-3 text-left rounded-xl border transition-all text-xs ${
                isSelected
                  ? 'border-cyan-400 bg-cyan-950/60 text-white shadow-lg shadow-cyan-950/50 ring-1 ring-cyan-400'
                  : isBad
                  ? 'border-rose-500/40 bg-slate-950/85 hover:border-rose-500/70 hover:bg-rose-950/20'
                  : 'border-white/10 bg-slate-950/70 text-slate-300 hover:border-white/20 hover:bg-slate-900/90'
              }`}
            >
              {/* Station Number & City */}
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-bold text-slate-100 group-hover:text-cyan-300 text-sm">
                  {station.short_name || station.name.split(' ')[0]}
                </span>
                <span className={`inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-mono font-bold ${
                  isSelected ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40' : 'bg-slate-800 text-slate-300 border border-slate-700'
                }`}>
                  Station #{station.location_id}
                </span>
              </div>

              {/* Exact Location Name */}
              <p className="text-[11px] text-slate-400 truncate mb-1.5 font-medium" title={station.location_name || station.name}>
                {station.location_name || station.name}
              </p>

              {/* Status Note Pill (Good Response or Bad Note Badge) */}
              <div className="mb-2">
                {isBad ? (
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 w-full justify-between truncate" title={advisory?.note || 'Anomaly detected'}>
                    <span className="truncate">{advisory?.classification_label || 'Anomaly Detected'}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                  </span>
                ) : (
                  <span className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 w-full justify-between" title={advisory?.note || 'All primary AWS transducers operating in complete equilibrium.'}>
                    <span className="truncate">{advisory?.classification_label || 'Optimal Equilibrium'}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />
                  </span>
                )}
              </div>

              {/* Live Distinct Telemetry Readings */}
              {reading && (
                <div className="mb-2 p-1.5 rounded-lg bg-slate-900/90 border border-white/5 space-y-1">
                  <div className="flex items-center justify-between font-mono text-[11px]">
                    <span className="text-amber-400 font-semibold">{reading.temperature.toFixed(1)}°C</span>
                    <span className="text-cyan-400 font-semibold">{reading.relative_humidity.toFixed(0)}%</span>
                    <span className="text-emerald-400 font-semibold">{reading.surface_pressure.toFixed(1)} hPa</span>
                  </div>
                  {station.current_reading?.temperature_change !== undefined && (
                    <div className="flex items-center justify-between text-[9.5px] font-mono text-slate-400 border-t border-white/5 pt-0.5">
                      <span>1h ΔT: {station.current_reading.temperature_change >= 0 ? '+' : ''}{station.current_reading.temperature_change.toFixed(1)}°C</span>
                      <span className="text-slate-400">{station.current_reading.barometric_trend || 'Steady'}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Annual Anomaly Stats */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 mt-auto pt-1.5 border-t border-white/5">
                <span className="text-slate-400 font-mono">
                  {station.annual_anomalies ? `${station.annual_anomalies} anomalies/yr` : `${station.elevation_m}m elv`}
                </span>
                <span className="flex items-center gap-1 text-emerald-400 font-semibold font-mono">
                  <Radio className="h-2.5 w-2.5 animate-pulse" />
                  Live Sync
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
