import React, { useState, useEffect } from 'react';
import { RefreshCw, Radio, ExternalLink, MapPin } from 'lucide-react';
import { HourlySyncInfo, Station } from '../types';

interface HourlyWeatherSyncBannerProps {
  syncInfo?: HourlySyncInfo;
  currentStation?: Station;
  isSyncing: boolean;
  onSyncNow: () => void;
}

export const HourlyWeatherSyncBanner: React.FC<HourlyWeatherSyncBannerProps> = ({
  syncInfo,
  currentStation,
  isSyncing,
  onSyncNow,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(() => {
    return syncInfo?.next_sync_seconds ?? 3600;
  });
  const [currentIstTime, setCurrentIstTime] = useState<string>('');

  // Synchronize initial seconds remaining
  useEffect(() => {
    if (syncInfo?.next_sync_seconds !== undefined) {
      setSecondsRemaining(syncInfo.next_sync_seconds);
    }
  }, [syncInfo?.next_sync_seconds]);

  // Live second-by-second countdown and clock ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 1 ? prev - 1 : 3600));

      const now = new Date();
      const istStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      setCurrentIstTime(`${istStr} IST`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatCountdown = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div id="hourly-weather-sync-banner" className="w-full mb-5 rounded-2xl bg-gradient-to-r from-slate-900/95 via-cyan-950/40 to-slate-900/95 border border-cyan-500/25 p-3.5 sm:p-4 shadow-xl backdrop-blur-md">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left: Source & Status */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shrink-0">
            <Radio className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide">
                PMFBY WINDS Weather Telemetry
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-semibold uppercase flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                Hourly Auto-Sync Active
              </span>
              <a
                href="https://pmfby.gov.in/winds/weather"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] text-cyan-400/90 hover:text-cyan-300 transition-colors font-mono underline decoration-cyan-500/40"
              >
                pmfby.gov.in/winds
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>National Automatic Weather Station (AWS) Grid</span>
              <span className="text-slate-500">•</span>
              <span>Refreshes hourly with localized micro-climate telemetry</span>
              {currentStation && (
                <>
                  <span className="text-slate-500">•</span>
                  <span className="text-cyan-300 font-medium inline-flex items-center gap-0.5">
                    <MapPin className="h-3 w-3 inline text-cyan-400" />
                    {currentStation.name} ({currentStation.latitude.toFixed(2)}°N, {currentStation.longitude.toFixed(2)}°E)
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Right: Timers and On-Demand Action */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-4 self-end lg:self-center">
          {/* Real-time IST Clock */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-white/10 text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-medium">India Standard Time</span>
            <span className="text-xs font-mono font-bold text-slate-200">{currentIstTime || 'Syncing...'}</span>
          </div>

          {/* Next Hourly Sync Countdown */}
          <div className="px-3 py-1.5 rounded-xl bg-slate-950/60 border border-cyan-500/30 text-right">
            <span className="text-[10px] uppercase tracking-wider text-cyan-400 block font-medium">Next Hourly Ingestion</span>
            <span className="text-xs font-mono font-bold text-cyan-300 flex items-center justify-end gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
              {formatCountdown(secondsRemaining)}
            </span>
          </div>

          {/* Manual Immediate Sync Button */}
          <button
            id="pmfby-sync-now-button"
            onClick={onSyncNow}
            disabled={isSyncing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-md shadow-cyan-900/30 border border-cyan-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-95"
            title="Fetch latest observation immediately from PMFBY WINDS network"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Ingesting...' : 'Sync Now'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
