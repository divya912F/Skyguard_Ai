import React, { useState } from 'react';
import { LineChart, Zap, Download, Layers, Crosshair, Sparkles } from 'lucide-react';
import { WeatherRecord } from '../types';

interface TelemetryChartProps {
  records: WeatherRecord[];
  stationName: string;
  selectedStationId?: number | null;
  period: '24h' | '7d' | '30d' | 'all';
  onPeriodChange: (period: '24h' | '7d' | '30d' | 'all') => void;
}

type MetricKey = 'temperature' | 'relative_humidity' | 'surface_pressure' | 'dew_point' | 'temperature_deviation';

export const TelemetryChart: React.FC<TelemetryChartProps> = ({
  records,
  stationName,
  selectedStationId,
  period,
  onPeriodChange,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('temperature');
  const [showBaseline, setShowBaseline] = useState<boolean>(true);
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; record: WeatherRecord; val: number } | null>(null);

  const metricConfig = {
    temperature: {
      label: 'Temperature',
      unit: '°C',
      color: '#f59e0b', // amber
      bgTag: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      minScale: 5,
      maxScale: 45,
      baselineKey: 'temperature_rolling_mean'
    },
    relative_humidity: {
      label: 'Relative Humidity',
      unit: '%',
      color: '#06b6d4', // cyan
      bgTag: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
      minScale: 10,
      maxScale: 100,
      baselineKey: 'humidity_rolling_mean'
    },
    surface_pressure: {
      label: 'Surface Pressure',
      unit: 'hPa',
      color: '#818cf8', // indigo
      bgTag: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
      minScale: 970,
      maxScale: 1020,
      baselineKey: 'pressure_rolling_mean'
    },
    dew_point: {
      label: 'Dew Point',
      unit: '°C',
      color: '#14b8a6', // teal
      bgTag: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
      minScale: 0,
      maxScale: 35,
      baselineKey: 'temperature_rolling_mean'
    },
    temperature_deviation: {
      label: 'Diurnal Deviation',
      unit: 'Δ°C',
      color: '#ec4899', // pink
      bgTag: 'bg-pink-500/20 text-pink-300 border-pink-500/40',
      minScale: -10,
      maxScale: 15,
      baselineKey: undefined
    }
  };

  const currentCfg = metricConfig[selectedMetric];

  // Canvas Geometry
  const width = 850;
  const height = 230;
  const padding = { top: 20, right: 30, bottom: 32, left: 55 };

  const values = records.map((r) => {
    const val = r[selectedMetric as keyof WeatherRecord];
    return typeof val === 'number' ? val : 0;
  });

  const minVal = values.length > 0 ? Math.min(...values, currentCfg.minScale) : currentCfg.minScale;
  const maxVal = values.length > 0 ? Math.max(...values, currentCfg.maxScale) : currentCfg.maxScale;
  const valRange = maxVal - minVal || 1;

  const points = records.map((r, i) => {
    const x = padding.left + (i / Math.max(records.length - 1, 1)) * (width - padding.left - padding.right);
    const rawVal = r[selectedMetric as keyof WeatherRecord];
    const val = typeof rawVal === 'number' ? rawVal : 0;
    const y = height - padding.bottom - ((val - minVal) / valRange) * (height - padding.top - padding.bottom);
    return { x, y, record: r, val };
  });

  // Baseline curve points
  const baselineKey = currentCfg.baselineKey as keyof WeatherRecord | undefined;
  const baselinePoints = baselineKey && showBaseline
    ? records.map((r, i) => {
        const x = padding.left + (i / Math.max(records.length - 1, 1)) * (width - padding.left - padding.right);
        const bVal = Number(r[baselineKey] || r.temperature || 0);
        const y = height - padding.bottom - ((bVal - minVal) / valRange) * (height - padding.top - padding.bottom);
        return { x, y };
      })
    : [];

  const pathD = points.length > 0
    ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '')
    : '';

  const baselineD = baselinePoints.length > 0
    ? baselinePoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x.toFixed(1)} ${(height - padding.bottom).toFixed(1)} L ${points[0].x.toFixed(1)} ${(height - padding.bottom).toFixed(1)} Z`
    : '';

  const handleExportCsv = () => {
    const url = selectedStationId !== null && selectedStationId !== undefined
      ? `/api/export-csv?location_id=${selectedStationId}`
      : '/api/export-csv';
    window.location.href = url;
  };

  return (
    <div id="telemetry-chart-container" className="mb-6 rounded-2xl border border-white/10 bg-slate-900/75 p-4 sm:p-5 backdrop-blur-md shadow-xl">
      {/* Header controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center space-x-2">
            <LineChart className="h-4 w-4 text-cyan-400" />
            <h2 className="text-sm font-semibold text-slate-100">Telemetry Inlier Curve & Anomaly Detection</h2>
            <span className="text-xs text-slate-400">({stationName})</span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {records.length} chronological sensor packets plotted against regional diurnal expectation
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Horizon Filter */}
          <div className="flex items-center space-x-1 bg-slate-950/80 p-1 rounded-xl border border-white/10 text-xs">
            {(['24h', '7d', '30d', 'all'] as const).map((p) => (
              <button
                key={p}
                id={`btn-period-${p}`}
                onClick={() => onPeriodChange(p)}
                className={`px-2.5 py-1 rounded-lg font-mono font-medium transition-all ${
                  period === p
                    ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Baseline Toggle */}
          {currentCfg.baselineKey && (
            <button
              id="btn-toggle-baseline"
              onClick={() => setShowBaseline(!showBaseline)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                showBaseline
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-slate-950 border-slate-800 text-slate-500'
              }`}
              title="Toggle 24h Diurnal Rolling Baseline"
            >
              <Layers className="h-3 w-3" />
              <span className="hidden sm:inline">24h Baseline</span>
            </button>
          )}

          {/* CSV Export Button */}
          <button
            id="btn-export-station-csv"
            onClick={handleExportCsv}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-semibold text-slate-200 transition-all"
            title="Download CSV Telemetry Dataset"
          >
            <Download className="h-3 w-3 text-cyan-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Metric Selector Bar */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 mb-3 text-xs">
        {(['temperature', 'relative_humidity', 'surface_pressure', 'dew_point', 'temperature_deviation'] as MetricKey[]).map((key) => {
          const cfg = metricConfig[key];
          const isSelected = selectedMetric === key;
          return (
            <button
              key={key}
              id={`btn-chart-metric-${key}`}
              onClick={() => setSelectedMetric(key)}
              className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all border ${
                isSelected
                  ? `${cfg.bgTag} font-semibold shadow-sm`
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {cfg.label} ({cfg.unit})
            </button>
          );
        })}
      </div>

      {/* SVG Canvas Area */}
      <div className="relative w-full overflow-hidden rounded-xl bg-slate-950/80 border border-slate-800/80 p-2">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-52 sm:h-60 select-none"
          preserveAspectRatio="none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Horizontal Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
            const gridVal = minVal + ratio * valRange;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#1e293b"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize="10"
                  fontFamily="monospace"
                >
                  {gridVal.toFixed(selectedMetric === 'temperature_deviation' ? 1 : 0)}
                </text>
              </g>
            );
          })}

          {/* Shaded Area */}
          {areaD && (
            <path
              d={areaD}
              fill={currentCfg.color}
              fillOpacity="0.07"
            />
          )}

          {/* Baseline Curve (Dashed) */}
          {baselineD && (
            <path
              d={baselineD}
              fill="none"
              stroke="#64748b"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              strokeOpacity="0.7"
            />
          )}

          {/* Primary Trend Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={currentCfg.color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Points & Interactive Hover Circles */}
          {points.map((pt, i) => {
            const isAnomaly = pt.record.is_anomaly || (pt.record.anomaly_type && pt.record.anomaly_type !== 'normal');
            return (
              <g
                key={i}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredPoint(pt)}
              >
                {isAnomaly ? (
                  <g>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="7"
                      fill="#f43f5e"
                      fillOpacity="0.25"
                      className="animate-ping"
                    />
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill="#f43f5e"
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  </g>
                ) : (
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={records.length > 80 ? 1.5 : 2.5}
                    fill={currentCfg.color}
                    fillOpacity="0.8"
                  />
                )}
              </g>
            );
          })}

          {/* Crosshair indicator when hovered */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={height - padding.bottom}
                stroke="#94a3b8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="6"
                fill="#38bdf8"
                stroke="#ffffff"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div
            className="absolute top-3 left-16 bg-slate-900/95 border border-slate-700 rounded-xl p-2.5 text-xs text-slate-200 shadow-xl pointer-events-none backdrop-blur-md flex items-center space-x-3 z-30"
          >
            <div>
              <span className="text-[10px] text-slate-400 block font-mono">{hoveredPoint.record.time}</span>
              <div className="flex items-baseline space-x-1.5 font-bold">
                <span className="text-white text-sm">{hoveredPoint.val.toFixed(1)} {currentCfg.unit}</span>
                {hoveredPoint.record.is_anomaly && (
                  <span className="text-rose-400 text-[10px] font-mono bg-rose-500/20 px-1.5 rounded">
                    ANOMALY DETECTED
                  </span>
                )}
              </div>
            </div>
            <div className="border-l border-slate-800 pl-3 text-[11px] text-slate-400 space-y-0.5">
              <div>Temp: <strong className="text-slate-200">{hoveredPoint.record.temperature.toFixed(1)}°C</strong></div>
              <div>Humidity: <strong className="text-slate-200">{hoveredPoint.record.relative_humidity.toFixed(1)}%</strong></div>
              <div>Pressure: <strong className="text-slate-200">{hoveredPoint.record.surface_pressure.toFixed(1)} hPa</strong></div>
            </div>
          </div>
        )}

        {/* Chart Legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 px-3 py-1.5 border-t border-slate-800/80 mt-1">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: currentCfg.color }} />
              <span>{currentCfg.label} ({currentCfg.unit})</span>
            </div>
            {showBaseline && currentCfg.baselineKey && (
              <div className="flex items-center space-x-1.5 text-slate-400">
                <span className="h-0.5 w-3 border-t border-dashed border-slate-400" />
                <span>24h Diurnal Baseline</span>
              </div>
            )}
            <div className="flex items-center space-x-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-rose-400/30" />
              <span className="text-rose-400 font-medium">Flagged Anomaly</span>
            </div>
          </div>
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Zap className="h-3 w-3 text-cyan-400" />
            <span>Isolation Forest + 24-Window Moving Median</span>
          </div>
        </div>
      </div>
    </div>
  );
};
