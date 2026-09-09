import React, { useState, useEffect } from 'react';
import { Columns3, ArrowRightLeft, ShieldCheck, Thermometer, Droplets, Gauge, Mountain, Activity } from 'lucide-react';
import { Station, WeatherRecord } from '../types';

interface StationComparisonProps {
  stations: Station[];
}

interface ComparedStationData extends Station {
  latest: WeatherRecord;
  health_score: number;
  anomaly_rate: number;
}

export const StationComparison: React.FC<StationComparisonProps> = ({ stations }) => {
  const [selectedIds, setSelectedIds] = useState<number[]>([0, 1, 8]); // Default: Delhi (Plain), Mumbai (Coastal), Dehradun (Foothill)
  const [comparisonData, setComparisonData] = useState<ComparedStationData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchComparison = (ids: number[]) => {
    setIsLoading(true);
    fetch(`/api/compare?stations=${ids.join(',')}`)
      .then((r) => r.json())
      .then((data) => {
        setComparisonData(data.stations || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to compare stations:', err);
        setIsLoading(false);
      });
  };

  useEffect(() => {
    fetchComparison(selectedIds);
  }, [selectedIds]);

  const toggleStation = (id: number) => {
    if (selectedIds.includes(id)) {
      if (selectedIds.length > 1) {
        setSelectedIds(selectedIds.filter((i) => i !== id));
      }
    } else {
      if (selectedIds.length < 3) {
        setSelectedIds([...selectedIds, id]);
      } else {
        // Replace last
        setSelectedIds([selectedIds[0], selectedIds[1], id]);
      }
    }
  };

  return (
    <div id="station-comparison-section" className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 sm:p-5 backdrop-blur-md shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <Columns3 className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">Synoptic Multi-Station Telemetry Comparison</h2>
            <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[11px] font-mono text-cyan-400 border border-cyan-500/20">
              Cross-Regional Comparison
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Select up to 3 meteorological stations to analyze regional atmospheric differences, barometric lapse, and sensor drift.
          </p>
        </div>

        {/* Station Selector Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 max-w-full text-xs">
          {stations.map((st) => {
            const isSelected = selectedIds.includes(st.location_id);
            return (
              <button
                key={st.location_id}
                id={`btn-toggle-compare-${st.location_id}`}
                onClick={() => toggleStation(st.location_id)}
                className={`px-2.5 py-1 rounded-lg font-medium whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm shadow-cyan-500/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                #{st.location_id} {st.name.split(' ')[0]}
              </button>
            );
          })}
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
          Loading synoptic comparison records...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {comparisonData.map((st) => {
            const latest = st.latest || {
              temperature: 25,
              relative_humidity: 60,
              surface_pressure: 1005,
              dew_point: 16.5,
              heat_index: 25.2,
              vapor_pressure_deficit: 1.1,
              barometric_trend: 'Steady',
              pressure_tendency_3h: 0
            };

            return (
              <div
                key={st.location_id}
                id={`compare-card-${st.location_id}`}
                className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 flex flex-col justify-between"
              >
                <div>
                  {/* Station Header */}
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800">
                    <div>
                      <h3 className="text-sm font-bold text-white">{st.name}</h3>
                      <p className="text-[11px] text-slate-400">{st.state} • {st.region || 'Central'} Zone</p>
                    </div>
                    <span className="rounded-full bg-slate-800 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
                      ID #{st.location_id}
                    </span>
                  </div>

                  {/* Geographic & Elevation badge */}
                  <div className="flex items-center justify-between text-xs mb-3 bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Mountain className="h-3.5 w-3.5 text-amber-400" />
                      Elevation: <strong className="text-slate-200">{st.elevation_m}m</strong>
                    </span>
                    <span className="font-mono text-[11px] text-slate-400">
                      {st.latitude.toFixed(1)}°N, {st.longitude.toFixed(1)}°E
                    </span>
                  </div>

                  {/* Primary Metrics Grid */}
                  <div className="space-y-2 text-xs">
                    {/* Temperature */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                        Temperature
                      </span>
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-white">{latest.temperature.toFixed(1)}°C</span>
                        <span className="block text-[10px] text-slate-400">Dew Pt: {latest.dew_point?.toFixed(1)}°C</span>
                      </div>
                    </div>

                    {/* Relative Humidity */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                        Humidity
                      </span>
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-white">{latest.relative_humidity.toFixed(1)}%</span>
                        <span className="block text-[10px] text-slate-400">VPD: {latest.vapor_pressure_deficit?.toFixed(2)} kPa</span>
                      </div>
                    </div>

                    {/* Surface Pressure */}
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Gauge className="h-3.5 w-3.5 text-indigo-400" />
                        Surface Pressure
                      </span>
                      <div className="text-right font-mono">
                        <span className="text-sm font-bold text-white">{latest.surface_pressure.toFixed(1)} hPa</span>
                        <span className="block text-[10px] text-slate-400">
                          3h: {(latest.pressure_tendency_3h ?? 0) >= 0 ? `+${latest.pressure_tendency_3h ?? 0}` : (latest.pressure_tendency_3h ?? 0)} ({latest.barometric_trend || 'Steady'})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Health Score */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-slate-400">Health Index:</span>
                    <strong className="font-mono text-emerald-300">{st.health_score}/100</strong>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    Anomaly: {st.anomaly_rate}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
