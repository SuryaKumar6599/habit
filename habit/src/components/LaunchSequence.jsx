import { useState, useEffect } from 'react';
import { Scroll, X } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { getGreeting, getTimeOfDay } from '../lib/greetings';
import { todayKey } from '../lib/dateKeys';

// --- Mission Generator (client-side, no DB) ---
const generateMissions = (profile) => {
  const h = new Date().getHours();
  const streak = profile?.current_streak ?? 0;
  const missions = [];

  if (h < 12) {
    missions.push({ id: 'morning', icon: '🌅', text: 'Complete 2 forms before noon', xp: 25 });
  } else if (h < 17) {
    missions.push({ id: 'afternoon', icon: '⚔️', text: 'Execute 2 forms this afternoon', xp: 20 });
  } else {
    missions.push({ id: 'evening', icon: '🌙', text: 'Complete all forms before midnight', xp: 30 });
  }

  if (streak >= 3) {
    missions.push({ id: 'streak', icon: '🔥', text: `Protect your ${streak}-day streak`, xp: Math.min(streak * 2, 30) });
  } else {
    missions.push({ id: 'start', icon: '📜', text: 'Begin your first streak — complete 1 form', xp: 10 });
  }

  const day = new Date().getDay();
  const bonuses = [
    { id: 'full_clear', icon: '💎', text: 'Complete ALL your forms today', xp: 50 },
    { id: 'demon_slay', icon: '🗡️', text: 'Slay a demon — complete an Encounter', xp: 40 },
    { id: 'dawn',       icon: '🌄', text: 'Open the app before 8 AM tomorrow', xp: 15 },
    { id: 'endurance',  icon: '⏱️', text: 'Complete a 45-min or longer Encounter', xp: 45 },
    { id: 'scholar',    icon: '📖', text: 'Log 3 different breathing elements today', xp: 35 },
    { id: 'iron',       icon: '🛡️', text: 'Repair your sword to 80% durability', xp: 30 },
    { id: 'devotion',   icon: '🐦', text: 'Feed the crow — raise bond to next tier', xp: 25 },
  ];
  missions.push(bonuses[day]);

  return missions;
};

// --- SVG Crow ---
function CrowSVG({ style, className }) {
  return (
    <svg viewBox="0 0 120 120" width="160" height="160" className={className} style={style}>
      <ellipse cx="60" cy="75" rx="30" ry="23" fill="#0d0818" />
      <path d="M30 68 Q12 54 18 36 Q34 56 50 63Z" fill="#0a0614" />
      <path d="M90 68 Q108 54 102 36 Q86 56 70 63Z" fill="#0a0614" />
      <ellipse cx="60" cy="44" rx="20" ry="17" fill="#0d0818" />
      <circle cx="53" cy="41" r="5" fill="#fff" />
      <circle cx="67" cy="41" r="5" fill="#fff" />
      <circle cx="54.2" cy="41" r="3.2" fill="#0d0818" />
      <circle cx="68.2" cy="41" r="3.2" fill="#0d0818" />
      <circle cx="54.8" cy="40.2" r="1" fill="#fff" />
      <circle cx="68.8" cy="40.2" r="1" fill="#fff" />
      <path d="M56 52 L60 59 L64 52Z" fill="#f59e0b" />
      <line x1="48" y1="97" x2="42" y2="110" stroke="#0d0818" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="60" y1="98" x2="60" y2="112" stroke="#0d0818" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="72" y1="97" x2="78" y2="110" stroke="#0d0818" strokeWidth="3.5" strokeLinecap="round" />
      <path d="M18 36 L8 28 M14 42 L4 38" stroke="#0d0818" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// --- Falling Feather ---
function Feather({ style, duration }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: 8,
        height: 20,
        borderRadius: '50% 50% 50% 50% / 30% 30% 70% 70%',
        background: 'linear-gradient(180deg, rgba(80,60,120,0.6), rgba(40,20,60,0.3))',
        animation: `feather-fall ${duration} ease-in forwards`,
        ...style,
      }}
    />
  );
}

// --- Greeting Scroll ---
function GreetScroll({ profile, missions, onSkip }) {
  const greeting = getGreeting(profile);
  const timeLabel = { dawn: 'Before Dawn', day: 'Good Day', dusk: 'At Dusk', night: 'Dead of Night' }[getTimeOfDay()];

  return (
    <div className="w-full max-w-sm mx-auto px-4 animate-slide-up">
      <div className="glass-card p-5 mb-4 border border-slate-mid/60 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-crimson/5 to-transparent" />
        <p className="text-[10px] uppercase tracking-widest text-text-muted mb-2 font-heading">{timeLabel} · Demon Slayer Corps</p>
        <p className="text-lg font-heading font-bold text-text-primary leading-snug">"{greeting}"</p>
        <div className="flex items-center justify-center gap-2 mt-3">
          <CrowSVG style={{ width: 28, height: 28 }} />
          <p className="text-xs text-text-muted italic">— Kasugai Crow</p>
        </div>
      </div>

      <div className="glass-card border border-white/10 overflow-hidden">
        <div className="bg-white/5 px-4 py-2.5 flex items-center gap-2 border-b border-white/10">
          <Scroll className="w-4 h-4 text-white" />
          <span className="text-xs font-bold uppercase tracking-widest text-zinc-300">Today's Bounties</span>
        </div>
        <div className="p-4 space-y-3">
          {missions.map((m, i) => (
            <div
              key={m.id}
              className="flex items-center gap-3 animate-slide-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <span className="text-lg">{m.icon}</span>
              <div className="flex-1">
                <p className="text-sm text-text-primary">{m.text}</p>
              </div>
              <span className="text-xs font-bold text-white bg-white/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                +{m.xp} XP
              </span>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onSkip}
        className="btn-primary w-full mt-4 py-3 text-sm tracking-wide"
        id="launch-enter"
      >
        Begin Training
      </button>
      <p className="text-center text-text-muted text-[10px] mt-2 italic">
        Crow delivers this scroll once per day.
      </p>
    </div>
  );
}

// --- Main LaunchSequence ---
export default function LaunchSequence({ onComplete }) {
  const { profile } = useAuthStore();
  const [phase, setPhase] = useState('fly'); // fly | perch | scroll | wipe
  const [feathers, setFeathers] = useState([]);

  const missions = profile ? generateMissions(profile) : [];

  useEffect(() => {
    const today = todayKey();
    const seen = localStorage.getItem('launch_seen');
    if (seen === today) {
      onComplete();
      return;
    }

    // Phase timeline: fly → perch (with feathers) → scroll
    const t1 = setTimeout(() => {
      setPhase('perch');
      // Spawn feathers when crow lands
      setFeathers(
        Array.from({ length: 8 }, (_, i) => ({
          id: i,
          left: `${30 + Math.random() * 40}%`,
          top: `${10 + Math.random() * 20}%`,
          delay: `${i * 150}ms`,
          duration: `${3 + Math.random() * 2}s`,
        }))
      );
    }, 1600);

    const t2 = setTimeout(() => {
      setPhase('scroll');
    }, 3200);

    // Hard fallback: Force skip after max duration
    const fallback = setTimeout(() => {
      console.warn('[LaunchSequence] Hard fallback triggered');
      localStorage.setItem('launch_seen', todayKey());
      onComplete();
    }, 5000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(fallback);
    };
  }, [onComplete]);

  const handleSkip = () => {
    setPhase('wipe');
    setTimeout(() => {
      localStorage.setItem('launch_seen', todayKey());
      onComplete();
    }, 650);
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-void overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at center, #12121e 0%, #050508 100%)' }}
    >
      {/* Screen wipe out */}
      {phase === 'wipe' && (
        <div
          className="fixed inset-0 z-[300] bg-abyss"
          style={{ animation: 'screen-wipe 0.65s ease-out forwards' }}
        />
      )}

      {/* Skip button */}
      {(phase === 'fly' || phase === 'perch' || phase === 'scroll') && (
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 z-10 flex items-center gap-2 rounded-md border border-white/20 bg-zinc-800/70 px-3 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md transition-colors hover:bg-zinc-700/80"
          aria-label="Skip intro"
          id="skip-launch"
        >
          <X className="w-4 h-4" />
          Enter now
        </button>
      )}

      {/* Background particle shimmer */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${10 + i * 12}%`,
              bottom: `${20 + (i % 3) * 15}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${3 + i * 0.5}s`,
              animation: 'particle-rise 4s ease-out infinite',
              opacity: 0.25,
            }}
          />
        ))}
      </div>

      {/* Crow Fly-In + Perch Phase */}
      {(phase === 'fly' || phase === 'perch') && (
        <div className="flex flex-col items-center justify-center gap-8">
          {/* Falling feathers */}
          {feathers.map((f) => (
            <Feather
              key={f.id}
              duration={f.duration}
              style={{ left: f.left, top: f.top, animationDelay: f.delay }}
            />
          ))}

          {/* Crow */}
          <div className="relative">
            {/* Glow platform */}
            {phase === 'perch' && (
              <div
                className="absolute bottom-0 left-1/2 -translate-x-1/2 w-32 h-4 rounded-full"
                style={{
                  background: 'radial-gradient(ellipse, rgba(150,100,255,0.3) 0%, transparent 70%)',
                  animation: 'pulse-glow 2s ease-in-out infinite',
                }}
              />
            )}

            <div
              style={{
                filter: 'drop-shadow(0 0 30px rgba(150,100,255,0.4))',
                animation: phase === 'fly'
                  ? 'crow-land 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards'
                  : 'crow-hover 3s ease-in-out infinite',
              }}
            >
              <CrowSVG />
            </div>
          </div>

          <div className="text-center">
            <p
              className="text-text-muted text-sm uppercase tracking-[0.3em] font-heading"
              style={{ animation: 'pulse-glow 2s ease-in-out infinite' }}
            >
              {phase === 'fly' ? 'Kasugai Crow Approaching...' : 'Dispatching Daily Scroll...'}
            </p>
            {phase === 'perch' && (
              <div className="flex gap-1 justify-center mt-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-purple-400/60"
                    style={{ animation: `pulse-glow 1s ease-in-out ${i * 0.2}s infinite` }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Scroll Phase */}
      {phase === 'scroll' && (
        <GreetScroll profile={profile} missions={missions} onSkip={handleSkip} />
      )}
    </div>
  );
}
