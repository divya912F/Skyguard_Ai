import React, { useState } from 'react';
import { 
  HeartPulse, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ShieldCheck, 
  Wrench, 
  Mountain, 
  ArrowUpDown, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Cpu, 
  Radio 
} from 'lucide-react';
import { StationHealthSummary } from '../types';

interface SensorHealthMatrixProps {
  healthList: StationHealthSummary[];
  onSelectStation?: (id: number) => void;
}

export const SensorHealthMatrix: React.FC<SensorHealthMatrixProps> = ({
  healthList,
  onSelectStation,
}) => {
  const [sortBy, setSortBy] = useState<'health' | 'anomalies' | 'id'>('health');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [expandedStationId, setExpandedStationId] = useState<number | null>(null);

  const toggleExpand = (locId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedStationId(expandedStationId === locId ? null : locId);
  };

  const sortedList = [...healthList].sort((a, b) => {
    let diff = 0;
    if (sortBy === 'health') {
      diff = a.health_score - b.health_score;
    } else if (sortBy === 'anomalies') {
      diff = b.anomaly_rate - a.anomaly_rate;
    } else {
      diff = a.location_id - b.location_id;
    }
    return sortOrder === 'asc' ? diff : -diff;
  });

  const getStatusBadge = (status: 'Healthy' | 'Warning' | 'Critical') => {
    switch (status) {
      case 'Healthy':
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" />
            <span>Healthy</span>
          </span>
        );
      case 'Warning':
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-semibold text-amber-400 border border-amber-500/20">
            <AlertTriangle className="h-3 w-3" />
            <span>Degraded</span>
          </span>
        );
      case 'Critical':
        return (
          <span className="inline-flex items-center space-x-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
            <XCircle className="h-3 w-3" />
            <span>Fault Alert</span>
          </span>
        );
    }
  };

  const getMaintenanceRecommendation = (st: StationHealthSummary) => {
    if (st.quality_advisory?.hardware_diagnostic) {
      return st.quality_advisory.hardware_diagnostic;
    }
    if (st.stuck_sensor_events > 0) {
      return 'ADC Transducer Flatline: Inspect thermistor wiring & sensor power supply';
    }
    if (st.anomaly_rate > 5) {
      return 'Radiation Shield Alert: Clean aspirator louvers and calibrate hygrometer';
    }
    if (st.missing_rate > 2) {
      return 'Telemetry Dropout: Check GSM/GPRS antenna gain and battery backup';
    }
    return 'Nominal: Standard 6-month calibration schedule';
  };

  return (
    <div id="sensor-health-matrix-section" className="rounded-2xl border border-white/10 bg-slate-900/75 p-4 sm:p-5 backdrop-blur-md shadow-xl mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <HeartPulse className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-slate-100">Automated Station Health & Quality Advisory Matrix</h2>
            <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-mono text-emerald-400 border border-emerald-500/20 font-bold">
              1-Year Total: Exactly 3,504 Anomalies / 87,600 Readings (4.00%)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Fleet sensor index, dynamic microclimate telemetry, and real-time Quality Advisories (Good Response / Anomaly Notes).
          </p>
        </div>

        {/* Sorting controls */}
        <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-500 px-2 text-[11px]">Sort:</span>
          <button
            id="sort-by-health"
            onClick={() => {
              if (sortBy === 'health') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else { setSortBy('health'); setSortOrder('asc'); }
            }}
            className={`px-2 py-1 rounded font-medium ${
              sortBy === 'health' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Health {sortBy === 'health' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
          <button
            id="sort-by-anomalies"
            onClick={() => {
              if (sortBy === 'anomalies') setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
              else { setSortBy('anomalies'); setSortOrder('desc'); }
            }}
            className={`px-2 py-1 rounded font-medium ${
              sortBy === 'anomalies' ? 'bg-slate-800 text-cyan-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Anomalies {sortBy === 'anomalies' && (sortOrder === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-400 border-b border-slate-800">
            <tr>
              <th className="py-2.5 px-3">Station Node & Location</th>
              <th className="py-2.5 px-3">Live Telemetry</th>
              <th className="py-2.5 px-3">1-Year Anomalies / Readings</th>
              <th className="py-2.5 px-3">Anomaly Rate</th>
              <th className="py-2.5 px-3">Stuck Sensor</th>
              <th className="py-2.5 px-3">Quality Score</th>
              <th className="py-2.5 px-3">Status & Advisory</th>
              <th className="py-2.5 px-3 text-right">Inspect Advisory</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedList.map((st) => {
              const live = st.current_reading || st.nominal_reading;
              const advisory = st.quality_advisory;
              const isBad = advisory?.status === 'bad' || st.current_reading?.is_anomaly;
              const isExpanded = expandedStationId === st.location_id;

              return (
                <React.Fragment key={st.location_id}>
                  <tr
                    id={`health-row-${st.location_id}`}
                    className={`hover:bg-slate-800/40 transition-colors cursor-pointer ${
                      isExpanded ? 'bg-slate-800/30' : ''
                    }`}
                    onClick={() => onSelectStation?.(st.location_id)}
                  >
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-200 text-sm flex items-center space-x-1.5">
                        <span>{st.short_name || st.station_name.split(' ')[0]}</span>
                        <span className="text-[10px] text-slate-400 font-mono font-normal">#{st.location_id}</span>
                      </div>
                      <div className="text-[11px] text-cyan-300 truncate max-w-[200px]" title={st.location_name || st.station_name}>
                        {st.location_name || st.station_name}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-xs">
                      {live ? (
                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-1.5">
                            <span className="text-amber-400 font-bold">{live.temperature.toFixed(1)}°C</span>
                            {st.current_reading?.temperature_change !== undefined && (
                              <span className="text-[10px] text-slate-400">
                                ({st.current_reading.temperature_change >= 0 ? '+' : ''}{st.current_reading.temperature_change.toFixed(1)}°C/h)
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 block text-[10.5px]">
                            {live.relative_humidity.toFixed(0)}% RH • {live.surface_pressure.toFixed(1)} hPa
                          </span>
                        </div>
                      ) : (
                        <span>{st.avg_temperature?.toFixed(1)}°C</span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className="font-bold text-slate-200">{st.anomalies.toLocaleString()}</span>
                      <span className="text-slate-400 text-[11px]"> / {st.total_readings.toLocaleString()}</span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      <span className={st.anomaly_rate > 5 ? 'text-rose-400 font-bold' : 'text-emerald-400 font-semibold'}>
                        {st.anomaly_rate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {st.stuck_sensor_events > 0 ? (
                        <span className="text-amber-400 font-bold">{st.stuck_sensor_events} flatlines</span>
                      ) : (
                        <span className="text-slate-500">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 sm:w-20 bg-slate-800 rounded-full h-2 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              st.health_score >= 80
                                ? 'bg-emerald-500'
                                : st.health_score >= 50
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                            style={{ width: `${st.health_score}%` }}
                          />
                        </div>
                        <span className="font-mono font-bold text-slate-200">{st.health_score}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="space-y-1">
                        <div>{getStatusBadge(st.health_status)}</div>
                        <div className="text-[10px] font-mono">
                          {isBad ? (
                            <span className="text-rose-400 font-bold">
                              {advisory?.classification_label || 'Anomaly Detected'}
                            </span>
                          ) : (
                            <span className="text-emerald-400">
                              {advisory?.classification_label || 'Optimal Equilibrium'}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={(e) => toggleExpand(st.location_id, e)}
                        className={`p-1.5 rounded-lg border text-xs inline-flex items-center space-x-1 transition-all ${
                          isExpanded
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-slate-800/80 text-slate-300 border-white/10 hover:bg-slate-700'
                        }`}
                        title="Toggle Detailed Quality Advisory"
                      >
                        <span className="text-[11px] font-medium">{isExpanded ? 'Close' : 'Advisory'}</span>
                        {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                    </td>
                  </tr>

                  {/* Expandable Detailed Quality Advisory Row */}
                  {isExpanded && advisory && (
                    <tr className="bg-slate-950/70 border-b border-slate-800">
                      <td colSpan={8} className="p-4 sm:p-5">
                        <div className={`p-4 rounded-xl border space-y-3 ${
                          isBad
                            ? 'bg-rose-950/20 border-rose-500/30'
                            : 'bg-emerald-950/15 border-emerald-500/30'
                        }`}>
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                            <div className="flex items-center space-x-2">
                              {isBad ? (
                                <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                              ) : (
                                <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                              )}
                              <span className="font-bold text-white text-xs">
                                {advisory.title}
                              </span>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                                isBad
                                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                              }`}>
                                {advisory.status === 'bad' ? `Urgency: ${advisory.urgency}` : 'Quality: Nominal'}
                              </span>
                            </div>

                            <button
                              onClick={() => onSelectStation?.(st.location_id)}
                              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 underline font-mono shrink-0"
                            >
                              Open in Surveillance Dashboard →
                            </button>
                          </div>

                          {/* Descriptive Note (Good response or bad note) */}
                          <div className="space-y-1">
                            <span className="text-[10.5px] uppercase font-mono tracking-wider text-slate-400 font-bold block">
                              {isBad ? 'Anomaly Classification Diagnostic Note' : 'Good Response & Equilibrium Note'}
                            </span>
                            <p className="text-xs text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-white/5">
                              {advisory.note}
                            </p>
                          </div>

                          {/* Physics & Hardware Breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5 space-y-0.5">
                              <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold block">Atmospheric Physics Rule</span>
                              <p className="text-slate-300 leading-snug">{advisory.physics_rule}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5 space-y-0.5">
                              <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold block">Transducer Diagnostic</span>
                              <p className="text-slate-300 leading-snug">{advisory.hardware_diagnostic}</p>
                            </div>
                            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-white/5 space-y-0.5">
                              <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold block">Operational Directive</span>
                              <p className="text-slate-300 leading-snug">{advisory.action_directive}</p>
                            </div>
                          </div>

                          {/* Verification Checks */}
                          {advisory.verification_checks && advisory.verification_checks.length > 0 && (
                            <div className="pt-2 border-t border-white/10">
                              <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1.5">
                                4-Layer Verification Protocol
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                {advisory.verification_checks.map((chk, idx) => (
                                  <div
                                    key={idx}
                                    className={`p-2 rounded-lg border text-[10.5px] ${
                                      chk.passed
                                        ? 'bg-emerald-500/10 border-emerald-500/20 text-slate-200'
                                        : 'bg-rose-500/15 border-rose-500/30 text-rose-200'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between font-semibold">
                                      <span className="truncate">{chk.name}</span>
                                      <span className={chk.passed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                                        {chk.passed ? 'PASS' : 'BREACH'}
                                      </span>
                                    </div>
                                    <div className="font-mono text-[9.5px] text-slate-400 mt-0.5">{chk.metric}</div>
                                    <div className="text-[9.5px] text-slate-400 mt-0.5">{chk.detail}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
