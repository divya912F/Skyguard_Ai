import React, { useState } from 'react';
import { CloudLightning, Activity, Radio, RefreshCw, Terminal, ShieldAlert, Download, Cloud, Sun, Sunset, Sparkles, Wind, Sunrise, Compass } from 'lucide-react';
import { AlertsResponse } from '../types';
import { CloudMood, CloudSpeed } from './CloudyBackground';

interface NavbarProps {
  summary?: AlertsResponse['summary'];
  isRefreshing: boolean;
  onRefresh: () => void;
  onOpenApiModal: () => void;
  selectedStationId?: number | null;
  cloudMood: CloudMood;
  onMoodChange: (mood: CloudMood) => void;
  cloudSpeed: CloudSpeed;
  onSpeedChange: (speed: CloudSpeed) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  summary,
  isRefreshing,
  onRefresh,
  onOpenApiModal,
  selectedStationId,
  cloudMood,
  onMoodChange,
  cloudSpeed,
  onSpeedChange,
}) => {
  const [showMoodDropdown, setShowMoodDropdown] = useState<boolean>(false);

  const handleExportAllCsv = () => {
    const url = selectedStationId !== null && selectedStationId !== undefined
      ? `/api/export-csv?location_id=${selectedStationId}`
      : '/api/export-csv';
    window.location.href = url;
  };

  const getMoodIcon = (m: CloudMood) => {
    switch (m) {
      case 'day':
        return <Sun className="h-3.5 w-3.5 text-amber-400" />;
      case 'sunrise':
        return <Sunrise className="h-3.5 w-3.5 text-amber-300" />;
      case 'sunset':
        return <Sunset className="h-3.5 w-3.5 text-rose-400" />;
      case 'storm':
        return <CloudLightning className="h-3.5 w-3.5 text-cyan-400" />;
      case 'nebula':
        return <Compass className="h-3.5 w-3.5 text-fuchsia-400" />;
      case 'aurora':
      default:
        return <Sparkles className="h-3.5 w-3.5 text-emerald-400" />;
    }
  };

  return (
    <header id="skyguard-navbar" className="sticky top-0 z-40 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-500/20">
            <CloudLightning className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-lg font-black tracking-tight text-white">SkyGuard AI</span>
              <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 text-xs font-semibold text-cyan-400 border border-cyan-500/20">
                v2.0 Met-QC
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">Automated Weather Station (AWS) Anomaly Detection</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {summary && (
            <div className="hidden lg:flex items-center space-x-3 border-r border-white/10 pr-3">
              <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
                <span className="text-slate-400">Total:</span>
                <span className="font-semibold text-white">{summary.total_readings.toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs text-slate-300">
                <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
                <span className="text-slate-400">Fleet Anomalies:</span>
                <span className={`font-semibold ${summary.anomalies > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {summary.anomalies.toLocaleString()} ({summary.anomaly_percentage}%)
                </span>
              </div>
              <div className="hidden xl:flex items-center space-x-1 text-[11px] font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 px-2.5 py-0.5 rounded-full">
                <span>1-Yr Fleet QC: 3,504 / 87.6k (4.00%)</span>
              </div>
              <div className="flex items-center space-x-1.5 text-xs">
                <Activity className="h-3.5 w-3.5 text-cyan-400" />
                <span className="text-slate-400">Health:</span>
                <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                  summary.station_health === 'Healthy'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : summary.station_health === 'Warning'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  {summary.station_health}
                </span>
              </div>
            </div>
          )}

          {/* Cloud Mood Switcher Button */}
          <div className="relative">
            <button
              id="btn-nav-cloud-mood"
              onClick={() => setShowMoodDropdown(!showMoodDropdown)}
              className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 transition-colors hover:bg-slate-800 hover:border-cyan-500/40"
              title="Change Cloud & Sky Theme"
            >
              {getMoodIcon(cloudMood)}
              <span className="capitalize hidden sm:inline">{cloudMood} Sky</span>
            </button>

            {showMoodDropdown && (
              <div
                className="absolute right-0 mt-2 w-48 rounded-2xl bg-slate-950/95 border border-white/15 p-2 shadow-2xl backdrop-blur-xl z-50 text-xs"
                onMouseLeave={() => setShowMoodDropdown(false)}
              >
                <div className="px-2 py-1 text-[10.5px] uppercase font-bold text-slate-400 tracking-wider">
                  Atmospheric Sky Mood
                </div>
                <div className="space-y-1 mt-1">
                  <button
                    onClick={() => { onMoodChange('day'); setShowMoodDropdown(false); }}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                      cloudMood === 'day' ? 'bg-sky-500/20 text-sky-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <Sun className="h-3.5 w-3.5 text-amber-400" />
                    <span>Sunny Azure</span>
                  </button>
                  <button
                    onClick={() => { onMoodChange('sunrise'); setShowMoodDropdown(false); }}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                      cloudMood === 'sunrise' ? 'bg-amber-500/20 text-amber-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <Sunrise className="h-3.5 w-3.5 text-amber-300" />
                    <span>Golden Dawn</span>
                  </button>
                  <button
                    onClick={() => { onMoodChange('sunset'); setShowMoodDropdown(false); }}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                      cloudMood === 'sunset' ? 'bg-rose-500/20 text-rose-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <Sunset className="h-3.5 w-3.5 text-rose-400" />
                    <span>Crimson Sunset</span>
                  </button>
                  <button
                    onClick={() => { onMoodChange('storm'); setShowMoodDropdown(false); }}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                      cloudMood === 'storm' ? 'bg-indigo-500/20 text-indigo-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <CloudLightning className="h-3.5 w-3.5 text-cyan-400" />
                    <span>Thunderstorm & Rain</span>
                  </button>
                  <button
                    onClick={() => { onMoodChange('aurora'); setShowMoodDropdown(false); }}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                      cloudMood === 'aurora' ? 'bg-emerald-500/20 text-emerald-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Starry Aurora</span>
                  </button>
                  <button
                    onClick={() => { onMoodChange('nebula'); setShowMoodDropdown(false); }}
                    className={`w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-xl text-left transition-colors ${
                      cloudMood === 'nebula' ? 'bg-fuchsia-500/20 text-fuchsia-300 font-semibold' : 'text-slate-300 hover:bg-slate-800/80'
                    }`}
                  >
                    <Compass className="h-3.5 w-3.5 text-fuchsia-400" />
                    <span>Cosmic Nebula</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <button
            id="btn-nav-export-csv"
            onClick={handleExportAllCsv}
            className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            title="Download Cleaned Telemetry CSV"
          >
            <Download className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            id="btn-api-explorer"
            onClick={onOpenApiModal}
            className="flex items-center space-x-1.5 rounded-xl border border-white/10 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
            title="FastAPI REST Endpoints"
          >
            <Terminal className="h-3.5 w-3.5 text-cyan-400" />
            <span className="hidden sm:inline">REST API</span>
          </button>

          <button
            id="btn-refresh-telemetry"
            onClick={onRefresh}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 rounded-xl bg-cyan-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-cyan-600/30 transition-all hover:bg-cyan-500 disabled:opacity-50"
            title="Refresh Telemetry Data"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>
    </header>
  );
};
