import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import useHabitStore from '../stores/habitStore';
import { Shield, Skull, Swords, Play, Pause, RotateCcw, Trophy, Flame, Zap } from 'lucide-react';

const DURATIONS = [
  { label: '25 min', value: 25, demon: 'Lower Moon Six', rank: '下陸' },
  { label: '45 min', value: 45, demon: 'Lower Moon Three', rank: '下参' },
  { label: '60 min', value: 60, demon: 'Upper Moon Six', rank: '上陸' },
];

const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  VICTORY: 'victory',
  DEFEATED: 'defeated',
};

export default function DemonEncounter() {
  const { user } = useAuthStore();
  const { finishEncounter } = useHabitStore();

  const [selectedDuration, setSelectedDuration] = useState(DURATIONS[0]);
  const [status, setStatus] = useState(STATUS.IDLE);
  const [timeLeft, setTimeLeft] = useState(DURATIONS[0].value * 60);
  const [xpReward, setXpReward] = useState(null);
  const intervalRef = useRef(null);

  const totalSeconds = selectedDuration.value * 60;
  const progress = (timeLeft / totalSeconds) * 100;

  // SVG circle math
  const radius = 110;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const tick = useCallback(() => {
    setTimeLeft((prev) => {
      if (prev <= 1) {
        clearInterval(intervalRef.current);
        setStatus(STATUS.VICTORY);
        return 0;
      }
      return prev - 1;
    });
  }, []);

  useEffect(() => {
    if (status === STATUS.RUNNING) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [status, tick]);

  // Save to DB on victory
  useEffect(() => {
    if (status === STATUS.VICTORY && user) {
      finishEncounter(user.id, selectedDuration.value).then((result) => {
        if (result && !result.error) {
          setXpReward(result.xpGained);
        }
      });
    }
  }, [status, user, finishEncounter, selectedDuration.value]);

  const handleStart = () => {
    setStatus(STATUS.RUNNING);
  };

  const handlePause = () => {
    setStatus(STATUS.PAUSED);
  };

  const handleAbandon = () => {
    clearInterval(intervalRef.current);
    setStatus(STATUS.DEFEATED);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    setTimeLeft(selectedDuration.value * 60);
    setStatus(STATUS.IDLE);
    setXpReward(null);
  };

  const handleSelectDuration = (dur) => {
    if (status !== STATUS.IDLE) return;
    setSelectedDuration(dur);
    setTimeLeft(dur.value * 60);
  };

  const isRunning = status === STATUS.RUNNING;
  const isIdle = status === STATUS.IDLE;

  // Color based on time remaining
  const getColor = () => {
    if (status === STATUS.VICTORY) return '#22c55e';
    if (status === STATUS.DEFEATED) return '#6b7280';
    if (progress > 50) return '#ef4444';
    if (progress > 25) return '#f97316';
    return '#ffffff';
  };

  const arcColor = getColor();

  return (
    <div className="animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text-primary mb-1 flex items-center gap-3">
            <Swords className="w-8 h-8 text-crimson" />
            Demon Encounter
          </h1>
          <p className="text-sm text-text-secondary">
            Enter a focused battle. Do not break concentration until the demon is slain.
          </p>
        </div>
      </div>

      {/* Duration Selector */}
      {isIdle && (
        <div className="flex gap-3 justify-center mb-10">
          {DURATIONS.map((dur) => (
            <button
              key={dur.value}
              onClick={() => handleSelectDuration(dur)}
              className={`px-5 py-3 rounded-xl text-sm font-bold border transition-all ${
                selectedDuration.value === dur.value
                  ? 'bg-crimson/20 border-crimson/40 text-crimson-light shadow-[0_0_15px_rgba(220,38,38,0.2)]'
                  : 'border-white/10 text-text-secondary hover:bg-white/5 bg-slate-deep/30'
              }`}
            >
              <div className="text-lg font-mono font-extrabold">{dur.label}</div>
              <div className="text-[10px] uppercase tracking-widest opacity-70">{dur.demon}</div>
            </button>
          ))}
        </div>
      )}

      {/* Central Timer Display */}
      <div className="flex flex-col items-center gap-8">
        <div className="relative flex items-center justify-center">
          {/* Outer glow ring */}
          <div
            className="absolute rounded-full transition-opacity duration-500"
            style={{
              width: 290,
              height: 290,
              boxShadow: status === STATUS.RUNNING
                ? `0 0 60px ${arcColor}40, 0 0 120px ${arcColor}15`
                : 'none',
              opacity: status === STATUS.RUNNING ? 1 : 0,
            }}
          />

          <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
            {/* Background track */}
            <circle
              cx="140" cy="140" r={radius}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="10"
            />
            {/* Progress arc */}
            <circle
              cx="140" cy="140" r={radius}
              fill="none"
              stroke={arcColor}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{
                transition: 'stroke-dashoffset 1s linear, stroke 0.5s ease',
                filter: `drop-shadow(0 0 8px ${arcColor})`,
              }}
            />
          </svg>

          {/* Inner content */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            {status === STATUS.VICTORY ? (
              <div className="flex flex-col items-center gap-2">
                <Trophy className="w-12 h-12 text-white animate-bounce" />
                <p className="text-white font-heading font-bold text-lg">Demon Slain!</p>
                {xpReward && (
                  <p className="text-zinc-300 text-sm font-bold flex items-center gap-1">
                    <Zap className="w-4 h-4" /> +{xpReward} XP
                  </p>
                )}
              </div>
            ) : status === STATUS.DEFEATED ? (
              <div className="flex flex-col items-center gap-2">
                <Skull className="w-12 h-12 text-gray-500" />
                <p className="text-gray-400 font-heading font-bold text-lg">Fled the battle...</p>
              </div>
            ) : (
              <>
                <div className="text-5xl font-mono font-extrabold text-text-primary tracking-tight">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-xs text-text-muted mt-2 uppercase tracking-widest">
                  {isRunning ? (
                    <span className="text-crimson animate-pulse flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Battling {selectedDuration.demon}
                    </span>
                  ) : (
                    status === STATUS.PAUSED ? 'Paused — Demon is waiting' : selectedDuration.demon
                  )}
                </p>
                <p className="text-[10px] text-text-muted mt-1 kanji-display opacity-50">
                  {selectedDuration.rank}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          {(status === STATUS.VICTORY || status === STATUS.DEFEATED) && (
            <button onClick={handleReset} className="btn-primary flex items-center gap-2 px-8 py-3">
              <RotateCcw className="w-4 h-4" />
              New Encounter
            </button>
          )}

          {isIdle && (
            <button
              onClick={handleStart}
              className="btn-primary flex items-center gap-2 px-10 py-4 text-lg font-bold"
              id="start-encounter"
            >
              <Swords className="w-5 h-5" />
              Engage Demon
            </button>
          )}

          {isRunning && (
            <>
              <button onClick={handlePause} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white border border-white/20 font-semibold hover:bg-white/20 transition-all">
                <Pause className="w-4 h-4" />
                Rest
              </button>
              <button onClick={handleAbandon} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-semibold hover:bg-red-500/20 transition-all">
                <Shield className="w-4 h-4" />
                Flee
              </button>
            </>
          )}

          {status === STATUS.PAUSED && (
            <>
              <button onClick={handleStart} className="btn-primary flex items-center gap-2 px-6 py-3">
                <Play className="w-4 h-4" />
                Resume Battle
              </button>
              <button onClick={handleAbandon} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 font-semibold hover:bg-red-500/20 transition-all">
                <Shield className="w-4 h-4" />
                Abandon
              </button>
            </>
          )}
        </div>

        {/* Info tip */}
        {isIdle && (
          <div className="glass-card p-4 max-w-md text-center border border-white/10 bg-white/5">
            <p className="text-xs text-white/70">
              ⚠️ Stay focused and do not leave the app. Fleeing the battle grants <strong>no XP</strong>. Slaying the demon fully repairs your Nichirin Sword!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
