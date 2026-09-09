import React, { useState, useMemo } from 'react';
import { Cloud, Sun, Sunset, CloudLightning, Sparkles, Wind, Eye, EyeOff, Sunrise, Compass, Layers } from 'lucide-react';

export type CloudMood = 'day' | 'sunset' | 'storm' | 'aurora' | 'sunrise' | 'nebula';
export type CloudSpeed = 'calm' | 'normal' | 'fast';
export type CloudDensity = 'wispy' | 'balanced' | 'fluffy';

interface CloudyBackgroundProps {
  mood: CloudMood;
  onMoodChange: (mood: CloudMood) => void;
  speed: CloudSpeed;
  onSpeedChange: (speed: CloudSpeed) => void;
  showControls?: boolean;
}

export const CloudyBackground: React.FC<CloudyBackgroundProps> = ({
  mood,
  onMoodChange,
  speed,
  onSpeedChange,
  showControls = true
}) => {
  const [cloudsVisible, setCloudsVisible] = useState<boolean>(true);
  const [cloudDensity, setCloudDensity] = useState<CloudDensity>('balanced');
  const [showStarsAndParticles, setShowStarsAndParticles] = useState<boolean>(true);
  const [funMessage, setFunMessage] = useState<string | null>(null);

  // Cloud click reaction with meteorological easter eggs
  const handleCloudClick = (msg: string) => {
    setFunMessage(msg);
    setTimeout(() => setFunMessage(null), 3000);
  };

  // Fixed starfield distribution
  const stars = useMemo(() => {
    return Array.from({ length: 65 }, (_, i) => ({
      id: i,
      top: `${((i * 19 + 7) % 88) + 2}%`,
      left: `${((i * 29 + 13) % 96) + 2}%`,
      size: (i % 4 === 0) ? 2.5 : (i % 2 === 0) ? 1.8 : 1.2,
      delay: `${((i * 0.4) % 4).toFixed(1)}s`,
      duration: `${2.2 + (i % 3) * 0.8}s`
    }));
  }, []);

  // Sky color gradients & cloud styles
  const skyStyles = useMemo(() => {
    switch (mood) {
      case 'day':
        return {
          bg: 'bg-gradient-to-b from-[#082348] via-[#0b2f5c] to-[#040f1d]',
          sunGlow: 'bg-gradient-to-r from-amber-300/30 via-sky-300/25 to-yellow-200/10',
          cloudFillFront: 'fill-sky-100/25',
          cloudStrokeFront: 'stroke-white/40',
          cloudFillMid: 'fill-sky-200/20',
          cloudStrokeMid: 'stroke-sky-200/30',
          cloudFillBack: 'fill-blue-300/15',
          cloudShadow: 'drop-shadow-[0_12px_30px_rgba(56,189,248,0.25)]',
          accentColor: 'text-amber-300',
          themeName: 'Sunny Azure'
        };
      case 'sunset':
        return {
          bg: 'bg-gradient-to-b from-[#2b0f2e] via-[#3d1323] to-[#120614]',
          sunGlow: 'bg-gradient-to-r from-amber-500/35 via-rose-500/30 to-violet-600/20',
          cloudFillFront: 'fill-rose-200/25',
          cloudStrokeFront: 'stroke-amber-300/50',
          cloudFillMid: 'fill-amber-300/20',
          cloudStrokeMid: 'stroke-rose-300/40',
          cloudFillBack: 'fill-violet-400/15',
          cloudShadow: 'drop-shadow-[0_12px_30px_rgba(244,63,94,0.3)]',
          accentColor: 'text-rose-300',
          themeName: 'Crimson Sunset'
        };
      case 'sunrise':
        return {
          bg: 'bg-gradient-to-b from-[#1b1938] via-[#2f203f] to-[#131124]',
          sunGlow: 'bg-gradient-to-r from-amber-400/35 via-orange-300/25 to-rose-400/20',
          cloudFillFront: 'fill-amber-100/25',
          cloudStrokeFront: 'stroke-amber-200/50',
          cloudFillMid: 'fill-rose-200/20',
          cloudStrokeMid: 'stroke-rose-200/40',
          cloudFillBack: 'fill-indigo-300/15',
          cloudShadow: 'drop-shadow-[0_12px_30px_rgba(251,191,36,0.25)]',
          accentColor: 'text-amber-200',
          themeName: 'Golden Dawn'
        };
      case 'storm':
        return {
          bg: 'bg-gradient-to-b from-[#0b1220] via-[#0e1628] to-[#02050b]',
          sunGlow: 'bg-gradient-to-r from-cyan-500/25 via-indigo-600/30 to-slate-900/10',
          cloudFillFront: 'fill-slate-400/30',
          cloudStrokeFront: 'stroke-cyan-300/35',
          cloudFillMid: 'fill-slate-600/25',
          cloudStrokeMid: 'stroke-slate-500/30',
          cloudFillBack: 'fill-indigo-950/50',
          cloudShadow: 'drop-shadow-[0_14px_35px_rgba(15,23,42,0.7)]',
          accentColor: 'text-cyan-400',
          themeName: 'Thunderstorm'
        };
      case 'nebula':
        return {
          bg: 'bg-gradient-to-b from-[#150a29] via-[#0b102b] to-[#040411]',
          sunGlow: 'bg-gradient-to-r from-purple-500/30 via-cyan-400/25 to-fuchsia-600/20',
          cloudFillFront: 'fill-fuchsia-200/15',
          cloudStrokeFront: 'stroke-cyan-300/40',
          cloudFillMid: 'fill-cyan-300/15',
          cloudStrokeMid: 'stroke-fuchsia-400/30',
          cloudFillBack: 'fill-purple-500/10',
          cloudShadow: 'drop-shadow-[0_12px_30px_rgba(168,85,247,0.3)]',
          accentColor: 'text-fuchsia-300',
          themeName: 'Cosmic Nebula'
        };
      case 'aurora':
      default:
        return {
          bg: 'bg-gradient-to-b from-[#041d24] via-[#06241e] to-[#020d12]',
          sunGlow: 'bg-gradient-to-r from-emerald-500/30 via-cyan-400/25 to-teal-900/15',
          cloudFillFront: 'fill-emerald-200/20',
          cloudStrokeFront: 'stroke-emerald-300/45',
          cloudFillMid: 'fill-cyan-300/18',
          cloudStrokeMid: 'stroke-cyan-300/35',
          cloudFillBack: 'fill-teal-400/12',
          cloudShadow: 'drop-shadow-[0_12px_30px_rgba(16,185,129,0.25)]',
          accentColor: 'text-emerald-300',
          themeName: 'Starry Aurora'
        };
    }
  }, [mood]);

  const speedClass = speed === 'fast' ? 'cloud-speed-fast' : speed === 'calm' ? 'cloud-speed-calm' : '';

  return (
    <div className={`fixed inset-0 overflow-hidden pointer-events-none z-0 ${skyStyles.bg} transition-colors duration-1000 ${speedClass}`}>
      {/* 1. Celestial Core & Atmospheric Light Engine */}
      {mood === 'day' && (
        <div className="absolute -top-28 left-[22%] pointer-events-none">
          <div className="w-[620px] h-[620px] rounded-full bg-gradient-to-r from-amber-400/20 via-sky-300/15 to-yellow-200/10 blur-3xl animate-solar-rays" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full bg-amber-300/30 blur-2xl animate-sun-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-tr from-amber-200 via-amber-300 to-yellow-100 shadow-[0_0_90px_rgba(251,191,36,0.6)] opacity-90" />
        </div>
      )}

      {mood === 'sunset' && (
        <div className="absolute top-16 right-16 pointer-events-none">
          <div className="w-80 h-80 rounded-full bg-gradient-to-tr from-rose-600/30 via-amber-500/25 to-transparent blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-gradient-to-r from-amber-400 to-rose-400 blur-md shadow-[0_0_80px_rgba(244,63,94,0.6)] opacity-85" />
        </div>
      )}

      {mood === 'sunrise' && (
        <div className="absolute -top-10 left-12 pointer-events-none">
          <div className="w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-amber-400/25 via-rose-300/20 to-violet-400/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 rounded-full bg-gradient-to-r from-amber-200 to-rose-200 blur-lg shadow-[0_0_80px_rgba(253,224,71,0.5)] opacity-85" />
        </div>
      )}

      {mood === 'storm' && (
        <>
          <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none animate-lightning-flash" />
          {/* Rain streaks */}
          {showStarsAndParticles && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              {Array.from({ length: 32 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute top-0 w-[1.5px] h-9 bg-gradient-to-b from-transparent via-cyan-300/50 to-sky-100/70 rounded-full"
                  style={{
                    left: `${((i * 3.3 + 1.5) % 100).toFixed(1)}%`,
                    animation: `rainFall ${0.55 + (i % 5) * 0.12}s linear infinite`,
                    animationDelay: `${((i * 0.11) % 1.5).toFixed(2)}s`,
                    opacity: 0.65
                  }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {mood === 'aurora' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Aurora ribbon 1 (Emerald shimmer) */}
          <div className="absolute top-0 left-[-15%] w-[130%] h-[380px] bg-gradient-to-b from-emerald-400/30 via-teal-300/20 to-transparent blur-3xl animate-aurora" />
          {/* Aurora ribbon 2 (Violet-cyan curtain) */}
          <div
            className="absolute top-8 left-[-10%] w-[120%] h-[320px] bg-gradient-to-b from-cyan-400/25 via-violet-500/20 to-transparent blur-3xl animate-aurora"
            style={{ animationDelay: '-6s' }}
          />
        </div>
      )}

      {mood === 'nebula' && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[650px] h-[650px] rounded-full bg-gradient-to-tr from-purple-600/30 via-indigo-500/25 to-cyan-400/20 blur-3xl animate-nebula" />
          <div
            className="absolute top-1/2 right-1/4 w-[480px] h-[480px] rounded-full bg-gradient-to-bl from-pink-500/25 via-violet-600/20 to-transparent blur-3xl animate-nebula"
            style={{ animationDelay: '-7s' }}
          />
        </div>
      )}

      {/* 2. Twinkling Celestial Starfield for Night / Space / Aurora moods */}
      {showStarsAndParticles && (mood === 'aurora' || mood === 'nebula' || mood === 'storm' || mood === 'sunset') && (
        <div className="absolute inset-0 pointer-events-none">
          {stars.map((s) => (
            <div
              key={s.id}
              className="absolute rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]"
              style={{
                top: s.top,
                left: s.left,
                width: `${s.size}px`,
                height: `${s.size}px`,
                animation: `twinkleStar ${s.duration} ease-in-out infinite`,
                animationDelay: s.delay
              }}
            />
          ))}

          {/* Shooting Stars */}
          {(mood === 'aurora' || mood === 'nebula') && (
            <>
              <div
                className="absolute top-14 left-[15%] w-36 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-white rounded-full animate-shooting-star opacity-0 pointer-events-none"
                style={{ transform: 'rotate(-25deg)' }}
              />
              <div
                className="absolute top-40 left-[62%] w-44 h-[2px] bg-gradient-to-r from-transparent via-emerald-300 to-white rounded-full animate-shooting-star opacity-0 pointer-events-none"
                style={{ animationDelay: '3.6s', transform: 'rotate(-30deg)' }}
              />
            </>
          )}
        </div>
      )}

      {/* 3. Floating Interactive Click Message (Toast) */}
      {funMessage && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 pointer-events-auto bg-slate-900/95 text-white text-xs font-semibold px-4 py-2.5 rounded-2xl border border-sky-400/40 shadow-2xl shadow-sky-500/30 animate-bounce flex items-center space-x-2 backdrop-blur-md">
          <Sparkles className="h-4 w-4 text-amber-400 shrink-0" />
          <span>{funMessage}</span>
        </div>
      )}

      {/* 4. Multi-Layer Volumetric Drifting Clouds */}
      {cloudsVisible && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none select-none">
          {/* Layer A: High Cirrus / Stratus (Slow, expansive) */}
          <div className="absolute top-4 left-0 w-full animate-cloud-drift-3 opacity-60">
            <svg
              className={`w-[520px] h-[175px] ${skyStyles.cloudFillBack} ${skyStyles.cloudShadow} pointer-events-auto cursor-pointer hover:scale-105 transition-transform`}
              viewBox="0 0 380 130"
              onClick={() => handleCloudClick('⛅ Cirrus High-Level Drift: 11,000m altitude ice crystal bank')}
            >
              <path
                d="M 25 90 A 35 35 0 0 1 85 60 A 52 52 0 0 1 165 42 A 65 65 0 0 1 265 48 A 42 42 0 0 1 330 72 A 32 32 0 0 1 370 100 L 25 100 Z"
                className="stroke-white/20 stroke-[1.5]"
              />
            </svg>
          </div>

          <div className="absolute top-48 left-1/3 w-full animate-cloud-drift-3 opacity-55">
            <svg
              className={`w-[450px] h-[155px] ${skyStyles.cloudFillBack} ${skyStyles.cloudShadow} pointer-events-auto cursor-pointer hover:scale-105 transition-transform`}
              viewBox="0 0 360 130"
              onClick={() => handleCloudClick('☁️ Stratocumulus Bank: Soft atmospheric humidity cushion')}
            >
              <path
                d="M 30 85 A 30 30 0 0 1 80 62 A 46 46 0 0 1 150 48 A 52 52 0 0 1 235 52 A 35 35 0 0 1 300 74 L 30 85 Z"
                className="stroke-white/15 stroke-[1.5]"
              />
            </svg>
          </div>

          {/* Layer B: Mid-Level Billowy Cumulus (Medium speed, bouncy) */}
          {cloudDensity !== 'wispy' && (
            <>
              <div className="absolute top-28 left-8 w-full animate-cloud-drift-2 opacity-80">
                <div className="animate-cloud-bob">
                  <svg
                    className={`w-[600px] h-[210px] ${skyStyles.cloudFillMid} ${skyStyles.cloudShadow} pointer-events-auto cursor-pointer hover:scale-105 transition-transform`}
                    viewBox="0 0 420 160"
                    onClick={() => handleCloudClick('☁️ Fluffy Cumulus: 85% pure condensed water vapor & condensation nuclei')}
                  >
                    <path
                      d="M 45 120 A 40 40 0 0 1 105 85 A 62 62 0 0 1 195 52 A 72 72 0 0 1 300 58 A 50 50 0 0 1 375 92 A 38 38 0 0 1 415 130 L 45 130 Z"
                      className={`${skyStyles.cloudStrokeMid} stroke-[2]`}
                    />
                  </svg>
                </div>
              </div>

              <div className="absolute top-72 left-2/3 w-full animate-cloud-drift-2 opacity-75">
                <div className="animate-cloud-bob" style={{ animationDelay: '-3s' }}>
                  <svg
                    className={`w-[520px] h-[180px] ${skyStyles.cloudFillMid} ${skyStyles.cloudShadow} pointer-events-auto cursor-pointer hover:scale-105 transition-transform`}
                    viewBox="0 0 400 150"
                    onClick={() => handleCloudClick('⛅ Friendly Weather Cloud: Floating at 1,800m')}
                  >
                    <path
                      d="M 40 110 A 35 35 0 0 1 90 82 A 55 55 0 0 1 170 52 A 64 64 0 0 1 270 58 A 44 44 0 0 1 340 88 L 40 110 Z"
                      className={`${skyStyles.cloudStrokeMid} stroke-[1.5]`}
                    />
                  </svg>
                </div>
              </div>
            </>
          )}

          {/* Layer C: Foreground Volumetric Sculpted Cloud Banks */}
          <div className="absolute top-16 left-1/4 w-full animate-cloud-drift-1 opacity-90">
            <div className="animate-cloud-bob" style={{ animationDelay: '-1.5s' }}>
              <svg
                className={`w-[660px] h-[235px] ${skyStyles.cloudFillFront} ${skyStyles.cloudShadow} pointer-events-auto cursor-pointer hover:scale-105 transition-transform`}
                viewBox="0 0 460 180"
                onClick={() => handleCloudClick('✨ SkyGuard Cloud Scout: Detecting micro-barometric shifts & adiabatic lapse rates!')}
              >
                <path
                  d="M 50 140 A 45 45 0 0 1 120 100 A 72 72 0 0 1 225 62 A 82 82 0 0 1 345 70 A 55 55 0 0 1 425 110 A 42 42 0 0 1 455 152 L 50 152 Z"
                  className={`${skyStyles.cloudStrokeFront} stroke-[2.5]`}
                />
              </svg>
            </div>
          </div>

          <div className="absolute top-96 left-6 w-full animate-cloud-drift-1 opacity-75">
            <div className="animate-cloud-bob" style={{ animationDelay: '-4s' }}>
              <svg
                className={`w-[560px] h-[195px] ${skyStyles.cloudFillFront} ${skyStyles.cloudShadow} pointer-events-auto cursor-pointer hover:scale-105 transition-transform`}
                viewBox="0 0 410 160"
                onClick={() => handleCloudClick('🌧️ Moist Advection Cloud: Vapor Pressure Deficit 0.42 kPa')}
              >
                <path
                  d="M 45 125 A 38 38 0 0 1 105 92 A 60 60 0 0 1 185 60 A 68 68 0 0 1 285 66 A 46 46 0 0 1 360 98 L 45 125 Z"
                  className={`${skyStyles.cloudStrokeFront} stroke-[2]`}
                />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* 5. Floating Glassy Atmosphere Dock */}
      {showControls && (
        <div className="fixed bottom-4 right-4 z-40 pointer-events-auto flex items-center space-x-1.5 p-1.5 rounded-2xl bg-slate-950/85 backdrop-blur-xl border border-white/15 shadow-2xl shadow-black/70 text-xs">
          <div className="flex items-center space-x-1 px-1 text-slate-400 font-medium">
            <Cloud className={`h-3.5 w-3.5 ${skyStyles.accentColor}`} />
            <span className="hidden sm:inline text-[11px] font-mono">Atmosphere:</span>
          </div>

          {/* Mood buttons */}
          <button
            id="btn-sky-mood-day"
            onClick={() => onMoodChange('day')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl font-medium transition-all ${
              mood === 'day'
                ? 'bg-sky-500/25 text-sky-300 border border-sky-400/40 shadow-sm shadow-sky-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Sunny Azure Sky"
          >
            <Sun className="h-3 w-3 text-amber-400" />
            <span className="text-[11px]">Day</span>
          </button>

          <button
            id="btn-sky-mood-sunrise"
            onClick={() => onMoodChange('sunrise')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl font-medium transition-all ${
              mood === 'sunrise'
                ? 'bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-sm shadow-amber-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Golden Sunrise & Morning Fog"
          >
            <Sunrise className="h-3 w-3 text-amber-300" />
            <span className="text-[11px]">Dawn</span>
          </button>

          <button
            id="btn-sky-mood-sunset"
            onClick={() => onMoodChange('sunset')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl font-medium transition-all ${
              mood === 'sunset'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-400/40 shadow-sm shadow-rose-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Crimson Twilight Clouds"
          >
            <Sunset className="h-3 w-3 text-rose-400" />
            <span className="text-[11px]">Sunset</span>
          </button>

          <button
            id="btn-sky-mood-storm"
            onClick={() => onMoodChange('storm')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl font-medium transition-all ${
              mood === 'storm'
                ? 'bg-indigo-500/25 text-indigo-300 border border-indigo-400/40 shadow-sm shadow-indigo-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Atmospheric Thunderstorm & Rain"
          >
            <CloudLightning className="h-3 w-3 text-cyan-400" />
            <span className="text-[11px]">Storm</span>
          </button>

          <button
            id="btn-sky-mood-aurora"
            onClick={() => onMoodChange('aurora')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl font-medium transition-all ${
              mood === 'aurora'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 shadow-sm shadow-emerald-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Starry Aurora Borealis"
          >
            <Sparkles className="h-3 w-3 text-emerald-400" />
            <span className="text-[11px]">Aurora</span>
          </button>

          <button
            id="btn-sky-mood-nebula"
            onClick={() => onMoodChange('nebula')}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-xl font-medium transition-all ${
              mood === 'nebula'
                ? 'bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-400/40 shadow-sm shadow-fuchsia-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Cosmic Starlight Nebula"
          >
            <Compass className="h-3 w-3 text-fuchsia-400" />
            <span className="text-[11px]">Nebula</span>
          </button>

          <div className="h-4 w-px bg-slate-800 my-auto" />

          {/* Density toggle */}
          <button
            id="btn-cloud-density-toggle"
            onClick={() => {
              if (cloudDensity === 'wispy') setCloudDensity('balanced');
              else if (cloudDensity === 'balanced') setCloudDensity('fluffy');
              else setCloudDensity('wispy');
            }}
            className="flex items-center space-x-1 px-2 py-1 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
            title={`Cloud Density: ${cloudDensity} (click to toggle)`}
          >
            <Layers className="h-3 w-3 text-cyan-400" />
            <span className="text-[10px] uppercase font-mono">{cloudDensity}</span>
          </button>

          {/* Speed toggles */}
          <button
            id="btn-cloud-speed-toggle"
            onClick={() => {
              if (speed === 'normal') onSpeedChange('fast');
              else if (speed === 'fast') onSpeedChange('calm');
              else onSpeedChange('normal');
            }}
            className="flex items-center space-x-1 px-2 py-1 rounded-xl text-slate-300 hover:bg-slate-800 transition-colors"
            title={`Wind Drift Speed: ${speed} (click to toggle)`}
          >
            <Wind className="h-3 w-3 text-sky-400" />
            <span className="text-[10px] uppercase font-mono">{speed}</span>
          </button>

          {/* Visibility toggle */}
          <button
            id="btn-clouds-visibility-toggle"
            onClick={() => setCloudsVisible(!cloudsVisible)}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title={cloudsVisible ? 'Hide Floating Clouds' : 'Show Floating Clouds'}
          >
            {cloudsVisible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5 text-slate-500" />}
          </button>
        </div>
      )}
    </div>
  );
};
