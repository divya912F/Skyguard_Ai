import React, { useState, useEffect } from 'react';
import {
  Cpu,
  PlusCircle,
  RotateCcw,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Activity,
  Droplets,
  Gauge,
  Thermometer,
  Wind,
  Info,
  Layers,
  Wrench,
  Flame,
  Snowflake,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import { CustomStationData, CustomStationReading, Station } from '../types';

interface CustomStationDemoProps {
  onStationSelected?: (stationId: number) => void;
  onRefreshParent?: () => void;
}

export const CustomStationDemo: React.FC<CustomStationDemoProps> = ({
  onStationSelected,
  onRefreshParent
}) => {
  const [customStations, setCustomStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<number>(101);
  const [stationData, setStationData] = useState<{
    station: Station;
    readings: CustomStationReading[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Inputs
  const [tempInput, setTempInput] = useState<number>(24.5);
  const [humInput, setHumInput] = useState<number>(62);
  const [pressInput, setPressInput] = useState<number>(998.5);
  const [windInput, setWindInput] = useState<number>(6.5);

  // New Station Modal / Inline
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newStationName, setNewStationName] = useState('');
  const [newStationCity, setNewStationCity] = useState('');
  const [newStationState, setNewStationState] = useState('');
  const [newStationElev, setNewStationElev] = useState(560);
  const [newStationSensor, setNewStationSensor] = useState('Vaisala AWS310 Precision Agro-Met');

  // Load custom stations list
  const fetchCustomStations = async () => {
    try {
      const res = await fetch('/api/custom-stations');
      if (res.ok) {
        const json = await res.json();
        setCustomStations(json.stations || []);
        if (json.stations && json.stations.length > 0 && !selectedStationId) {
          setSelectedStationId(json.stations[0].location_id);
        }
      }
    } catch (e) {
      console.error('Failed to load custom stations:', e);
    }
  };

  // Load selected station data
  const fetchStationDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/custom-stations/${id}`);
      if (res.ok) {
        const json = await res.json();
        setStationData({
          station: json.station,
          readings: json.readings || []
        });

        // Pre-fill next input based on previous reading or default
        const readings: CustomStationReading[] = json.readings || [];
        if (readings.length > 0) {
          const last = readings[readings.length - 1];
          // Set sensible defaults for next reading
          setTempInput(parseFloat((last.temperature + 0.3).toFixed(1)));
          setHumInput(Math.max(20, Math.min(95, Math.round(last.relative_humidity - 2))));
          setPressInput(parseFloat((last.surface_pressure - 0.2).toFixed(1)));
          setWindInput(parseFloat((last.wind_speed_kmh || 5.5).toFixed(1)));
        } else {
          setTempInput(24.5);
          setHumInput(62);
          setPressInput(998.5);
          setWindInput(6.5);
        }
      }
    } catch (e) {
      console.error('Failed to load station details:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomStations();
  }, []);

  useEffect(() => {
    if (selectedStationId) {
      fetchStationDetails(selectedStationId);
    }
  }, [selectedStationId]);

  // Create new station
  const handleCreateStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/custom-stations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newStationName || 'Custom Agro-Met AWS',
          city: newStationCity || 'Pune',
          state: newStationState || 'Maharashtra',
          elevation_m: Number(newStationElev),
          sensor_type: newStationSensor
        })
      });
      if (res.ok) {
        const json = await res.json();
        setShowCreateForm(false);
        setNewStationName('');
        await fetchCustomStations();
        setSelectedStationId(json.station.location_id);
        if (onRefreshParent) onRefreshParent();
      }
    } catch (e) {
      console.error('Failed to create station:', e);
    }
  };

  // Reset station
  const handleResetStation = async () => {
    if (!selectedStationId) return;
    try {
      const res = await fetch(`/api/custom-stations/${selectedStationId}/reset`, {
        method: 'POST'
      });
      if (res.ok) {
        await fetchStationDetails(selectedStationId);
        await fetchCustomStations();
        if (onRefreshParent) onRefreshParent();
      }
    } catch (e) {
      console.error('Failed to reset station:', e);
    }
  };

  // Submit reading
  const handleSubmitReading = async () => {
    if (!selectedStationId) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/custom-stations/${selectedStationId}/readings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          temperature: tempInput,
          relative_humidity: humInput,
          surface_pressure: pressInput,
          wind_speed_kmh: windInput
        })
      });
      if (res.ok) {
        await fetchStationDetails(selectedStationId);
        await fetchCustomStations();
        if (onRefreshParent) onRefreshParent();
      }
    } catch (e) {
      console.error('Failed to submit reading:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Apply Presets (Available for Reading 3+)
  const applyPreset = (type: 'heat_surge' | 'psychro' | 'baro_plunge' | 'flatline' | 'range_breach' | 'nominal') => {
    const last = stationData?.readings && stationData.readings.length > 0
      ? stationData.readings[stationData.readings.length - 1]
      : { temperature: 24.5, relative_humidity: 60, surface_pressure: 998.0 };

    if (type === 'heat_surge') {
      // +10.2°C thermal jump
      setTempInput(parseFloat((last.temperature + 10.2).toFixed(1)));
      setHumInput(Math.max(20, Math.round(last.relative_humidity - 15)));
      setPressInput(last.surface_pressure);
      setWindInput(12.4);
    } else if (type === 'psychro') {
      // Impossible supersaturation (RH 100% with high temp or forced dew point violation)
      setTempInput(parseFloat(last.temperature.toFixed(1)));
      setHumInput(100);
      setPressInput(last.surface_pressure);
      setWindInput(2.1);
    } else if (type === 'baro_plunge') {
      // -7.8 hPa barometric drop in 1 hour
      setTempInput(last.temperature);
      setHumInput(last.relative_humidity);
      setPressInput(parseFloat((last.surface_pressure - 7.8).toFixed(1)));
      setWindInput(18.2);
    } else if (type === 'flatline') {
      // Exactly identical values (transducer deadlock)
      setTempInput(last.temperature);
      setHumInput(last.relative_humidity);
      setPressInput(last.surface_pressure);
      setWindInput(0.0);
    } else if (type === 'range_breach') {
      // Physical breach: 61.4°C
      setTempInput(61.4);
      setHumInput(18);
      setPressInput(last.surface_pressure);
      setWindInput(4.5);
    } else if (type === 'nominal') {
      // Smooth diurnal change
      setTempInput(parseFloat((last.temperature + 0.8).toFixed(1)));
      setHumInput(Math.max(20, Math.min(95, Math.round(last.relative_humidity - 3))));
      setPressInput(parseFloat((last.surface_pressure - 0.4).toFixed(1)));
      setWindInput(7.2);
    }
  };

  const readings = stationData?.readings || [];
  const readingCount = readings.length;
  const nextReadingNumber = readingCount + 1;
  const isArmed = readingCount >= 2;
  const latestReading = readings.length > 0 ? readings[readings.length - 1] : null;

  return (
    <div id="custom-station-demo-root" className="space-y-6">
      {/* Top Header Card */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 sm:p-6 backdrop-blur-md shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 mt-0.5 shadow-inner">
              <Cpu className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold text-slate-100">
                  Custom AWS Station & Anomaly Detection Sandbox
                </h2>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-0.5 text-xs font-semibold text-amber-300 border border-amber-500/30">
                  Interactive Demo Mode
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-500/15 px-2.5 py-0.5 text-[11px] font-mono font-medium text-cyan-300 border border-cyan-500/30">
                  Isolated from Baseline IMD Network
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
                <strong className="text-amber-300">Calibration Protocol:</strong> The model maintains strict standby during{' '}
                <span className="underline decoration-amber-400 font-semibold">Reading #1 and Reading #2</span> to establish ambient reference envelopes and temporal derivatives without raising false flags. From{' '}
                <span className="text-emerald-400 font-semibold">Reading #3 onwards</span>, the 5-layer physics & statistical anomaly engine is armed and immediately diagnoses faults.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="btn-open-create-station"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
            >
              <PlusCircle className="h-4 w-4" />
              <span>{showCreateForm ? 'Close Form' : 'New Custom Station'}</span>
            </button>

            <button
              id="btn-reset-station-calibration"
              onClick={handleResetStation}
              className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-slate-300 border border-white/10 hover:bg-slate-700 hover:text-white transition-all"
              title="Clear all readings to start the 2-reading calibration cycle from reading 1"
            >
              <RotateCcw className="h-4 w-4 text-amber-400" />
              <span>Reset to Reading #1</span>
            </button>
          </div>
        </div>

        {/* Station Selector Bar */}
        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 mr-2">
            Active Station:
          </span>
          {customStations.map((st) => (
            <button
              key={st.location_id}
              onClick={() => setSelectedStationId(st.location_id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 ${
                selectedStationId === st.location_id
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/25'
                  : 'bg-slate-800/80 text-slate-300 border border-white/10 hover:bg-slate-700'
              }`}
            >
              <span>{st.name}</span>
              <span className="text-[10px] opacity-75 font-mono">#{st.location_id}</span>
            </button>
          ))}
        </div>

        {/* Create Station Inline Form */}
        {showCreateForm && (
          <form onSubmit={handleCreateStation} className="mt-5 p-4 rounded-xl bg-slate-950/70 border border-cyan-500/30 space-y-3">
            <h3 className="text-xs font-bold uppercase text-cyan-300 tracking-wider">
              Configure New Custom Automated Weather Station (AWS)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">Station Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pune Precision Agro-Met AWS"
                  value={newStationName}
                  onChange={(e) => setNewStationName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">City / District</label>
                <input
                  type="text"
                  placeholder="e.g. Pune"
                  value={newStationCity}
                  onChange={(e) => setNewStationCity(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">State</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra"
                  value={newStationState}
                  onChange={(e) => setNewStationState(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-400 mb-1 font-medium">Elevation (meters)</label>
                <input
                  type="number"
                  value={newStationElev}
                  onChange={(e) => setNewStationElev(Number(e.target.value))}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/15 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400"
              >
                Deploy Custom AWS
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Calibration Lifecycle Progress Tracker */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Layers className="h-4 w-4 text-cyan-400" />
            <span>Anomaly Model Calibration Stage</span>
          </h3>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
            readingCount === 0
              ? 'bg-slate-800 text-slate-400 border-white/10'
              : readingCount === 1
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
              : readingCount === 2
              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
              : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
          }`}>
            {readingCount === 0
              ? 'Awaiting Reading #1'
              : readingCount === 1
              ? 'Calibration Step 1 of 2 Complete'
              : readingCount === 2
              ? 'Calibration Complete — Model Armed!'
              : `Model Active (Observation #${readingCount})`}
          </span>
        </div>

        {/* 3 Step Trackers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1 */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            readingCount >= 1
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : nextReadingNumber === 1
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 ring-1 ring-amber-500/30'
              : 'bg-slate-950/40 border-white/5 text-slate-500'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold">1. Sensor Baseline</span>
              {readingCount >= 1 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              )}
            </div>
            <p className="text-[11px] opacity-80">
              Registers initial ambient values (T, RH, P). Anomaly model remains in <strong>STANDBY</strong> with zero alerts.
            </p>
          </div>

          {/* Step 2 */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            readingCount >= 2
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : nextReadingNumber === 2
              ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 ring-1 ring-amber-500/30'
              : 'bg-slate-950/40 border-white/5 text-slate-500'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold">2. Lock Rate Derivatives</span>
              {readingCount >= 2 ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              ) : nextReadingNumber === 2 ? (
                <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              ) : null}
            </div>
            <p className="text-[11px] opacity-80">
              Locks initial hourly step-rates (ΔT, ΔRH, ΔP). Model completes calibration and arms itself.
            </p>
          </div>

          {/* Step 3 */}
          <div className={`p-3.5 rounded-xl border transition-all ${
            readingCount >= 3
              ? 'bg-cyan-950/40 border-cyan-400/50 text-cyan-200 ring-1 ring-cyan-400/30'
              : nextReadingNumber >= 3
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-950/40 border-white/5 text-slate-500'
          }`}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold">3. Model Armed & Active</span>
              {readingCount >= 3 ? (
                <Zap className="h-4 w-4 text-cyan-400 animate-pulse" />
              ) : null}
            </div>
            <p className="text-[11px] opacity-80">
              Ultra-strong 5-layer physics & statistical model actively inspects every reading for anomalies.
            </p>
          </div>
        </div>
      </div>

      {/* Reading Submission & Interactive Workbench */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Reading Input Form (5 cols) */}
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">
                    Submit Reading #{nextReadingNumber}
                  </h3>
                  <span className="text-[11px] text-slate-400">
                    {nextReadingNumber <= 2
                      ? `Calibration Phase (${nextReadingNumber}/2) - Model in Standby`
                      : 'Model Armed - Anomaly Engine Active!'}
                  </span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                nextReadingNumber <= 2
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {nextReadingNumber <= 2 ? 'CALIBRATING' : 'MODEL ARMED'}
              </span>
            </div>

            {/* Input fields */}
            <div className="space-y-3.5">
              {/* Temperature */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 flex items-center gap-1 font-medium">
                    <Thermometer className="h-3.5 w-3.5 text-amber-400" />
                    Temperature (°C)
                  </span>
                  <span className="font-mono font-bold text-amber-300">{tempInput}°C</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={tempInput}
                  onChange={(e) => setTempInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Relative Humidity */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 flex items-center gap-1 font-medium">
                    <Droplets className="h-3.5 w-3.5 text-cyan-400" />
                    Relative Humidity (%)
                  </span>
                  <span className="font-mono font-bold text-cyan-300">{humInput}%</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="120"
                  value={humInput}
                  onChange={(e) => setHumInput(parseInt(e.target.value, 10) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Surface Pressure */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 flex items-center gap-1 font-medium">
                    <Gauge className="h-3.5 w-3.5 text-emerald-400" />
                    Surface Pressure (hPa)
                  </span>
                  <span className="font-mono font-bold text-emerald-300">{pressInput} hPa</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={pressInput}
                  onChange={(e) => setPressInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>

              {/* Wind Speed */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-300 flex items-center gap-1 font-medium">
                    <Wind className="h-3.5 w-3.5 text-indigo-400" />
                    Wind Speed (km/h)
                  </span>
                  <span className="font-mono font-bold text-indigo-300">{windInput} km/h</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  value={windInput}
                  onChange={(e) => setWindInput(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-white/15 text-sm text-white font-mono focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Presets Button Bar (Only shown for Reading 3+) */}
            {isArmed && (
              <div className="mt-4 pt-3 border-t border-white/10 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-400" />
                  Quick Anomaly Demonstration Presets:
                </span>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => applyPreset('heat_surge')}
                    className="p-1.5 rounded-lg bg-rose-950/40 border border-rose-500/30 text-rose-300 text-[11px] font-medium hover:bg-rose-900/50 text-left truncate flex items-center gap-1"
                    title="Extreme heat jump of +10.2°C in 1 hour"
                  >
                    <Flame className="h-3 w-3 shrink-0 text-rose-400" />
                    <span className="truncate">Thermal Surge (+10°C)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('psychro')}
                    className="p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium hover:bg-indigo-900/50 text-left truncate flex items-center gap-1"
                    title="Supersaturated humidity breaching Clausius-Clapeyron balance"
                  >
                    <Droplets className="h-3 w-3 shrink-0 text-indigo-400" />
                    <span className="truncate">Psychrometric Fault</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('baro_plunge')}
                    className="p-1.5 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 text-[11px] font-medium hover:bg-purple-900/50 text-left truncate flex items-center gap-1"
                    title="Sudden barometric plunge of -7.8 hPa"
                  >
                    <Gauge className="h-3 w-3 shrink-0 text-purple-400" />
                    <span className="truncate">Pressure Drop (-8 hPa)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('flatline')}
                    className="p-1.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-300 text-[11px] font-medium hover:bg-amber-900/50 text-left truncate flex items-center gap-1"
                    title="Frozen sensor with 0.00 micro-variance"
                  >
                    <Snowflake className="h-3 w-3 shrink-0 text-amber-400" />
                    <span className="truncate">Sensor Flatline (Frozen)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('range_breach')}
                    className="p-1.5 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-[11px] font-medium hover:bg-red-900/50 text-left truncate flex items-center gap-1"
                    title="Breaches physical boundary: 61.4°C"
                  >
                    <ShieldAlert className="h-3 w-3 shrink-0 text-red-400" />
                    <span className="truncate">Range Limit (61.4°C)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => applyPreset('nominal')}
                    className="p-1.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 text-[11px] font-medium hover:bg-emerald-900/50 text-left truncate flex items-center gap-1"
                    title="Smooth natural diurnal transition"
                  >
                    <CheckCircle2 className="h-3 w-3 shrink-0 text-emerald-400" />
                    <span className="truncate">Nominal Weather (+0.8°)</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 pt-3 border-t border-white/10">
            <button
              type="button"
              id="btn-submit-custom-reading"
              onClick={handleSubmitReading}
              disabled={isSubmitting}
              className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all shadow-lg ${
                nextReadingNumber <= 2
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20'
              } disabled:opacity-50`}
            >
              {isSubmitting ? (
                <span>Ingesting & Processing...</span>
              ) : (
                <>
                  <span>
                    {nextReadingNumber <= 2
                      ? `Ingest Calibration Reading #${nextReadingNumber} (Standby)`
                      : `Submit Reading #${nextReadingNumber} & Run Anomaly Engine`}
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Col: Diagnosis of Latest Submitted Reading (7 cols) */}
        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Latest Observation Quality Audit & Diagnostic</span>
              </h3>
              {latestReading && (
                <span className="text-[11px] text-slate-400 font-mono">
                  Reading #{latestReading.reading_number} ({latestReading.time.substring(11, 19)})
                </span>
              )}
            </div>

            {latestReading ? (
              <div className="space-y-4">
                {/* Primary Verdict Banner */}
                <div className={`p-4 rounded-xl border ${
                  latestReading.is_calibration_phase
                    ? 'bg-amber-950/40 border-amber-500/40 text-amber-200'
                    : latestReading.is_anomaly
                    ? 'bg-rose-950/40 border-rose-500/40 text-rose-200'
                    : 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        {latestReading.is_calibration_phase ? (
                          <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 text-amber-300 px-2 py-0.5 text-xs font-bold font-mono">
                            STANDBY CALIBRATION
                          </span>
                        ) : latestReading.is_anomaly ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-500/30 text-rose-300 px-2 py-0.5 text-xs font-bold font-mono border border-rose-500/50">
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
                            VERDICT: WRONG (ANOMALY DETECTED)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/30 text-emerald-300 px-2 py-0.5 text-xs font-bold font-mono border border-emerald-500/50">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                            VERDICT: RIGHT (100% NOMINAL)
                          </span>
                        )}

                        <span className="text-xs font-mono font-semibold">
                          Confidence: {latestReading.confidence}%
                        </span>
                      </div>

                      <h4 className="text-sm font-bold mt-2 text-white">
                        {latestReading.quality_advisory?.title || latestReading.explanation}
                      </h4>
                      <p className="text-xs mt-1 text-slate-300 leading-relaxed">
                        {latestReading.explanation}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="block text-[10px] uppercase tracking-wider text-slate-400">QC Flag</span>
                      <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                        latestReading.qc_flag === 'ERRONEOUS'
                          ? 'bg-red-500/30 text-red-300'
                          : latestReading.qc_flag === 'SUSPECT'
                          ? 'bg-amber-500/30 text-amber-300'
                          : 'bg-emerald-500/30 text-emerald-300'
                      }`}>
                        {latestReading.qc_flag}
                      </span>
                    </div>
                  </div>

                  {/* 1-Hour Step Rates */}
                  <div className="mt-3 pt-2.5 border-t border-white/10 grid grid-cols-3 gap-2 text-center text-xs font-mono">
                    <div className="bg-slate-900/60 p-1.5 rounded">
                      <span className="block text-[9px] uppercase text-slate-400">ΔT (1-Hour)</span>
                      <span className={`font-bold ${Math.abs(latestReading.temperature_change || 0) >= 6 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {(latestReading.temperature_change || 0) >= 0 ? '+' : ''}{latestReading.temperature_change || 0}°C
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded">
                      <span className="block text-[9px] uppercase text-slate-400">ΔRH (1-Hour)</span>
                      <span className={`font-bold ${Math.abs(latestReading.humidity_change || 0) >= 20 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {(latestReading.humidity_change || 0) >= 0 ? '+' : ''}{latestReading.humidity_change || 0}%
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-1.5 rounded">
                      <span className="block text-[9px] uppercase text-slate-400">ΔP (1-Hour)</span>
                      <span className={`font-bold ${Math.abs(latestReading.pressure_change || 0) >= 3.5 ? 'text-rose-400' : 'text-slate-200'}`}>
                        {(latestReading.pressure_change || 0) >= 0 ? '+' : ''}{latestReading.pressure_change || 0} hPa
                      </span>
                    </div>
                  </div>
                </div>

                {/* 5-Layer Verification Checks Table */}
                {latestReading.verification_checks && latestReading.verification_checks.length > 0 && (
                  <div className="p-3.5 rounded-xl bg-slate-950/60 border border-white/10">
                    <h5 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Layers className="h-3.5 w-3.5 text-cyan-400" />
                      5-Layer Meteorological QC Verification Stack
                    </h5>
                    <div className="space-y-1.5">
                      {latestReading.verification_checks.map((check, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-900/80 border border-white/5"
                        >
                          <div className="flex items-center space-x-2 truncate">
                            {check.passed ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                            )}
                            <span className="font-medium text-slate-200 truncate">{check.name}</span>
                          </div>
                          <span className={`text-[11px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                            check.passed ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                          }`}>
                            {check.passed ? 'PASSED' : 'BREACH'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Engineering Directives */}
                {latestReading.quality_advisory && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/50 border border-white/5">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Physics Rule Applied</span>
                      <p className="text-slate-200 mt-0.5 text-[11px]">
                        {latestReading.quality_advisory.physics_rule}
                      </p>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/50 border border-white/5">
                      <span className="block text-[10px] uppercase font-bold text-slate-400">Field Maintenance Directive</span>
                      <p className="text-slate-200 mt-0.5 text-[11px]">
                        {latestReading.quality_advisory.action_directive}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-center text-slate-500 border border-dashed border-white/10 rounded-xl p-6">
                <Cpu className="h-10 w-10 text-slate-600 mb-3 animate-pulse" />
                <p className="text-sm font-medium text-slate-300">Awaiting First Observation</p>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Submit Reading #1 using the form on the left. The model will register ambient reference baselines.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historical Ledger of Readings */}
      <div className="rounded-2xl border border-white/10 bg-slate-900/80 p-5 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Activity className="h-4 w-4 text-cyan-400" />
            <span>Telemetry Ledger & Calibration History ({stationData?.station.name || 'Station #101'})</span>
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {readings.length} Total Observations Logged
          </span>
        </div>

        {readings.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Temp (°C)</th>
                  <th className="py-2.5 px-3">RH (%)</th>
                  <th className="py-2.5 px-3">Pressure</th>
                  <th className="py-2.5 px-3">ΔT / hr</th>
                  <th className="py-2.5 px-3">Model State</th>
                  <th className="py-2.5 px-3">Verdict</th>
                  <th className="py-2.5 px-3">Diagnosis</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono">
                {readings.map((r) => (
                  <tr key={r.reading_number} className="hover:bg-white/5 transition-colors">
                    <td className="py-2.5 px-3 font-bold text-slate-300">#{r.reading_number}</td>
                    <td className="py-2.5 px-3 text-slate-400">{r.time.substring(11, 19)}</td>
                    <td className="py-2.5 px-3 text-amber-300 font-bold">{r.temperature.toFixed(1)}°C</td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">{r.relative_humidity}%</td>
                    <td className="py-2.5 px-3 text-emerald-300 font-bold">{r.surface_pressure.toFixed(1)}</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {r.temperature_change !== undefined ? `${r.temperature_change >= 0 ? '+' : ''}${r.temperature_change}°C` : '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.is_calibration_phase ? (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          CALIBRATION {r.reading_number}/2
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          ACTIVE EVAL
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3">
                      {r.row_verdict === 'WRONG' ? (
                        <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[11px]">
                          <AlertTriangle className="h-3 w-3" />
                          WRONG
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <CheckCircle2 className="h-3 w-3" />
                          RIGHT
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans text-slate-300 truncate max-w-xs" title={r.explanation}>
                      {r.explanation}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-slate-500 text-xs">
            No readings submitted for this custom station yet. Use the form above to begin calibration.
          </div>
        )}
      </div>
    </div>
  );
};
