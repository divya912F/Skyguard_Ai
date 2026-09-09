import React, { useState, useEffect } from 'react';
import { SunMedium, Calendar, Sparkles, BarChart2, ShieldAlert, Thermometer, Droplets, Info } from 'lucide-react';
import { DiurnalHourStats, MonthlyStats, Station } from '../types';

interface DiurnalAnalyticsProps {
  selectedStationId: number | null;
  stations: Station[];
}

export const DiurnalAnalytics: React.FC<DiurnalAnalyticsProps> = ({
  selectedStationId,
  stations,
}) => {
  const [diurnalData, setDiurnalData] = useState<DiurnalHourStats[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyStats[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<'diurnal' | 'seasonal'>('diurnal');

  const locId = selectedStationId ?? 0;
  const currentStation = stations.find((s) => s.location_id === locId) || stations[0];

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);

    Promise.all([
      fetch(`/api/diurnal?location_id=${locId}`).then((r) => r.json()),
      fetch(`/api/seasonal?location_id=${locId}`).then((r) => r.json()),
    ])
      .then(([dJson, sJson]) => {
        if (isMounted) {
          setDiurnalData(dJson.diurnal || []);
          setMonthlyData(sJson.monthly || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        console.error('Failed to load diurnal/seasonal data:', err);
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [locId]);

  // Max values for scaling
  const maxTemp = diurnalData.length > 0 ? Math.max(...diurnalData.map((d) => d.max_temp)) : 40;
  const minTemp = diurnalData.length > 0 ? Math.min(...diurnalData.map((d) => d.min_temp)) : 10;
  const tempSpan = maxTemp - minTemp || 1;

  const maxAnomalies = diurnalData.length > 0 ? Math.max(...diurnalData.map((d) => d.anomaly_count), 1) : 1;

  return (
    <div id="diurnal-analytics-section" className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 sm:p-5 backdrop-blur-md shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
        <div>
          <div className="flex items-center space-x-2">
            <SunMedium className="h-4 w-4 text-amber-400" />
            <h2 className="text-sm font-semibold text-slate-100">Diurnal Cycle & Climatological Diagnostics</h2>
            <span className="rounded bg-amber-500/10 px-2 py-0.5 text-[11px] font-mono text-amber-400 border border-amber-500/20">
              {currentStation?.name || 'Selected Station'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Hourly 24-hour meteorological solar wave vs seasonal sensor breakdown across 8,760 annual records
          </p>
        </div>

        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            id="btn-view-diurnal-24h"
            onClick={() => setActiveView('diurnal')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeView === 'diurnal'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            24h Diurnal Wave
          </button>
          <button
            id="btn-view-seasonal-matrix"
            onClick={() => setActiveView('seasonal')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              activeView === 'seasonal'
                ? 'bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            12-Month Seasonal Matrix
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-64 flex items-center justify-center text-slate-400 text-xs">
          Loading climatological records...
        </div>
      ) : activeView === 'diurnal' ? (
        <div className="space-y-4">
          {/* Diurnal Temperature Curve Chart (SVG) */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">24-Hour Solar Radiation Wave & Thermal Expansion Profile</span>
              <span className="text-[10px] font-mono text-slate-400">Peak Thermal Load: 13:00 - 15:00 IST</span>
            </div>

            <svg viewBox="0 0 800 180" className="w-full h-44 select-none">
              {/* Horizontal Grid */}
              {[0, 0.5, 1].map((r) => {
                const y = 150 - r * 120;
                const val = minTemp + r * tempSpan;
                return (
                  <g key={r}>
                    <line x1="40" y1={y} x2="780" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                    <text x="32" y={y + 3} textAnchor="end" fill="#64748b" fontSize="9" fontFamily="monospace">
                      {val.toFixed(0)}°C
                    </text>
                  </g>
                );
              })}

              {/* Hour Guides & Temperature Curve */}
              {diurnalData.map((d, i) => {
                const x = 50 + (i / 23) * 720;
                const y = 150 - ((d.avg_temp - minTemp) / tempSpan) * 120;
                const yMax = 150 - ((d.max_temp - minTemp) / tempSpan) * 120;
                const yMin = 150 - ((d.min_temp - minTemp) / tempSpan) * 120;

                return (
                  <g key={d.hour}>
                    {/* Diurnal Range Vertical Bar */}
                    <line x1={x} y1={yMin} x2={x} y2={yMax} stroke="#334155" strokeWidth="2" strokeLinecap="round" />
                    {/* Hour tick text */}
                    {i % 3 === 0 && (
                      <text x={x} y="170" textAnchor="middle" fill="#64748b" fontSize="9" fontFamily="monospace">
                        {String(d.hour).padStart(2, '0')}:00
                      </text>
                    )}
                  </g>
                );
              })}

              {/* Polyline through hourly averages */}
              <polyline
                fill="none"
                stroke="#f59e0b"
                strokeWidth="2.5"
                points={diurnalData
                  .map((d, i) => `${50 + (i / 23) * 720},${(150 - ((d.avg_temp - minTemp) / tempSpan) * 120).toFixed(1)}`)
                  .join(' ')}
              />

              {/* Nodes */}
              {diurnalData.map((d, i) => {
                const x = 50 + (i / 23) * 720;
                const y = 150 - ((d.avg_temp - minTemp) / tempSpan) * 120;
                return (
                  <circle
                    key={`node-${i}`}
                    cx={x}
                    cy={y}
                    r="3"
                    fill="#f59e0b"
                    stroke="#0f172a"
                    strokeWidth="1.5"
                  />
                );
              })}
            </svg>
          </div>

          {/* Diurnal Anomaly Frequency Distribution Bar Chart */}
          <div className="rounded-xl border border-slate-800/80 bg-slate-950/80 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300">Hourly Anomaly Frequency Distribution (Sensor Vulnerability Times)</span>
              <span className="text-[10px] font-mono text-rose-400">Total Anomaly Incidents by Hour</span>
            </div>

            <div className="grid grid-cols-24 gap-1 h-20 items-end pt-2 px-2">
              {diurnalData.map((d) => {
                const heightPct = Math.max(8, (d.anomaly_count / maxAnomalies) * 100);
                const isHigh = d.anomaly_count > maxAnomalies * 0.6;
                return (
                  <div
                    key={d.hour}
                    className="flex flex-col items-center group relative cursor-pointer"
                    title={`Hour ${d.hour}:00 - ${d.anomaly_count} Anomalies Detected`}
                  >
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t transition-all ${
                        isHigh ? 'bg-rose-500 group-hover:bg-rose-400' : 'bg-amber-500/60 group-hover:bg-amber-400'
                      }`}
                    />
                    <span className="text-[8px] font-mono text-slate-400 mt-1">
                      {d.hour % 4 === 0 ? d.hour : ''}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meteorological Analysis Footnote */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-3 text-xs text-slate-300 flex items-start space-x-2">
            <Info className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px] text-slate-300">
              <strong className="text-amber-300">Climatological Insight:</strong> Notice the sharp rise in thermal anomaly flags around mid-afternoon (13:00 - 16:00 IST). In Automated Weather Stations, radiant solar heating induces rapid sensor housing expansion, producing sharp transient jumps if radiation shields are dusty or degraded. The model correctly weights diurnal baseline deviation to prevent false alarms during normal afternoon solar heating.
            </p>
          </div>
        </div>
      ) : (
        /* Seasonal 12-Month Climate Matrix */
        <div className="space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Month</th>
                  <th className="py-2.5 px-3">Season</th>
                  <th className="py-2.5 px-3">Avg Temp</th>
                  <th className="py-2.5 px-3">Avg Humidity</th>
                  <th className="py-2.5 px-3">Avg Pressure</th>
                  <th className="py-2.5 px-3">Sensor Anomalies</th>
                  <th className="py-2.5 px-3">Stuck Sensor Events</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {monthlyData.map((m) => {
                  let seasonName = 'Monsoon';
                  let seasonColor = 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30';
                  if (m.month === 12 || m.month <= 2) {
                    seasonName = 'Winter';
                    seasonColor = 'bg-blue-500/10 text-blue-300 border-blue-500/30';
                  } else if (m.month >= 3 && m.month <= 5) {
                    seasonName = 'Pre-Monsoon / Summer';
                    seasonColor = 'bg-amber-500/10 text-amber-300 border-amber-500/30';
                  } else if (m.month >= 6 && m.month <= 9) {
                    seasonName = 'Southwest Monsoon';
                    seasonColor = 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30';
                  } else {
                    seasonName = 'Post-Monsoon';
                    seasonColor = 'bg-purple-500/10 text-purple-300 border-purple-500/30';
                  }

                  return (
                    <tr key={m.month} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-200">{m.month_name}</td>
                      <td className="py-2.5 px-3">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${seasonColor}`}>
                          {seasonName}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">{m.avg_temp}°C</td>
                      <td className="py-2.5 px-3 font-mono">{m.avg_humidity}%</td>
                      <td className="py-2.5 px-3 font-mono">{m.avg_pressure} hPa</td>
                      <td className="py-2.5 px-3 font-mono">
                        <span className={m.anomaly_count > 10 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                          {m.anomaly_count}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 font-mono">
                        {m.stuck_sensor_count > 0 ? (
                          <span className="text-amber-400 font-semibold">{m.stuck_sensor_count}</span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
