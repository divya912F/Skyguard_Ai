import React, { useState, useEffect } from 'react';
import {
  Play,
  Sparkles,
  RefreshCw,
  AlertOctagon,
  Sliders,
  CheckCircle2,
  Pause,
  FastForward,
  SlidersHorizontal,
  Wand2,
  Eye,
  Radio,
  HelpCircle,
  Activity,
  Layers,
  Flame,
  Droplets,
  Wind,
  Snowflake,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { Station, TuningConfig, AnomalyAlert } from '../types';

interface AnomalySimulatorProps {
  stations: Station[];
  onTriggerStandardDemo: (stayOnTab?: boolean) => Promise<any>;
  onInjectCustom: (payload: {
    location_id: number;
    type: string;
    delta: number;
  }, stayOnTab?: boolean) => Promise<any>;
  onResetSimulations: () => Promise<void>;
  onAutoCleanAlert?: (alertId: string, notes?: string) => Promise<void>;
  onSelectStation?: (id: number) => void;
  onNavigateToTab?: (tab: string) => void;
  isLoading: boolean;
  onRefreshData?: () => void;
}

export const AnomalySimulator: React.FC<AnomalySimulatorProps> = ({
  stations,
  onTriggerStandardDemo,
  onInjectCustom,
  onResetSimulations,
  onAutoCleanAlert,
  onSelectStation,
  onNavigateToTab,
  isLoading,
  onRefreshData,
}) => {
  const [selectedLocation, setSelectedLocation] = useState<number>(0);
  const [anomalyType, setAnomalyType] = useState<string>('temperature_spike_drop');
  const [delta, setDelta] = useState<number>(14);
  const [lastInjectedResult, setLastInjectedResult] = useState<AnomalyAlert | null>(null);
  const [isCleaning, setIsCleaning] = useState<boolean>(false);
  const [cleaningSuccess, setCleaningSuccess] = useState<boolean>(false);
  const [showArchitectureGuide, setShowArchitectureGuide] = useState<boolean>(false);

  // Threshold Tuning state
  const [tuningConfig, setTuningConfig] = useState<TuningConfig>({
    sensitivity: 1.0,
    tempThreshold: 8.0,
    humThreshold: 18.0,
    pressThreshold: 10.0
  });
  const [isSavingTuning, setIsSavingTuning] = useState<boolean>(false);
  const [tuningSavedBanner, setTuningSavedBanner] = useState<boolean>(false);

  // Live stream player state
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [streamSpeed, setStreamSpeed] = useState<number>(1);

  // Fetch initial tuning config
  useEffect(() => {
    fetch('/api/tune-thresholds')
      .then((r) => r.json())
      .then((data) => {
        if (data.config) setTuningConfig(data.config);
      })
      .catch((err) => console.error('Failed to load tuning config:', err));
  }, []);

  // Stream simulation effect
  useEffect(() => {
    if (!isStreaming) return;
    const intervalMs = Math.max(1000, 3000 / streamSpeed);
    const timer = setInterval(() => {
      onRefreshData?.();
    }, intervalMs);
    return () => clearInterval(timer);
  }, [isStreaming, streamSpeed, onRefreshData]);

  // Current station metadata and nominal baseline
  const currentStation = stations.find((s) => s.location_id === selectedLocation) || stations[0];
  const baselineTemp = currentStation?.current_reading?.temperature ?? currentStation?.nominal_reading?.temperature ?? 22.0;
  const baselineHum = currentStation?.current_reading?.relative_humidity ?? currentStation?.nominal_reading?.relative_humidity ?? 65.0;
  const baselinePress = currentStation?.current_reading?.surface_pressure ?? currentStation?.nominal_reading?.surface_pressure ?? 1013.0;

  // Compute live pre-flight preview based on selected fault and delta
  let previewRawTemp = baselineTemp;
  let previewRawHum = baselineHum;
  let previewRawPress = baselinePress;
  let predictedGate = 'Gate 2: Temporal Step Jump Detection';
  let predictedImpact = `Simulates a step jump of ±${delta} units across a single observation hour.`;

  if (anomalyType === 'temperature_spike_drop') {
    previewRawTemp = parseFloat((baselineTemp + delta).toFixed(1));
    predictedGate = Math.abs(delta) >= (tuningConfig.tempThreshold / tuningConfig.sensitivity)
      ? `GATE 2 BREACH: Rate of Change (|ΔT|=${delta}°C >= ${(tuningConfig.tempThreshold / tuningConfig.sensitivity).toFixed(1)}°C)`
      : 'GATE 3 WARNING: Gaussian 2-Sigma Outlier';
    predictedImpact = `Surface thermistor registers an immediate ${delta > 0 ? '+' : ''}${delta}°C thermal surge.`;
  } else if (anomalyType === 'humidity_spike_drop') {
    previewRawHum = Math.max(5, Math.min(99, parseFloat((baselineHum - delta).toFixed(1))));
    predictedGate = Math.abs(delta) >= (tuningConfig.humThreshold / tuningConfig.sensitivity)
      ? `GATE 2 BREACH: Moisture Desiccation (|ΔRH|=${delta}% >= ${(tuningConfig.humThreshold / tuningConfig.sensitivity).toFixed(1)}%)`
      : 'GATE 3 WARNING: Gaussian Moisture Anomaly';
    predictedImpact = `Hygrometer registers sudden moisture plunge of -${delta}% RH against climatological moisture trend.`;
  } else if (anomalyType === 'pressure_spike_drop') {
    previewRawPress = parseFloat((baselinePress - delta).toFixed(1));
    predictedGate = Math.abs(delta) >= (tuningConfig.pressThreshold / tuningConfig.sensitivity)
      ? `GATE 2 BREACH: Barometric Squall (|ΔP|=${delta} hPa >= ${(tuningConfig.pressThreshold / tuningConfig.sensitivity).toFixed(1)} hPa)`
      : 'GATE 3 WARNING: Barometric Tendency Outlier';
    predictedImpact = `Barometer registers rapid drop of -${delta} hPa within 60 minutes.`;
  } else if (anomalyType === 'range_fault') {
    previewRawTemp = 64.5;
    predictedGate = 'GATE 1 CRITICAL BREACH: WMO Physical Bounds Climatological Limit (-35°C to 56°C)';
    predictedImpact = 'Sensor reading breaches absolute terrestrial thermodynamics limits. ADC pin or amplifier fault.';
  } else if (anomalyType === 'stuck_temperature_sensor') {
    previewRawTemp = baselineTemp;
    predictedGate = 'GATE 2 ZERO-VARIANCE FLAG: Transducer Output Flatlined Over Consecutive Cycles';
    predictedImpact = 'Thermistor output repeats identical float values with zero natural micro-turbulence jitter.';
  }

  const handleStandardDemo = async () => {
    setCleaningSuccess(false);
    const res = await onTriggerStandardDemo(true);
    if (res?.alert) {
      setLastInjectedResult(res.alert);
    }
  };

  const handleCustomInject = async () => {
    setCleaningSuccess(false);
    const res = await onInjectCustom({
      location_id: Number(selectedLocation),
      type: anomalyType,
      delta: Number(delta)
    }, true);
    if (res?.alert) {
      setLastInjectedResult(res.alert);
    }
  };

  // 1-Click Curated Preset Trigger
  const handleTriggerPreset = async (locId: number, type: string, presetDelta: number) => {
    setSelectedLocation(locId);
    setAnomalyType(type);
    setDelta(presetDelta);
    setCleaningSuccess(false);
    const res = await onInjectCustom({
      location_id: locId,
      type,
      delta: presetDelta
    }, true);
    if (res?.alert) {
      setLastInjectedResult(res.alert);
    }
  };

  const handleAutoCleanInjected = async () => {
    if (!lastInjectedResult) return;
    setIsCleaning(true);
    try {
      if (onAutoCleanAlert) {
        await onAutoCleanAlert(lastInjectedResult.id, 'Auto-remediated via WMO 3-Sigma QC Engine: Injected anomaly cleared and clean baseline restored.');
      } else {
        await onResetSimulations();
      }
      setCleaningSuccess(true);
      setLastInjectedResult({
        ...lastInjectedResult,
        triage_status: 'Resolved'
      });
    } catch (err) {
      console.error('Failed to auto-clean:', err);
    } finally {
      setIsCleaning(false);
    }
  };

  const handleSaveTuning = async () => {
    setIsSavingTuning(true);
    try {
      const res = await fetch('/api/tune-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tuningConfig)
      });
      const data = await res.json();
      if (data.config) setTuningConfig(data.config);
      setTuningSavedBanner(true);
      setTimeout(() => setTuningSavedBanner(false), 3000);
      onRefreshData?.();
    } catch (err) {
      console.error('Failed to save tuning thresholds:', err);
    } finally {
      setIsSavingTuning(false);
    }
  };

  // 6 Curated Realistic Meteorological Incident Scenarios
  const incidentPresets = [
    {
      id: 'preset-heatburst',
      title: 'Solar Shielding Failure (+15°C Spike)',
      stationId: 0,
      stationName: 'Palam, New Delhi',
      type: 'temperature_spike_drop',
      delta: 15,
      icon: Flame,
      color: 'text-rose-400',
      border: 'border-rose-500/30',
      bg: 'bg-rose-950/20',
      desc: 'Thermistor solar radiation shield jams, causing unshaded sunlight to surge temperature reading to 29.6°C.'
    },
    {
      id: 'preset-desiccation',
      title: 'Hygrometer Desiccation (-35% Drop)',
      stationId: 4,
      stationName: 'Jaisalmer (Thar Desert)',
      type: 'humidity_spike_drop',
      delta: 35,
      icon: Droplets,
      color: 'text-amber-400',
      border: 'border-amber-500/30',
      bg: 'bg-amber-950/20',
      desc: 'Capacitive polymer degradation causes abrupt drop to 14% RH, triggering moisture discontinuity alarm.'
    },
    {
      id: 'preset-squall',
      title: 'Pre-Cyclonic Squall Plunge (-18 hPa)',
      stationId: 1,
      stationName: 'Visakhapatnam (Bay of Bengal)',
      type: 'pressure_spike_drop',
      delta: 18,
      icon: Wind,
      color: 'text-indigo-400',
      border: 'border-indigo-500/30',
      bg: 'bg-indigo-950/20',
      desc: 'Violent barometric plunge flags sudden coastal squall gradient (>10 hPa/hr rate of change).'
    },
    {
      id: 'preset-stuck',
      title: 'ADC Transducer Pin Freeze (Stuck Output)',
      stationId: 3,
      stationName: 'Pune (Deccan Plateau)',
      type: 'stuck_temperature_sensor',
      delta: 0,
      icon: Pause,
      color: 'text-cyan-400',
      border: 'border-cyan-500/30',
      bg: 'bg-cyan-950/20',
      desc: 'ADC converter pin latches, outputting constant identical readings without micro-turbulence noise.'
    },
    {
      id: 'preset-range',
      title: 'Physical Bounds Breach (Range Fault)',
      stationId: 8,
      stationName: 'Shimla (Himalayan Foothills)',
      type: 'range_fault',
      delta: 30,
      icon: Snowflake,
      color: 'text-purple-400',
      border: 'border-purple-500/30',
      bg: 'bg-purple-950/20',
      desc: 'Sensor outputs 64.5°C in mountain winter, violating WMO absolute terrestrial climatology bounds.'
    },
    {
      id: 'preset-standard',
      title: 'Standard Hackathon Benchmark Demo',
      stationId: 0,
      stationName: 'Palam, New Delhi',
      type: 'temperature_spike_drop',
      delta: 16.4,
      icon: Sparkles,
      color: 'text-emerald-400',
      border: 'border-emerald-500/30',
      bg: 'bg-emerald-950/20',
      desc: 'Guaranteed 13.2°C → 29.6°C thermal step jump as specified in official SIH problem statement.'
    }
  ];

  return (
    <div id="anomaly-simulator-section" className="space-y-6 mb-6">
      {/* Top Banner: Incident Trigger Studio */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Sliders className="h-5 w-5 text-amber-400" />
              <h2 className="text-base font-semibold text-slate-100">Live Incident Trigger & Fault Injection Studio</h2>
              <span className="rounded bg-amber-500/15 px-2.5 py-0.5 text-xs font-mono text-amber-400 border border-amber-500/30 font-semibold">
                IMD QC Testbed
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Inject controlled transducer corruptions into real AWS telemetry, watch the 5-layer QC pipeline flag them, and compare raw corrupted signals against verified clean ground truth.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="btn-toggle-arch-guide"
              onClick={() => setShowArchitectureGuide(!showArchitectureGuide)}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
              <span>{showArchitectureGuide ? 'Hide Pipeline Guide' : 'Raw vs Cleaned Pipeline'}</span>
            </button>

            <button
              id="btn-reset-simulations"
              onClick={onResetSimulations}
              disabled={isLoading}
              className="flex items-center space-x-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5 text-slate-400" />
              <span>Reset Simulations</span>
            </button>
          </div>
        </div>

        {/* Pipeline Architecture Guide */}
        {showArchitectureGuide && (
          <div className="mb-5 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/30 via-slate-950/70 to-blue-950/30 p-4 text-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Radio className="h-4 w-4 text-cyan-400" />
                <h3 className="font-semibold text-cyan-200">How the SkyGuard Telemetry Pipeline Operates</h3>
              </div>
              <button onClick={() => setShowArchitectureGuide(false)} className="text-slate-400 hover:text-slate-200">
                Close
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2.5 pt-1 text-[11px]">
              <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-2.5">
                <div className="font-bold text-slate-200 mb-1">Step 1: Raw Field Ingestion</div>
                <p className="text-slate-400">
                  Telemetry is streamed hourly from AWS microcontrollers. Unprocessed bitstreams may contain micro-transients, cable shorts, or radiation shield jams.
                </p>
              </div>
              <div className="rounded-lg border border-amber-500/30 bg-amber-950/20 p-2.5">
                <div className="font-bold text-amber-300 mb-1">Step 2: Incident Trigger</div>
                <p className="text-slate-400">
                  When you trigger an anomaly, a distorted transducer bitstream is pushed onto the station's time series, mimicking a field hardware malfunction.
                </p>
              </div>
              <div className="rounded-lg border border-cyan-500/30 bg-cyan-950/20 p-2.5">
                <div className="font-bold text-cyan-300 mb-1">Step 3: 5-Gate QC Evaluation</div>
                <p className="text-slate-400">
                  WMO bounds (L1), 1-hour rate of change (L2), Gaussian 3-sigma (L3), Psychrometric balance (L4), and Isolation Forest (L5) evaluate the sample.
                </p>
              </div>
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-950/20 p-2.5">
                <div className="font-bold text-emerald-300 mb-1">Step 4: Imputation & Clean Baseline</div>
                <p className="text-slate-400">
                  Corrupted samples are quarantined. The clean baseline (<code className="text-emerald-300">clean_weather_dataset.csv</code>) is preserved via diurnal harmonic splines.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Curated Incident Presets Header */}
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-semibold text-slate-200">1-Click Curated Incident Scenarios</span>
            <span className="text-[10px] text-slate-400">(Pre-configured realistic meteorological hardware faults)</span>
          </div>
        </div>

        {/* 6 Curated Scenario Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {incidentPresets.map((preset) => {
            const Icon = preset.icon;
            return (
              <div
                key={preset.id}
                id={`card-${preset.id}`}
                className={`rounded-xl border ${preset.border} ${preset.bg} p-3 flex flex-col justify-between hover:border-cyan-500/50 transition-all group`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center space-x-2">
                      <Icon className={`h-4 w-4 ${preset.color}`} />
                      <span className="font-bold text-slate-200 text-xs">{preset.title}</span>
                    </div>
                  </div>
                  <div className="text-[10px] font-mono text-cyan-400 mb-1">
                    Target: #{preset.stationId} {preset.stationName}
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                    {preset.desc}
                  </p>
                </div>

                <button
                  id={`btn-trigger-${preset.id}`}
                  onClick={() => handleTriggerPreset(preset.stationId, preset.type, preset.delta)}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 group-hover:border-cyan-500/40 text-slate-200 text-xs font-semibold transition-all disabled:opacity-50"
                >
                  <Play className="h-3 w-3 fill-current text-cyan-400" />
                  <span>Simulate This Incident</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* Live Incident Result Hub (Shown when an anomaly has just been injected) */}
        {lastInjectedResult && (
          <div id="incident-verification-hub" className="mb-6 rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-950/30 via-slate-950/80 to-slate-950/90 p-4 text-xs shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3 pb-2 border-b border-amber-500/30">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-5 w-5 text-amber-400 shrink-0" />
                <div>
                  <span className="font-bold text-amber-300 text-sm">Incident Trigger Verified & Live Alarm Active: </span>
                  <span className="text-slate-200 font-medium">{lastInjectedResult.explanation}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2 text-[11px] font-mono shrink-0">
                <span className="bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded border border-rose-500/30 font-bold">
                  {lastInjectedResult.severity} ({lastInjectedResult.severity_score}/100)
                </span>
                <span className="bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30">
                  {lastInjectedResult.confidence}% Confidence
                </span>
              </div>
            </div>

            {/* Side-by-side Result Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="rounded-lg border border-rose-500/40 bg-rose-950/20 p-2.5">
                <div className="font-bold text-rose-300 text-[11px] mb-1 flex items-center space-x-1.5">
                  <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                  <span>SIMULATED RAW FIELD TELEMETRY (CORRUPTED)</span>
                </div>
                <div className="flex items-center justify-between text-slate-200 font-mono text-xs">
                  <span>Temp: <strong className="text-rose-400">{(lastInjectedResult.raw_temperature ?? lastInjectedResult.temperature).toFixed(1)}°C</strong></span>
                  <span>Humidity: <strong>{(lastInjectedResult.raw_humidity ?? lastInjectedResult.humidity).toFixed(1)}%</strong></span>
                  <span>Pressure: <strong>{(lastInjectedResult.raw_pressure ?? lastInjectedResult.pressure).toFixed(1)} hPa</strong></span>
                </div>
                {lastInjectedResult.delta_temperature !== undefined && (
                  <div className="mt-1 text-[10px] text-rose-400 font-mono">
                    Thermal Distortion: {lastInjectedResult.delta_temperature > 0 ? `+${lastInjectedResult.delta_temperature}°C` : `${lastInjectedResult.delta_temperature}°C`} above baseline
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-2.5">
                <div className="font-bold text-emerald-300 text-[11px] mb-1 flex items-center space-x-1.5">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  <span>VERIFIED GROUND TRUTH BASELINE (CLEAN WMO)</span>
                </div>
                <div className="flex items-center justify-between text-slate-200 font-mono text-xs">
                  <span>Temp: <strong className="text-emerald-400">{(lastInjectedResult.cleaned_temperature ?? baselineTemp).toFixed(1)}°C</strong></span>
                  <span>Humidity: <strong>{(lastInjectedResult.cleaned_humidity ?? baselineHum).toFixed(1)}%</strong></span>
                  <span>Pressure: <strong>{(lastInjectedResult.cleaned_pressure ?? baselinePress).toFixed(1)} hPa</strong></span>
                </div>
                <div className="mt-1 text-[10px] text-emerald-400 font-mono">
                  Preserved via {lastInjectedResult.imputation_method || 'WMO 3-Sigma Diurnal Spline Reconstructor'}
                </div>
              </div>
            </div>

            {/* Immediate Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              <div className="flex items-center space-x-2">
                {cleaningSuccess || lastInjectedResult.triage_status === 'Resolved' ? (
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 text-xs font-semibold">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Telemetry Reverted & Clean Baseline Restored</span>
                  </span>
                ) : (
                  <button
                    id="btn-auto-clean-injected"
                    onClick={handleAutoCleanInjected}
                    disabled={isCleaning}
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-sm transition-all disabled:opacity-50"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                    <span>{isCleaning ? 'Cleaning & Imputing...' : 'One-Click Auto-Clean & Impute (Revert Anomaly)'}</span>
                  </button>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <button
                  id="btn-inspect-in-surveillance"
                  onClick={() => {
                    onSelectStation?.(lastInjectedResult.location_id);
                    onNavigateToTab?.('dashboard');
                  }}
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-300 text-xs font-semibold transition-all"
                >
                  <Eye className="h-3.5 w-3.5 text-cyan-400" />
                  <span>Inspect in Station Surveillance</span>
                </button>

                <a
                  href="#alerts-feed-section"
                  className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-medium transition-all"
                >
                  <span>View in Live Alerts Feed ↓</span>
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Custom Transducer Fault Injector with LIVE PRE-FLIGHT IMPACT PREVIEW */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <div className="text-xs font-semibold text-slate-200 mb-3 flex items-center space-x-2">
            <AlertOctagon className="h-4 w-4 text-amber-400" />
            <span>Custom Transducer Fault Injector & Live Pre-Flight Impact Visualizer</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Left 7 cols: Controls */}
            <div className="lg:col-span-7 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Target Station</label>
                  <select
                    id="select-inject-station"
                    value={selectedLocation}
                    onChange={(e) => setSelectedLocation(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    {stations.map((s) => (
                      <option key={s.location_id} value={s.location_id}>
                        #{s.location_id} - {s.name} ({s.region})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Fault Archetype</label>
                  <select
                    id="select-inject-type"
                    value={anomalyType}
                    onChange={(e) => setAnomalyType(e.target.value)}
                    className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-200 focus:border-cyan-500 focus:outline-none"
                  >
                    <option value="temperature_spike_drop">Temperature Surge / Drop (Thermal Step)</option>
                    <option value="humidity_spike_drop">Humidity Desiccation / Spike (Moisture Step)</option>
                    <option value="pressure_spike_drop">Barometric Pressure Plunge / Squall</option>
                    <option value="stuck_temperature_sensor">Stuck Transducer Output (Flatline ADC)</option>
                    <option value="range_fault">Range Fault (Absolute Physics Boundary Breach)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-400">
                    Delta Magnitude: <span className="text-cyan-400 font-mono font-bold">±{delta} units</span>
                  </label>
                  <span className="text-[10px] text-slate-500">
                    Dynamic Trigger Threshold: {(tuningConfig.tempThreshold / tuningConfig.sensitivity).toFixed(1)}°C / {(tuningConfig.humThreshold / tuningConfig.sensitivity).toFixed(1)}%
                  </span>
                </div>
                <input
                  id="input-inject-delta"
                  type="range"
                  min="4"
                  max="30"
                  step="1"
                  value={delta}
                  onChange={(e) => setDelta(Number(e.target.value))}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  id="btn-inject-custom-anomaly"
                  onClick={handleCustomInject}
                  disabled={isLoading}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold py-2.5 px-5 text-xs transition-colors shadow-sm disabled:opacity-50"
                >
                  <AlertOctagon className="h-4 w-4" />
                  <span>Inject Custom Anomaly into Live Telemetry</span>
                </button>
              </div>
            </div>

            {/* Right 5 cols: Live Pre-Flight Impact Visualizer */}
            <div className="lg:col-span-5 rounded-xl border border-cyan-500/30 bg-slate-900/80 p-3.5 text-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-cyan-300 text-[11px] flex items-center space-x-1.5">
                    <Activity className="h-3.5 w-3.5 text-cyan-400" />
                    <span>PRE-FLIGHT TELEMETRY PREVIEW</span>
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Live Calculation</span>
                </div>

                <div className="space-y-2 mb-3">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Clean Ground Truth Target:</span>
                    <span className="font-mono text-emerald-300 font-semibold">
                      {baselineTemp.toFixed(1)}°C | {baselineHum.toFixed(1)}% | {baselinePress.toFixed(1)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2 rounded-lg bg-rose-950/30 border border-rose-500/30">
                    <span className="text-rose-300 text-[11px]">Simulated Raw Influx:</span>
                    <span className="font-mono text-rose-300 font-bold">
                      {previewRawTemp.toFixed(1)}°C | {previewRawHum.toFixed(1)}% | {previewRawPress.toFixed(1)}
                    </span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[11px] mb-2">
                  <div className="text-amber-300 font-semibold mb-0.5">Predicted QC Gate Verdict:</div>
                  <div className="text-slate-300 font-mono">{predictedGate}</div>
                </div>

                <p className="text-[11px] text-slate-400 italic">
                  {predictedImpact}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Threshold Tuning Studio (mimics tune_threshold.py) */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 backdrop-blur-md shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div>
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="h-4 w-4 text-cyan-400" />
              <h2 className="text-sm font-semibold text-slate-100">Threshold Calibration & Sensitivity Tuner</h2>
              <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-[11px] font-mono text-cyan-400 border border-cyan-500/20">
                tune_threshold.py
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Calibrate detection sensitivity and individual delta tolerances across all 10 automated weather stations.
            </p>
          </div>

          <button
            id="btn-apply-tuning"
            onClick={handleSaveTuning}
            disabled={isSavingTuning}
            className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
          >
            {isSavingTuning ? 'Recalibrating...' : 'Apply & Recalibrate Engine'}
          </button>
        </div>

        {tuningSavedBanner && (
          <div className="mb-4 rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-2.5 text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>Thresholds successfully updated and applied across all 10 meteorological stations!</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Global Sensitivity */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-300">Global Sensitivity</span>
              <span className="font-mono text-cyan-400 font-bold">{tuningConfig.sensitivity}x</span>
            </div>
            <input
              id="slider-tuning-sensitivity"
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={tuningConfig.sensitivity}
              onChange={(e) => setTuningConfig({ ...tuningConfig, sensitivity: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              &lt;1.0 = Conservative (alarms only) • &gt;1.0 = Aggressive QC
            </span>
          </div>

          {/* Temperature Threshold */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-300">Temp Delta (ΔT)</span>
              <span className="font-mono text-amber-400 font-bold">{tuningConfig.tempThreshold}°C</span>
            </div>
            <input
              id="slider-tuning-temp"
              type="range"
              min="3"
              max="18"
              step="0.5"
              value={tuningConfig.tempThreshold}
              onChange={(e) => setTuningConfig({ ...tuningConfig, tempThreshold: parseFloat(e.target.value) })}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              1-hour step deviation threshold for thermal spikes
            </span>
          </div>

          {/* Humidity Threshold */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-300">Humidity Delta (ΔRH)</span>
              <span className="font-mono text-cyan-400 font-bold">{tuningConfig.humThreshold}%</span>
            </div>
            <input
              id="slider-tuning-hum"
              type="range"
              min="8"
              max="35"
              step="1"
              value={tuningConfig.humThreshold}
              onChange={(e) => setTuningConfig({ ...tuningConfig, humThreshold: parseFloat(e.target.value) })}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Moisture jump threshold before desiccation flag
            </span>
          </div>

          {/* Pressure Threshold */}
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-300">Pressure Delta (ΔP)</span>
              <span className="font-mono text-indigo-400 font-bold">{tuningConfig.pressThreshold} hPa</span>
            </div>
            <input
              id="slider-tuning-press"
              type="range"
              min="4"
              max="25"
              step="1"
              value={tuningConfig.pressThreshold}
              onChange={(e) => setTuningConfig({ ...tuningConfig, pressThreshold: parseFloat(e.target.value) })}
              className="w-full accent-indigo-500 cursor-pointer"
            />
            <span className="text-[10px] text-slate-400 block mt-1">
              Barometric transducer step jump threshold
            </span>
          </div>
        </div>
      </div>

      {/* Live Stream Telemetry Player */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <FastForward className="h-4 w-4 text-emerald-400" />
              <h2 className="text-sm font-semibold text-slate-100">Continuous Control Room Feed Simulator</h2>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono border ${
                isStreaming
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {isStreaming ? 'STREAMING ACTIVE' : 'STREAM PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate live telemetry polling from remote Automatic Weather Stations into the surveillance pipeline.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {[1, 2, 5].map((spd) => (
                <button
                  key={spd}
                  onClick={() => setStreamSpeed(spd)}
                  className={`px-2 py-1 rounded font-mono ${
                    streamSpeed === spd
                      ? 'bg-slate-800 text-white font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>

            <button
              id="btn-toggle-stream"
              onClick={() => setIsStreaming(!isStreaming)}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                isStreaming
                  ? 'bg-amber-600 hover:bg-amber-500 text-white'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              {isStreaming ? (
                <>
                  <Pause className="h-3.5 w-3.5 fill-current" />
                  <span>Pause Stream</span>
                </>
              ) : (
                <>
                  <Play className="h-3.5 w-3.5 fill-current" />
                  <span>Start Stream</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
