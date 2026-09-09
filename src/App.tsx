import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { StationSelector } from './components/StationSelector';
import { TelemetryCards } from './components/TelemetryCards';
import { TelemetryChart } from './components/TelemetryChart';
import { AlertsFeed } from './components/AlertsFeed';
import { AnomalySimulator } from './components/AnomalySimulator';
import { ModelTestingWorkbench } from './components/ModelTestingWorkbench';
import { SensorHealthMatrix } from './components/SensorHealthMatrix';
import { StationMap } from './components/StationMap';
import { DiurnalAnalytics } from './components/DiurnalAnalytics';
import { StationComparison } from './components/StationComparison';
import { ApiExplorerModal } from './components/ApiExplorerModal';
import { CloudyBackground, CloudMood, CloudSpeed } from './components/CloudyBackground';
import { Station, WeatherRecord, AlertsResponse, StationHealthSummary, AnomalyAlert } from './types';
import { Layers, Activity, AlertTriangle, ShieldCheck, SunMedium, Columns3, Compass, Cloud, FlaskConical } from 'lucide-react';

export const App: React.FC = () => {
  const [stations, setStations] = useState<Station[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<number | null>(0);
  const [period, setPeriod] = useState<'24h' | '7d' | '30d' | 'all'>('24h');
  const [weatherRecords, setWeatherRecords] = useState<WeatherRecord[]>([]);
  const [alertsData, setAlertsData] = useState<AlertsResponse | null>(null);
  const [healthBreakdown, setHealthBreakdown] = useState<StationHealthSummary[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isApiModalOpen, setIsApiModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'diurnal' | 'compare' | 'simulator' | 'testlab' | 'health'>('dashboard');

  // Cloud atmosphere background state (with localStorage recall)
  const [cloudMood, setCloudMood] = useState<CloudMood>(() => {
    return (localStorage.getItem('skyguard_cloud_mood') as CloudMood) || 'day';
  });
  const [cloudSpeed, setCloudSpeed] = useState<CloudSpeed>(() => {
    return (localStorage.getItem('skyguard_cloud_speed') as CloudSpeed) || 'normal';
  });

  const handleMoodChange = (mood: CloudMood) => {
    setCloudMood(mood);
    localStorage.setItem('skyguard_cloud_mood', mood);
  };

  const handleSpeedChange = (speed: CloudSpeed) => {
    setCloudSpeed(speed);
    localStorage.setItem('skyguard_cloud_speed', speed);
  };

  // Fetch all initial and recurring telemetry data
  const fetchData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Stations
      const stationsRes = await fetch('/api/stations');
      if (stationsRes.ok) {
        const sJson = await stationsRes.json();
        setStations(sJson.stations || []);
      }

      // 2. Alerts & summary
      const alertsUrl = selectedStationId !== null
        ? `/api/alerts?location_id=${selectedStationId}`
        : '/api/alerts';
      const alertsRes = await fetch(alertsUrl);
      if (alertsRes.ok) {
        const aJson = await alertsRes.json();
        setAlertsData(aJson);
      }

      // 3. Weather telemetry records for selected station and period
      let limit = 40;
      if (period === '7d') limit = 168;
      else if (period === '30d') limit = 360;
      else if (period === 'all') limit = 600;

      const weatherUrl = selectedStationId !== null
        ? `/api/weather?location_id=${selectedStationId}&period=${period}&limit=${limit}`
        : `/api/weather?period=${period}&limit=${limit}`;
      const weatherRes = await fetch(weatherUrl);
      if (weatherRes.ok) {
        const wJson = await weatherRes.json();
        setWeatherRecords(wJson.data || []);
      }

      // 4. Sensor health
      const healthRes = await fetch('/api/sensor-health');
      if (healthRes.ok) {
        const hJson = await healthRes.json();
        setHealthBreakdown(hJson.stations || []);
      }
    } catch (err) {
      console.error('Failed to fetch SkyGuard AI telemetry:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [selectedStationId, period]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Standard SIH Demo trigger (switches to Station 0 & surveillance view so user directly sees the spike)
  const handleTriggerStandardDemo = async (stayOnTab?: boolean) => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/simulate-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      setSelectedStationId(0);
      if (!stayOnTab) {
        setActiveTab('dashboard');
      }
      await fetchData();
      return data;
    } catch (err) {
      console.error('Failed standard demo:', err);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Custom anomaly injection
  const handleInjectCustom = async (payload: { location_id: number; type: string; delta: number }, stayOnTab?: boolean) => {
    setIsRefreshing(true);
    try {
      const res = await fetch('/api/inject-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setSelectedStationId(payload.location_id);
      if (!stayOnTab) {
        setActiveTab('dashboard');
      }
      await fetchData();
      return data;
    } catch (err) {
      console.error('Failed custom injection:', err);
      return null;
    } finally {
      setIsRefreshing(false);
    }
  };

  // Reset simulations
  const handleResetSimulations = async () => {
    setIsRefreshing(true);
    try {
      await fetch('/api/reset-data', { method: 'POST' });
      await fetchData();
    } catch (err) {
      console.error('Failed to reset simulations:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-clean alert
  const handleAutoCleanAlert = async (alertId: string, notes?: string) => {
    setIsRefreshing(true);
    try {
      await fetch('/api/alerts/clean', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId, notes })
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to auto-clean alert:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Incident triage update
  const handleTriageUpdate = async (alertId: string, status: AnomalyAlert['triage_status'], notes?: string) => {
    try {
      await fetch('/api/alerts/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: alertId, status, notes })
      });
      await fetchData();
    } catch (err) {
      console.error('Failed to update alert triage status:', err);
    }
  };

  const currentStation = stations.find((s) => s.location_id === selectedStationId);
  const latestRecord = weatherRecords.length > 0 ? weatherRecords[weatherRecords.length - 1] : undefined;
  const isAnomalyCurrentlyActive = latestRecord?.is_anomaly ?? (alertsData ? alertsData.alerts.length > 0 : false);

  // Station health mapping for maps and quick icons
  const stationHealthMap: Record<number, 'Healthy' | 'Warning' | 'Critical'> = {};
  healthBreakdown.forEach((h) => {
    stationHealthMap[h.location_id] = h.health_status;
  });

  return (
    <div id="skyguard-app-root" className="relative min-h-screen text-slate-100 flex flex-col selection:bg-cyan-500/30">
      {/* Dynamic Animated Cloudy / Fun Atmospheric Sky Background */}
      <CloudyBackground
        mood={cloudMood}
        onMoodChange={handleMoodChange}
        speed={cloudSpeed}
        onSpeedChange={handleSpeedChange}
        showControls={true}
      />

      {/* Top Navigation Bar */}
      <Navbar
        summary={alertsData?.summary}
        isRefreshing={isRefreshing}
        onRefresh={fetchData}
        onOpenApiModal={() => setIsApiModalOpen(true)}
        selectedStationId={selectedStationId}
        cloudMood={cloudMood}
        onMoodChange={handleMoodChange}
        cloudSpeed={cloudSpeed}
        onSpeedChange={handleSpeedChange}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 border-b border-white/10 pb-3 mb-6 overflow-x-auto">
          <button
            id="tab-view-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'dashboard'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Activity className="h-4 w-4" />
            <span>Station Surveillance</span>
          </button>

          <button
            id="tab-view-map"
            onClick={() => setActiveTab('map')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'map'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Compass className="h-4 w-4" />
            <span>Geospatial Radar Map</span>
          </button>

          <button
            id="tab-view-diurnal"
            onClick={() => setActiveTab('diurnal')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'diurnal'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <SunMedium className="h-4 w-4" />
            <span>Diurnal Waves & Climatology</span>
          </button>

          <button
            id="tab-view-compare"
            onClick={() => setActiveTab('compare')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'compare'
                ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <Columns3 className="h-4 w-4" />
            <span>Synoptic Multi-Station Compare</span>
          </button>

          <button
            id="tab-view-simulator"
            onClick={() => setActiveTab('simulator')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'simulator'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>Anomaly Studio & Threshold Tuner</span>
          </button>

          <button
            id="tab-view-testlab"
            onClick={() => setActiveTab('testlab')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'testlab'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <FlaskConical className="h-4 w-4 text-purple-400" />
            <span>Model Testing & Python Lab</span>
          </button>

          <button
            id="tab-view-health"
            onClick={() => setActiveTab('health')}
            className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'health'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Fleet Quality Matrix (10 Nodes)</span>
          </button>
        </div>

        {/* Station Network Selector (Always accessible for rapid switching) */}
        <StationSelector
          stations={stations}
          selectedStationId={selectedStationId}
          onSelectStation={(id) => setSelectedStationId(id)}
        />

        {/* Tab 1: Station Surveillance */}
        {activeTab === 'dashboard' && (
          <>
            {/* Real-time Telemetry Metrics Cards */}
            <TelemetryCards
              latestRecord={latestRecord}
              stationName={currentStation?.name}
              isAnomaly={isAnomalyCurrentlyActive}
            />

            {/* Time Series Graph with Horizons & CSV Export */}
            <TelemetryChart
              records={weatherRecords}
              stationName={currentStation?.name || 'All Stations'}
              selectedStationId={selectedStationId}
              period={period}
              onPeriodChange={(p) => setPeriod(p)}
            />

            {/* Live Alerts Stream with Incident Triage */}
            <AlertsFeed
              alerts={alertsData?.alerts || []}
              onSelectStation={(id) => setSelectedStationId(id)}
              onTriageUpdate={handleTriageUpdate}
              onAutoCleanAlert={handleAutoCleanAlert}
            />
          </>
        )}

        {/* Tab 2: Geospatial Radar Map */}
        {activeTab === 'map' && (
          <>
            <StationMap
              stations={stations}
              selectedStationId={selectedStationId}
              onSelectStation={(id) => {
                setSelectedStationId(id);
                setActiveTab('dashboard');
              }}
              stationHealthMap={stationHealthMap}
            />

            <AlertsFeed
              alerts={alertsData?.alerts || []}
              onSelectStation={(id) => setSelectedStationId(id)}
              onTriageUpdate={handleTriageUpdate}
              onAutoCleanAlert={handleAutoCleanAlert}
            />
          </>
        )}

        {/* Tab 3: Diurnal Waves & Climatology */}
        {activeTab === 'diurnal' && (
          <DiurnalAnalytics
            selectedStationId={selectedStationId}
            stations={stations}
          />
        )}

        {/* Tab 4: Synoptic Multi-Station Compare */}
        {activeTab === 'compare' && (
          <StationComparison
            stations={stations}
          />
        )}

        {/* Tab 5: Anomaly Studio & Threshold Tuner */}
        {activeTab === 'simulator' && (
          <>
            <AnomalySimulator
              stations={stations}
              onTriggerStandardDemo={handleTriggerStandardDemo}
              onInjectCustom={handleInjectCustom}
              onResetSimulations={handleResetSimulations}
              onAutoCleanAlert={handleAutoCleanAlert}
              onSelectStation={(id) => setSelectedStationId(id)}
              onNavigateToTab={(tab) => setActiveTab(tab as any)}
              isLoading={isRefreshing}
              onRefreshData={fetchData}
            />

            <AlertsFeed
              alerts={alertsData?.alerts || []}
              onSelectStation={(id) => setSelectedStationId(id)}
              onTriageUpdate={handleTriageUpdate}
              onAutoCleanAlert={handleAutoCleanAlert}
            />
          </>
        )}

        {/* Tab 6: Model Testing & Benchmark Lab */}
        {activeTab === 'testlab' && (
          <ModelTestingWorkbench
            stations={stations}
            onTriggerStandardDemo={handleTriggerStandardDemo}
            onInjectCustom={handleInjectCustom}
            onResetSimulations={handleResetSimulations}
            isLoading={isRefreshing}
            onRefreshData={fetchData}
          />
        )}

        {/* Tab 7: Fleet Sensor Health Matrix */}
        {activeTab === 'health' && (
          <SensorHealthMatrix
            healthList={healthBreakdown}
            onSelectStation={(id) => {
              setSelectedStationId(id);
              setActiveTab('dashboard');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-slate-950/80 backdrop-blur-md py-4 px-4 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Cloud className="h-4 w-4 text-sky-400" />
            <span>SkyGuard AI • Automated Weather Station Quality Control System</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">
            Real Meteorological Pipeline • 87,600 Hourly Sensor Packets
          </span>
        </div>
      </footer>

      {/* REST API Explorer Modal */}
      <ApiExplorerModal
        isOpen={isApiModalOpen}
        onClose={() => setIsApiModalOpen(false)}
      />
    </div>
  );
};

export default App;
