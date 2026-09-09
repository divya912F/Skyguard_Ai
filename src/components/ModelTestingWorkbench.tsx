import React, { useState } from 'react';
import { 
  Play, 
  Sparkles, 
  FlaskConical, 
  CheckCircle2, 
  AlertTriangle, 
  Zap, 
  Layers, 
  Sliders, 
  Terminal, 
  Copy, 
  Check, 
  Cpu, 
  Activity, 
  ShieldAlert, 
  Gauge, 
  ArrowRight,
  RefreshCw,
  Clock,
  BarChart3,
  ShieldCheck,
  XCircle,
  Wrench
} from 'lucide-react';
import { Station, ModelEvaluationResult, BenchmarkSuiteResult, TuningConfig } from '../types';

interface ModelTestingWorkbenchProps {
  stations: Station[];
  onTriggerStandardDemo: () => Promise<any>;
  onInjectCustom: (payload: {
    location_id: number;
    type: string;
    delta: number;
  }) => Promise<any>;
  onResetSimulations: () => Promise<void>;
  isLoading: boolean;
  onRefreshData?: () => void;
}

export const ModelTestingWorkbench: React.FC<ModelTestingWorkbenchProps> = ({
  stations,
  onTriggerStandardDemo,
  onInjectCustom,
  onResetSimulations,
  isLoading,
  onRefreshData,
}) => {
  // Mode selection: Sandbox vs Live Injector vs Benchmark vs Python Code
  const [activeSubTab, setActiveSubTab] = useState<'sandbox' | 'injector' | 'benchmark' | 'python'>('sandbox');

  // Sandbox inputs
  const [testStationId, setTestStationId] = useState<number>(0);
  const [temperature, setTemperature] = useState<number>(34.2);
  const [humidity, setHumidity] = useState<number>(45.0);
  const [pressure, setPressure] = useState<number>(1016.0);
  const [prevTemperature, setPrevTemperature] = useState<number>(19.4);
  const [prevHumidity, setPrevHumidity] = useState<number>(71.0);
  const [prevPressure, setPrevPressure] = useState<number>(1016.0);

  // Evaluation state
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<ModelEvaluationResult | null>(null);

  // Live injector inputs
  const [injectStationId, setInjectStationId] = useState<number>(0);
  const [injectType, setInjectType] = useState<string>('temperature_spike_drop');
  const [injectDelta, setInjectDelta] = useState<number>(14.0);
  const [lastInjectedAlert, setLastInjectedAlert] = useState<any>(null);

  // Benchmark state
  const [isBenchmarking, setIsBenchmarking] = useState<boolean>(false);
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkSuiteResult | null>(null);

  // Copy state for Python code
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Presets for rapid model testing
  const presets = [
    {
      name: 'Diurnal Heatwave Spike',
      category: 'Thermal Jump',
      stationId: 0,
      t: 34.5,
      rh: 42,
      p: 1016,
      prevT: 19.4,
      prevRh: 71,
      prevP: 1016,
      desc: '+15.1°C temperature surge within 1 hour'
    },
    {
      name: 'Pre-Cyclonic Pressure Drop',
      category: 'Barometric Plunge',
      stationId: 1,
      t: 27.5,
      rh: 88,
      p: 994,
      prevT: 27.0,
      prevRh: 78,
      prevP: 1011,
      desc: '-17 hPa barometric drop indicating squall front'
    },
    {
      name: 'Sensor Range Fault (ADC Short)',
      category: 'Physical Limits',
      stationId: 7,
      t: 68.0,
      rh: 69,
      p: 1013,
      prevT: 22.0,
      prevRh: 69,
      prevP: 1013,
      desc: '68°C exceeds physical WMO climatological bounds'
    },
    {
      name: 'Supersaturation Violation',
      category: 'Psychrometrics',
      stationId: 2,
      t: 28.0,
      rh: 110,
      p: 1008,
      prevT: 28.0,
      prevRh: 82,
      prevP: 1008,
      desc: '110% Relative Humidity breaches Clausius-Clapeyron limit'
    },
    {
      name: 'Flash Cold Front Plunge',
      category: 'Cryospheric Shift',
      stationId: 8,
      t: 3.5,
      rh: 40,
      p: 1015,
      prevT: 18.0,
      prevRh: 65,
      prevP: 1015,
      desc: '-14.5°C rapid sub-tropical freezing wave'
    },
    {
      name: 'Nominal Baseline Control',
      category: 'Nominal Normal',
      stationId: 0,
      t: 19.6,
      rh: 70,
      p: 1016,
      prevT: 19.4,
      prevRh: 71,
      prevP: 1016,
      desc: 'Calm nominal reading conforming to standard climate'
    }
  ];

  const applyPreset = (preset: typeof presets[0]) => {
    setTestStationId(preset.stationId);
    setTemperature(preset.t);
    setHumidity(preset.rh);
    setPressure(preset.p);
    setPrevTemperature(preset.prevT);
    setPrevHumidity(preset.prevRh);
    setPrevPressure(preset.prevP);
  };

  // Run model inference test
  const handleEvaluateModel = async () => {
    setIsEvaluating(true);
    try {
      const res = await fetch('/api/test-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_id: Number(testStationId),
          temperature: Number(temperature),
          relative_humidity: Number(humidity),
          surface_pressure: Number(pressure),
          previous_temperature: Number(prevTemperature),
          previous_humidity: Number(prevHumidity),
          previous_pressure: Number(prevPressure),
        })
      });
      const data = await res.json();
      if (data.evaluation) {
        setEvaluationResult(data.evaluation);
      }
    } catch (err) {
      console.error('Failed to evaluate model:', err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Run automated benchmark
  const handleRunBenchmark = async () => {
    setIsBenchmarking(true);
    try {
      const res = await fetch('/api/test-benchmark');
      const data = await res.json();
      if (data.benchmark) {
        setBenchmarkResult(data.benchmark);
      }
    } catch (err) {
      console.error('Failed to run benchmark:', err);
    } finally {
      setIsBenchmarking(false);
    }
  };

  // Live injection
  const handleInjectToLiveStream = async () => {
    const res = await onInjectCustom({
      location_id: Number(injectStationId),
      type: injectType,
      delta: Number(injectDelta)
    });
    if (res?.alert) {
      setLastInjectedAlert(res.alert);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const currentStation = stations.find((s) => s.location_id === testStationId) || stations[0];

  const pythonSnippet = `# SkyGuard AI Python Anomaly Detector Quickstart
import math
from skyguard_engine import MeteorologicalAnomalyEngine

# Initialize the 5-layer physics & ML anomaly detector
engine = MeteorologicalAnomalyEngine()

# Test arbitrary meteorological observation
result = engine.evaluate_telemetry(
    location_id=0,             # New Delhi (Safdarjung)
    temperature=34.5,          # °C
    relative_humidity=45.0,    # %
    surface_pressure=1016.0,   # hPa
    previous_temperature=19.4  # T-1 hour
)

print(f"Is Anomaly: {result['is_anomaly']}")
print(f"Classification: {result['anomaly_type']}")
print(f"Confidence: {result['confidence']}%")
print(f"Explanation: {result['explanation']}")

# Run the 8-vector benchmark suite
benchmark = engine.run_benchmark_suite()
print(f"Accuracy: {benchmark['accuracy_pct']}% | Latency: {benchmark['avg_latency_ms']} ms")`;

  return (
    <div id="model-testing-workbench-container" className="space-y-6 mb-8">
      {/* Top Banner with Navigation Tabs */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/85 p-5 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 border border-cyan-500/30 text-cyan-400">
              <FlaskConical className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-white tracking-tight">Model Testing & Anomaly Injection Lab</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Ensemble 5-Layer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stress-test machine learning & physics boundaries, inject live anomalies into station telemetry, or inspect Python backend code.
              </p>
            </div>
          </div>

          {/* Sub-tab Navigation */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950/70 border border-white/10 text-xs">
            <button
              id="subtab-sandbox"
              onClick={() => setActiveSubTab('sandbox')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'sandbox'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span>Inference Sandbox</span>
            </button>

            <button
              id="subtab-injector"
              onClick={() => setActiveSubTab('injector')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'injector'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="h-3.5 w-3.5" />
              <span>Live Anomaly Injector</span>
            </button>

            <button
              id="subtab-benchmark"
              onClick={() => setActiveSubTab('benchmark')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'benchmark'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>Benchmark Suite</span>
            </button>

            <button
              id="subtab-python"
              onClick={() => setActiveSubTab('python')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeSubTab === 'python'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>Python Backend Code</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* SUB-TAB 1: INFERENCE SANDBOX                             */}
      {/* ========================================================= */}
      {activeSubTab === 'sandbox' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Input Vectors & Stress Presets (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            {/* Presets Box */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 backdrop-blur-md shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Stress Test Presets</span>
                <span className="text-[11px] text-slate-500">Click to load vector</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {presets.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() => applyPreset(p)}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-white/5 hover:border-cyan-500/40 hover:bg-slate-800/60 text-left transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-white group-hover:text-cyan-300 truncate">
                        {p.name}
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {p.category}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{p.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Telemetry Form */}
            <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-4 sm:p-5 backdrop-blur-md shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                  <Sliders className="h-4 w-4 text-cyan-400" />
                  <span>Configure Test Telemetry Vector</span>
                </h3>
                <span className="text-[11px] font-mono text-cyan-400/80">Isolated Sandbox</span>
              </div>

              {/* Station Selection */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Station & Climate Baseline</label>
                <select
                  id="sandbox-station-select"
                  value={testStationId}
                  onChange={(e) => {
                    const id = Number(e.target.value);
                    setTestStationId(id);
                    const st = stations.find((s) => s.location_id === id);
                    if (st && st.nominal_reading) {
                      setPrevTemperature(st.nominal_reading.temperature);
                      setPrevHumidity(st.nominal_reading.relative_humidity);
                      setPrevPressure(st.nominal_reading.surface_pressure);
                    }
                  }}
                  className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {stations.map((s) => (
                    <option key={s.location_id} value={s.location_id}>
                      Station #{s.location_id}: {s.name} ({s.state})
                    </option>
                  ))}
                </select>
                <div className="mt-1 flex items-center justify-between text-[10px] text-slate-400 px-1 font-mono">
                  <span>Nominal: T={currentStation?.nominal_reading?.temperature ?? 20.0}°C</span>
                  <span>RH={currentStation?.nominal_reading?.relative_humidity ?? 70.0}%</span>
                  <span>P={currentStation?.nominal_reading?.surface_pressure ?? 1013.0}hPa</span>
                </div>
              </div>

              {/* Input Sliders & Number inputs */}
              <div className="space-y-3 pt-2">
                {/* Temperature */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Test Temperature (T)</span>
                    <span className="font-mono font-bold text-amber-400">{temperature}°C</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="-30"
                      max="65"
                      step="0.5"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      value={temperature}
                      onChange={(e) => setTemperature(parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-right text-slate-200"
                    />
                  </div>
                </div>

                {/* Relative Humidity */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Test Relative Humidity (RH)</span>
                    <span className="font-mono font-bold text-cyan-400">{humidity}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="115"
                      step="1"
                      value={humidity}
                      onChange={(e) => setHumidity(parseFloat(e.target.value))}
                      className="w-full accent-cyan-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      value={humidity}
                      onChange={(e) => setHumidity(parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-right text-slate-200"
                    />
                  </div>
                </div>

                {/* Surface Pressure */}
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300 font-medium">Test Surface Pressure (P)</span>
                    <span className="font-mono font-bold text-indigo-400">{pressure} hPa</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="range"
                      min="920"
                      max="1060"
                      step="1"
                      value={pressure}
                      onChange={(e) => setPressure(parseFloat(e.target.value))}
                      className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <input
                      type="number"
                      value={pressure}
                      onChange={(e) => setPressure(parseFloat(e.target.value) || 0)}
                      className="w-16 px-2 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-right text-slate-200"
                    />
                  </div>
                </div>

                {/* Previous Readings (for Step jump detection) */}
                <div className="pt-2 border-t border-white/10">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Previous Step Continuity (T - 1 hr)
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Prev Temp</span>
                      <input
                        type="number"
                        step="0.5"
                        value={prevTemperature}
                        onChange={(e) => setPrevTemperature(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Prev RH %</span>
                      <input
                        type="number"
                        step="1"
                        value={prevHumidity}
                        onChange={(e) => setPrevHumidity(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-slate-200"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-1">Prev Pressure</span>
                      <input
                        type="number"
                        step="1"
                        value={prevPressure}
                        onChange={(e) => setPrevPressure(parseFloat(e.target.value) || 0)}
                        className="w-full px-2 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-slate-200"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Evaluate Button */}
              <button
                id="btn-evaluate-model-test"
                onClick={handleEvaluateModel}
                disabled={isEvaluating}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all flex items-center justify-center space-x-2"
              >
                {isEvaluating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Running Model Evaluation...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Evaluate Observation with Model</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Model Diagnostics & Decision Output (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {evaluationResult ? (
              <div className="rounded-2xl border border-white/10 bg-slate-900/85 p-5 backdrop-blur-xl shadow-xl space-y-5">
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/10">
                  <div>
                    <div className="flex items-center space-x-2.5">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          evaluationResult.is_anomaly
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm shadow-rose-500/20'
                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                        }`}
                      >
                        {evaluationResult.is_anomaly ? 'ANOMALY DETECTED' : 'NOMINAL DATA'}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        Classification: <strong className="text-white">{evaluationResult.anomaly_type}</strong>
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-2 leading-relaxed">{evaluationResult.explanation}</p>
                  </div>

                  {/* Confidence & Latency */}
                  <div className="flex items-center space-x-3 sm:text-right shrink-0">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Confidence</span>
                      <span className="text-base font-bold text-white font-mono">{evaluationResult.confidence}%</span>
                    </div>
                    <div className="h-8 w-px bg-white/10" />
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono">Inference</span>
                      <span className="text-base font-bold text-cyan-400 font-mono">{evaluationResult.inference_time_ms} ms</span>
                    </div>
                  </div>
                </div>

                {/* Quality Advisory: Good Response vs Bad Note for Anomaly */}
                {evaluationResult.quality_advisory && (
                  <div
                    id="model-test-quality-advisory"
                    className={`p-4 rounded-xl border space-y-3 ${
                      evaluationResult.is_anomaly
                        ? 'bg-rose-950/25 border-rose-500/40 text-rose-100'
                        : 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center space-x-2">
                        {evaluationResult.is_anomaly ? (
                          <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0" />
                        ) : (
                          <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
                        )}
                        <span className="font-bold text-white text-xs">
                          {evaluationResult.quality_advisory.title}
                        </span>
                      </div>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold self-start sm:self-auto border ${
                        evaluationResult.is_anomaly
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                      }`}>
                        {evaluationResult.is_anomaly
                          ? `Urgency: ${evaluationResult.quality_advisory.urgency}`
                          : 'Status: Good / Equilibrium Verified'}
                      </span>
                    </div>

                    {/* Descriptive Note (Good response or bad note according to classification) */}
                    <div className="space-y-1">
                      <span className="text-[10.5px] uppercase font-mono tracking-wider text-slate-300 font-semibold block flex items-center space-x-1.5">
                        <Sparkles className="h-3 w-3 text-cyan-400" />
                        <span>{evaluationResult.is_anomaly ? 'Anomaly Classification Diagnostic Note' : 'Good Response & Equilibrium Note'}</span>
                      </span>
                      <p className="text-xs text-slate-200 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-white/5">
                        {evaluationResult.quality_advisory.note}
                      </p>
                    </div>

                    {/* Atmospheric Physics, Hardware Diagnostics & Directive */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px]">
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/5 space-y-0.5">
                        <span className="text-[10px] uppercase font-mono text-cyan-400 font-semibold block">Atmospheric Physics Law</span>
                        <p className="text-slate-300 leading-snug">{evaluationResult.quality_advisory.physics_rule}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/5 space-y-0.5">
                        <span className="text-[10px] uppercase font-mono text-amber-400 font-semibold block">Hardware Diagnostic</span>
                        <p className="text-slate-300 leading-snug">{evaluationResult.quality_advisory.hardware_diagnostic}</p>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950/70 border border-white/5 space-y-0.5">
                        <span className="text-[10px] uppercase font-mono text-emerald-400 font-semibold block">Action Directive</span>
                        <p className="text-slate-300 leading-snug">{evaluationResult.quality_advisory.action_directive}</p>
                      </div>
                    </div>

                    {/* Verification Checks */}
                    {evaluationResult.quality_advisory.verification_checks && evaluationResult.quality_advisory.verification_checks.length > 0 && (
                      <div className="pt-2 border-t border-white/10">
                        <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold block mb-1.5">
                          Thermodynamic & Physical Bounds Verification
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                          {evaluationResult.quality_advisory.verification_checks.map((chk, idx) => (
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
                )}

                {/* 5-Layer Architectural Diagnostics Matrix */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center space-x-1.5">
                    <Layers className="h-3.5 w-3.5 text-cyan-400" />
                    <span>5-Layer Ensemble Verification Breakdown</span>
                  </h4>
                  <div className="grid grid-cols-1 gap-2">
                    {evaluationResult.layer_diagnostics.map((layer) => (
                      <div
                        key={layer.id}
                        className={`p-3 rounded-xl border transition-all ${
                          layer.status === 'FLAGGED'
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-200'
                            : layer.status === 'WARNING'
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                            : 'bg-slate-950/60 border-white/5 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-2">
                            <span
                              className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                layer.status === 'FLAGGED'
                                  ? 'bg-rose-500/30 text-rose-300'
                                  : layer.status === 'WARNING'
                                  ? 'bg-amber-500/30 text-amber-300'
                                  : 'bg-emerald-500/20 text-emerald-300'
                              }`}
                            >
                              {layer.id}
                            </span>
                            <span className="text-xs font-semibold text-white">{layer.name}</span>
                          </div>
                          <span
                            className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                              layer.status === 'FLAGGED'
                                ? 'bg-rose-500 text-white'
                                : layer.status === 'WARNING'
                                ? 'bg-amber-500 text-black font-bold'
                                : 'bg-emerald-500/20 text-emerald-300'
                            }`}
                          >
                            {layer.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono flex flex-wrap gap-x-4">
                          <span>Observed: {layer.metric}</span>
                          <span>Cutoff: {layer.threshold}</span>
                        </div>
                        <p className="text-[11px] text-slate-300 mt-1">{layer.details}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feature Importance Contribution */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2.5">
                    Feature Impact / Anomaly Attribution
                  </h4>
                  <div className="space-y-2">
                    {evaluationResult.feature_importance.map((f, i) => (
                      <div key={i} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-300 font-medium">{f.feature}</span>
                          <span className="font-mono text-cyan-400">{f.weight_pct}% weight</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-950 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
                            style={{ width: `${f.weight_pct}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{f.contribution}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Derived Thermodynamics Bar */}
                <div className="pt-3 border-t border-white/10 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-mono">Dew Point (Td)</span>
                    <span className="text-xs font-bold text-cyan-300 font-mono">
                      {evaluationResult.derived_metrics.dew_point}°C
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-mono">Heat Index (HI)</span>
                    <span className="text-xs font-bold text-amber-300 font-mono">
                      {evaluationResult.derived_metrics.heat_index}°C
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-950/60 border border-white/5">
                    <span className="text-[10px] text-slate-400 block font-mono">Vapor Deficit (VPD)</span>
                    <span className="text-xs font-bold text-emerald-300 font-mono">
                      {evaluationResult.derived_metrics.vapor_pressure_deficit} kPa
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full min-h-[420px] rounded-2xl border border-dashed border-white/15 bg-slate-900/40 p-8 flex flex-col items-center justify-center text-center">
                <div className="p-4 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mb-3">
                  <Cpu className="h-8 w-8" />
                </div>
                <h3 className="text-base font-bold text-white">Inference Engine Ready</h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4 leading-relaxed">
                  Select a test preset on the left or enter your own custom temperature, humidity, and barometric values, then click <strong>Evaluate Observation</strong>.
                </p>
                <button
                  onClick={() => applyPreset(presets[0])}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 font-semibold"
                >
                  <span>Load Diurnal Heatwave Preset</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 2: LIVE ANOMALY INJECTOR                         */}
      {/* ========================================================= */}
      {activeSubTab === 'injector' && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/85 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Zap className="h-5 w-5 text-amber-400" />
              <span>Direct Telemetry Anomaly Injection (Active Stream)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Inject an anomalous disturbance directly into a station's active observation feed. This updates the live charts, radar map, and emergency alerts table.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Station Selection */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Target Station</label>
              <select
                id="inject-station-select"
                value={injectStationId}
                onChange={(e) => setInjectStationId(Number(e.target.value))}
                className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                {stations.map((s) => (
                  <option key={s.location_id} value={s.location_id}>
                    Station #{s.location_id}: {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Anomaly Type */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Disturbance Pattern</label>
              <select
                id="inject-type-select"
                value={injectType}
                onChange={(e) => setInjectType(e.target.value)}
                className="w-full rounded-xl bg-slate-950 border border-white/10 px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
              >
                <option value="temperature_spike_drop">Temperature Spike / Surge</option>
                <option value="pressure_spike_drop">Pressure Drop (Barometric Plunge)</option>
                <option value="humidity_spike_drop">Humidity Desiccation / Jump</option>
                <option value="range_fault">Sensor Range Fault (Out-of-Bounds)</option>
                <option value="flatline_stuck">Sensor Stale / Flatline Stuck</option>
              </select>
            </div>

            {/* Delta Magnitude */}
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-300 font-medium">Magnitude (Δ Delta)</span>
                <span className="font-mono font-bold text-amber-400">±{injectDelta}</span>
              </div>
              <input
                type="range"
                min="5"
                max="30"
                step="1"
                value={injectDelta}
                onChange={(e) => setInjectDelta(parseFloat(e.target.value))}
                className="w-full accent-amber-500 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              id="btn-inject-custom-anomaly"
              onClick={handleInjectToLiveStream}
              disabled={isLoading}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-rose-600 hover:from-amber-400 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-amber-500/25 transition-all flex items-center space-x-2"
            >
              <Zap className="h-4 w-4 fill-current" />
              <span>Inject Anomaly into Live Stream</span>
            </button>

            <button
              id="btn-standard-sih-demo"
              onClick={onTriggerStandardDemo}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs border border-white/10 transition-all flex items-center space-x-2"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span>Trigger Standard Delhi Heat Spike Demo</span>
            </button>

            <button
              id="btn-reset-telemetry"
              onClick={onResetSimulations}
              disabled={isLoading}
              className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white font-semibold text-xs border border-white/5 transition-all flex items-center space-x-1.5 ml-auto"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Reset to Clean Baseline</span>
            </button>
          </div>

          {lastInjectedAlert && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white font-bold mb-0.5">Live Anomaly Triggered Successfully!</strong>
                <p>{lastInjectedAlert.explanation || lastInjectedAlert.recommendation}</p>
                <span className="text-[10px] text-amber-300/80 font-mono mt-1 block">
                  Incident ID: {lastInjectedAlert.id} | Severity: {lastInjectedAlert.severity} | Sensor: {lastInjectedAlert.sensor_type}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 3: BENCHMARK SUITE                                */}
      {/* ========================================================= */}
      {activeSubTab === 'benchmark' && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/85 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <BarChart3 className="h-5 w-5 text-emerald-400" />
                <span>Automated Meteorological Stress Benchmark (8 Test Vectors)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Runs rigorous climatological, physical, and sensor failure vectors to benchmark the model's accuracy, precision, recall, and latency.
              </p>
            </div>

            <button
              id="btn-run-benchmark-suite"
              onClick={handleRunBenchmark}
              disabled={isBenchmarking}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/25 transition-all flex items-center space-x-2 shrink-0"
            >
              {isBenchmarking ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Evaluating 8 Vectors...</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 fill-current" />
                  <span>Run Benchmark Suite</span>
                </>
              )}
            </button>
          </div>

          {benchmarkResult ? (
            <div className="space-y-6">
              {/* Scorecard KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Accuracy</span>
                  <span className="text-lg font-extrabold text-emerald-400 font-mono">
                    {benchmarkResult.accuracy_pct}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {benchmarkResult.passed}/{benchmarkResult.total_tests} passed
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Precision</span>
                  <span className="text-lg font-extrabold text-cyan-400 font-mono">
                    {benchmarkResult.precision_pct}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">True Positive Rate</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Recall</span>
                  <span className="text-lg font-extrabold text-indigo-400 font-mono">
                    {benchmarkResult.recall_pct}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Sensitivity</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 text-center">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">F1-Score</span>
                  <span className="text-lg font-extrabold text-purple-400 font-mono">
                    {benchmarkResult.f1_score_pct}%
                  </span>
                  <span className="text-[10px] text-slate-500 block">Harmonic Mean</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-950/70 border border-white/10 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Avg Latency</span>
                  <span className="text-lg font-extrabold text-amber-400 font-mono">
                    {benchmarkResult.avg_latency_ms} ms
                  </span>
                  <span className="text-[10px] text-slate-500 block">Per observation</span>
                </div>
              </div>

              {/* Detailed Test Vectors Table */}
              <div className="overflow-x-auto rounded-xl border border-white/10 bg-slate-950/50">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono text-[10px] border-b border-white/10">
                    <tr>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Vector ID & Name</th>
                      <th className="px-4 py-3">Domain</th>
                      <th className="px-4 py-3">Expected</th>
                      <th className="px-4 py-3">Predicted</th>
                      <th className="px-4 py-3">Confidence</th>
                      <th className="px-4 py-3">Latency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {benchmarkResult.tests.map((test) => (
                      <tr key={test.id} className="hover:bg-slate-900/50 transition-colors">
                        <td className="px-4 py-3">
                          {test.passed ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-400 font-semibold">
                              <CheckCircle2 className="h-4 w-4" />
                              <span>PASS</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center space-x-1 text-rose-400 font-semibold">
                              <AlertTriangle className="h-4 w-4" />
                              <span>FAIL</span>
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <strong className="text-white block">{test.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">{test.id}</span>
                        </td>
                        <td className="px-4 py-3 text-slate-300">{test.category}</td>
                        <td className="px-4 py-3 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${test.expected_anomaly ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {test.expected_anomaly ? 'ANOMALY' : 'NOMINAL'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono">
                          <span className={`px-2 py-0.5 rounded text-[10px] ${test.predicted_anomaly ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                            {test.predicted_anomaly ? 'ANOMALY' : 'NOMINAL'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-200">{test.confidence}%</td>
                        <td className="px-4 py-3 font-mono text-cyan-400">{test.latency_ms} ms</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl border border-dashed border-white/15 text-center bg-slate-950/40">
              <p className="text-xs text-slate-400 mb-3">
                Click <strong>Run Benchmark Suite</strong> above to evaluate the 8 standard stress vectors.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ========================================================= */}
      {/* SUB-TAB 4: PYTHON BACKEND SOURCE CODE                    */}
      {/* ========================================================= */}
      {activeSubTab === 'python' && (
        <div className="rounded-2xl border border-white/10 bg-slate-900/85 p-6 backdrop-blur-xl shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center space-x-2">
                <Terminal className="h-5 w-5 text-indigo-400" />
                <span>Python Backend Implementation (FastAPI + Scikit-Learn)</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Full production Python code ready to run locally, on an AWS server, or in an edge container.
              </p>
            </div>

            <button
              onClick={() => copyToClipboard(pythonSnippet, 'quickstart')}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-white/10 flex items-center space-x-1.5 transition-all shrink-0"
            >
              {copiedCode === 'quickstart' ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedCode === 'quickstart' ? 'Copied Code!' : 'Copy Python Snippet'}</span>
            </button>
          </div>

          {/* Quickstart Card */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/5">
              <span className="text-xs font-mono text-cyan-400">quickstart.py</span>
              <span className="text-[10px] text-slate-500 font-mono">Python 3.9+</span>
            </div>
            <pre className="text-xs font-mono text-slate-300 overflow-x-auto p-2 leading-relaxed">
              {pythonSnippet}
            </pre>
          </div>

          {/* How to Run Locally */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300">
              How to Run the Python Engine Locally
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                <strong className="text-white block font-semibold">1. CLI Runner (No Server Required)</strong>
                <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-emerald-400 space-y-1">
                  <div># Run CLI stress test</div>
                  <div>python python_backend/skyguard_engine.py --temp 35.5 --rh 40 --press 1016</div>
                  <div className="mt-2 text-slate-400"># Run benchmark suite</div>
                  <div>python python_backend/skyguard_engine.py --benchmark</div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-white/5 space-y-2">
                <strong className="text-white block font-semibold">2. Run FastAPI Microservice</strong>
                <div className="p-2.5 rounded-lg bg-black/60 font-mono text-[11px] text-cyan-400 space-y-1">
                  <div>pip install fastapi uvicorn scikit-learn numpy scipy</div>
                  <div>cd python_backend</div>
                  <div>uvicorn app:app --host 0.0.0.0 --port 8000 --reload</div>
                </div>
                <p className="text-[11px] text-slate-400">
                  Interactive Swagger API docs available at <code className="text-cyan-300">http://localhost:8000/docs</code>.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
