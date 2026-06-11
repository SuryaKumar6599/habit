import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import useHabitStore from '../stores/habitStore';
import useCampaignStore from '../stores/campaignStore';
import { Shield, Skull, Swords, Play, Pause, RotateCcw, Trophy, Flame, Zap, AlertTriangle, Coffee } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STATUS = {
  IDLE: 'idle',
  RUNNING: 'running',
  PAUSED: 'paused',
  RESTING: 'resting',
  VICTORY: 'victory',
  DEFEATED: 'defeated',
};

// Math Models
const calculateQuadratic = (n) => Math.round(2.5 * (n * n) + 2.5 * n);
const calculateExponential = (n) => Math.round(5 * Math.pow(1.5, n - 1));

export default function DemonEncounter() {
  const { user } = useAuthStore();
  const { finishEncounter } = useHabitStore();
  const { activeCampaign, fetchActiveCampaign, spawnCampaign, damageActiveCampaign, loading: campaignLoading } = useCampaignStore();

  const [level, setLevel] = useState(3);
  const [model, setModel] = useState('quadratic');
  const [status, setStatus] = useState(STATUS.IDLE);
  
  const [totalDuration, setTotalDuration] = useState(30);
  const [timeLeft, setTimeLeft] = useState(30 * 60);
  const [currentPhase, setCurrentPhase] = useState(1);
  const [totalPhases, setTotalPhases] = useState(1);
  
  const [xpReward, setXpReward] = useState(null);
  const [damageParticles, setDamageParticles] = useState([]);
  
  const intervalRef = useRef(null);
  const particleIdRef = useRef(0);

  // Initialize or fetch active campaign
  useEffect(() => {
    if (user && !activeCampaign) {
      fetchActiveCampaign(user.id);
    }
  }, [user, activeCampaign, fetchActiveCampaign]);

  // Update calculated duration when level or model changes
  useEffect(() => {
    if (status !== STATUS.IDLE) return;
    const duration = model === 'quadratic' ? calculateQuadratic(level) : calculateExponential(level);
    
    // Safety Rule: Partition > 120m into 90m chunks with 15m breaks
    if (duration > 120) {
      const phases = Math.ceil(duration / 90);
      setTotalPhases(phases);
      setTotalDuration(Math.round(duration / phases));
      setTimeLeft(Math.round(duration / phases) * 60);
    } else {
      setTotalPhases(1);
      setTotalDuration(duration);
      setTimeLeft(duration * 60);
    }
    setCurrentPhase(1);
  }, [level, model, status]);

  // Floating damage numbers effect
  useEffect(() => {
    if (status === STATUS.RUNNING) {
      const damageInterval = setInterval(() => {
        const id = particleIdRef.current++;
        // Damage scales slightly with level
        const damage = Math.floor(Math.random() * (20 + level * 5)) + 15;
        setDamageParticles((prev) => [...prev, { id, damage }]);
        
        setTimeout(() => {
          setDamageParticles((prev) => prev.filter(p => p.id !== id));
        }, 1500);
      }, 3000);

      return () => clearInterval(damageInterval);
    }
  }, [status, level]);

  const progress = ((totalDuration * 60 - timeLeft) / (totalDuration * 60)) * 100;
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
        
        if (status === STATUS.RUNNING) {
          if (currentPhase < totalPhases) {
            // Need a rest break
            setStatus(STATUS.RESTING);
            return 15 * 60; // 15 minute rest
          } else {
            // Full encounter complete
            setStatus(STATUS.VICTORY);
            return 0;
          }
        } else if (status === STATUS.RESTING) {
          // Break over, start next phase
          setCurrentPhase(p => p + 1);
          setStatus(STATUS.RUNNING);
          return totalDuration * 60;
        }
      }
      return prev - 1;
    });
  }, [status, currentPhase, totalPhases, totalDuration]);

  useEffect(() => {
    if (status === STATUS.RUNNING || status === STATUS.RESTING) {
      intervalRef.current = setInterval(tick, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [status, tick]);

  // Handle victory logic (DB writes)
  useEffect(() => {
    if (status === STATUS.VICTORY && user) {
      const totalSessionMinutes = model === 'quadratic' ? calculateQuadratic(level) : calculateExponential(level);
      
      // Award XP
      finishEncounter(user.id, totalSessionMinutes).then((result) => {
        if (result && !result.error) {
          setXpReward(result.xpGained);
        }
      });

      // Deal massive damage to the active campaign boss
      if (activeCampaign) {
        const damageToDeal = totalSessionMinutes * 10; // 10 damage per minute of focus
        damageActiveCampaign(user.id, damageToDeal);
      }
    }
  }, [status, user, finishEncounter, activeCampaign, damageActiveCampaign, level, model]);

  const handleStart = async () => {
    if (!activeCampaign && user) {
      // Auto-spawn a campaign if they don't have one
      await spawnCampaign(user.id);
    }
    setStatus(STATUS.RUNNING);
  };

  const handlePause = () => setStatus(STATUS.PAUSED);
  const handleAbandon = () => {
    clearInterval(intervalRef.current);
    setStatus(STATUS.DEFEATED);
  };

  const handleReset = () => {
    clearInterval(intervalRef.current);
    const duration = model === 'quadratic' ? calculateQuadratic(level) : calculateExponential(level);
    if (duration > 120) {
      const phases = Math.ceil(duration / 90);
      setTotalPhases(phases);
      setTotalDuration(Math.round(duration / phases));
      setTimeLeft(Math.round(duration / phases) * 60);
    } else {
      setTotalPhases(1);
      setTotalDuration(duration);
      setTimeLeft(duration * 60);
    }
    setCurrentPhase(1);
    setStatus(STATUS.IDLE);
    setXpReward(null);
  };

  const isRunning = status === STATUS.RUNNING;
  const isIdle = status === STATUS.IDLE;
  const isResting = status === STATUS.RESTING;

  const getColor = () => {
    if (status === STATUS.VICTORY) return '#22c55e';
    if (status === STATUS.DEFEATED) return '#6b7280';
    if (status === STATUS.RESTING) return '#3b82f6';
    if (progress > 50) return '#ef4444';
    if (progress > 25) return '#f97316';
    return '#ffffff';
  };

  const arcColor = getColor();
  const bossName = activeCampaign ? activeCampaign.demon_name : 'Unknown Demon';
  const bossHpDisplay = activeCampaign ? `${activeCampaign.current_hp} / ${activeCampaign.max_hp} HP` : 'Summoning...';

  return (
    <div className="animate-fade-in pb-20 md:pb-0">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text-primary mb-1 flex items-center gap-3">
            <Swords className="w-8 h-8 text-crimson" />
            Demon Campaign
          </h1>
          <p className="text-sm text-text-secondary">
            Execute Total Concentration. Deal damage to the active boss.
          </p>
        </div>
        
        {/* Campaign Status Card */}
        {activeCampaign && (
          <div className="glass-card px-4 py-2 flex items-center gap-4 bg-red-900/10 border-red-500/20">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-red-400">Current Target</p>
              <p className="font-heading font-bold">{activeCampaign.demon_name}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase text-text-muted">Boss HP</p>
              <p className="text-sm font-mono">{bossHpDisplay}</p>
            </div>
          </div>
        )}
      </div>

      {/* Configuration */}
      {isIdle && (
        <div className="flex flex-col items-center gap-6 mb-10">
          <div className="flex gap-4 p-1 bg-white/5 rounded-xl border border-white/10">
            <button
              onClick={() => setModel('quadratic')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${model === 'quadratic' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
            >
              Standard (Quadratic)
            </button>
            <button
              onClick={() => setModel('exponential')}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${model === 'exponential' ? 'bg-crimson/20 text-red-400' : 'text-white/50 hover:text-white'}`}
            >
              Hardcore (Exponential)
            </button>
          </div>

          <div className="w-full max-w-md">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-bold uppercase text-text-muted">Encounter Level</span>
              <span className="text-xs font-bold text-white">Lvl {level}</span>
            </div>
            <input 
              type="range" 
              min="1" max="10" 
              value={level} 
              onChange={(e) => setLevel(parseInt(e.target.value))}
              className="w-full accent-crimson"
            />
            
            {totalPhases > 1 && (
              <div className="mt-3 flex items-start gap-2 p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg text-orange-400">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p className="text-xs font-semibold">
                  Safety Rule: Duration exceeds 120m. Encounter split into {totalPhases} combat phases with mandatory 15m recovery intervals.
                </p>
              </div>
            )}
          </div>
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
              boxShadow: (status === STATUS.RUNNING || status === STATUS.RESTING)
                ? `0 0 60px ${arcColor}40, 0 0 120px ${arcColor}15`
                : 'none',
              opacity: (status === STATUS.RUNNING || status === STATUS.RESTING) ? 1 : 0,
            }}
          />

          <svg width="280" height="280" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="140" cy="140" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
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

          {/* Floating Damage Numbers */}
          <AnimatePresence>
            {damageParticles.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 1, y: 0, x: (Math.random() - 0.5) * 60, scale: 0.5 }}
                animate={{ opacity: 0, y: -120 - Math.random() * 40, scale: 1.5 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                className="absolute text-red-500 font-heading font-black text-2xl pointer-events-none z-20 drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              >
                -{p.damage}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Inner content */}
          <div className="absolute flex flex-col items-center justify-center text-center">
            {status === STATUS.VICTORY ? (
              <div className="flex flex-col items-center gap-2">
                <Trophy className="w-12 h-12 text-white animate-bounce" />
                <p className="text-white font-heading font-bold text-lg">Demon Damaged!</p>
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
            ) : status === STATUS.RESTING ? (
              <div className="flex flex-col items-center gap-2">
                <Coffee className="w-8 h-8 text-blue-400 animate-pulse" />
                <div className="text-4xl font-mono font-extrabold text-blue-300 tracking-tight">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-[10px] text-blue-400 uppercase tracking-widest font-bold">Mandatory Recovery</p>
              </div>
            ) : (
              <>
                <div className="text-5xl font-mono font-extrabold text-text-primary tracking-tight">
                  {formatTime(timeLeft)}
                </div>
                <p className="text-xs text-text-muted mt-2 uppercase tracking-widest">
                  {isRunning ? (
                    <span className="text-crimson animate-pulse flex items-center gap-1">
                      <Flame className="w-3 h-3" /> Battling {bossName}
                    </span>
                  ) : (
                    status === STATUS.PAUSED ? 'Paused — Demon is waiting' : `Target: ${bossName}`
                  )}
                </p>
                {totalPhases > 1 && (
                  <p className="text-[10px] text-orange-400 mt-1 font-bold uppercase">
                    Phase {currentPhase} of {totalPhases}
                  </p>
                )}
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
              disabled={campaignLoading}
              className="btn-primary flex items-center gap-2 px-10 py-4 text-lg font-bold disabled:opacity-50"
            >
              <Swords className="w-5 h-5" />
              Engage Demon
            </button>
          )}

          {isRunning && (
            <>
              <button onClick={handlePause} className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 text-white border border-white/20 font-semibold hover:bg-white/20 transition-all">
                <Pause className="w-4 h-4" />
                Hold Position
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
          <div className="glass-card p-4 max-w-md text-center border border-white/10 bg-white/5 mt-4">
            <p className="text-[11px] text-white/70">
              ⚠️ The Encounter Safety Rule is active. Marathon focus blocks exceeding 120 minutes will be strictly partitioned with mandatory recovery intervals to prevent burnout.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
