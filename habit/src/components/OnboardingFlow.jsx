import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { applyElementTheme } from '../lib/worldState';
import { seededRange } from '../lib/deterministicRandom';
import {
  Sword, Droplets, Flame, Zap, Wind, Mountain,
  CloudFog, Heart, Waves, Bug, Moon, Sun,
  ChevronRight, Check, Star
} from 'lucide-react';

const BREATHING_STYLES = [
  { id: 'Water',   label: 'Water',   kanji: '水の呼吸', desc: 'Calm, flowing, adaptive. The most widely practiced style.',       color: '#3b82f6', glow: '#60a5fa', Icon: Droplets },
  { id: 'Flame',   label: 'Flame',   kanji: '炎の呼吸', desc: 'Fierce and passionate. Burns through all obstacles.',              color: '#f97316', glow: '#fb923c', Icon: Flame    },
  { id: 'Thunder', label: 'Thunder', kanji: '雷の呼吸', desc: 'Lightning fast. Strikes before the enemy can react.',              color: '#eab308', glow: '#facc15', Icon: Zap      },
  { id: 'Wind',    label: 'Wind',    kanji: '風の呼吸', desc: 'Unpredictable and free. Overwhelms with sheer force.',             color: '#22c55e', glow: '#4ade80', Icon: Wind     },
  { id: 'Stone',   label: 'Stone',   kanji: '岩の呼吸', desc: 'Unyielding and resilient. An immovable force.',                   color: '#78716c', glow: '#a8a29e', Icon: Mountain },
  { id: 'Mist',    label: 'Mist',    kanji: '霞の呼吸', desc: 'Elusive and deceptive. Enemies cannot predict it.',               color: '#06b6d4', glow: '#22d3ee', Icon: CloudFog },
  { id: 'Love',    label: 'Love',    kanji: '恋の呼吸', desc: 'Graceful and irresistible. Enchants all who witness it.',          color: '#ec4899', glow: '#f472b6', Icon: Heart    },
  { id: 'Serpent', label: 'Serpent', kanji: '蛇の呼吸', desc: 'Sinuous and cunning. Twists to reach any angle.',                 color: '#6366f1', glow: '#818cf8', Icon: Waves    },
  { id: 'Insect',  label: 'Insect',  kanji: '蟲の呼吸', desc: 'Precise and deadly. Targets the nervous system directly.',        color: '#8b5cf6', glow: '#a78bfa', Icon: Bug      },
  { id: 'Moon',    label: 'Moon',    kanji: '月の呼吸', desc: 'Legendary and rare. Pushes the body beyond its limits.',          color: '#3b5998', glow: '#5b7bc2', Icon: Moon     },
  { id: 'Sun',     label: 'Sun',     kanji: '日の呼吸', desc: 'The original breathing style. The pinnacle of all forms.',        color: '#fbbf24', glow: '#fcd34d', Icon: Sun      },
];

const CROW_MESSAGES = [
  "Caw! A new slayer has appeared!",
  "My name is... well, it doesn't matter. I'll be delivering your missions.",
  "Together, we'll keep the village safe from demons.",
  "Every day you train, I grow stronger too. Every day you skip... don't make me angry.",
  "Let's begin. Choose your breathing style, warrior."
];

const STEPS = ['welcome', 'breathing', 'sword', 'crow', 'ready'];

const ONBOARDING_PARTICLES = Array.from({ length: 12 }, (_, i) => ({
  width: `${seededRange(i + 201, 2, 5)}px`,
  height: `${seededRange(i + 221, 2, 5)}px`,
  left: `${seededRange(i + 241, 0, 100)}%`,
  top: `${seededRange(i + 261, 0, 100)}%`,
  opacity: seededRange(i + 281, 0.15, 0.35),
  animation: `float ${4 + i}s ease-in-out ${i * 0.5}s infinite`,
}));

export default function OnboardingFlow({ onComplete }) {
  const { updateProfile } = useAuthStore();
  const [step, setStep] = useState(0);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [crowMsgIdx, setCrowMsgIdx] = useState(0);
  const [saving, setSaving] = useState(false);

  const currentStep = STEPS[step];

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(s => s + 1);
  };

  const handleSelectStyle = (style) => {
    setSelectedStyle(style);
    applyElementTheme(style.id); // live preview
  };

  const handleCrowNext = () => {
    if (crowMsgIdx < CROW_MESSAGES.length - 1) {
      setCrowMsgIdx(i => i + 1);
    } else {
      handleNext();
    }
  };

  const handleFinish = async () => {
    setSaving(true);
    await updateProfile({
      breathing_element: selectedStyle?.id || 'Water',
      sword_element: selectedStyle?.id || 'Water',
      first_time_setup_completed: true,
    });
    setSaving(false);
    onComplete();
  };

  const selectedColor = selectedStyle?.color || '#dc2626';
  const selectedGlow = selectedStyle?.glow || '#ef4444';

  return (
    <div className="min-h-screen bg-abyss flex items-center justify-center relative overflow-hidden">
      {/* Ambient background glow that reacts to selection */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(ellipse 60% 50% at 50% 50%, ${selectedColor}12 0%, transparent 70%)`,
        }}
      />

      {/* Floating particles */}
      {ONBOARDING_PARTICLES.map((particle, i) => (
        <div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            ...particle,
            background: selectedColor,
          }}
        />
      ))}

      <div className="relative z-10 w-full max-w-2xl mx-4 animate-fade-in">

        {/* Progress Bar */}
        <div className="flex gap-2 mb-8 justify-center">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className="h-1 rounded-full transition-all duration-500"
              style={{
                width: i <= step ? '40px' : '12px',
                background: i <= step ? selectedColor : 'rgba(255,255,255,0.1)',
                boxShadow: i === step ? `0 0 8px ${selectedColor}` : 'none',
              }}
            />
          ))}
        </div>

        {/* ─── STEP 0: WELCOME ─── */}
        {currentStep === 'welcome' && (
          <div className="glass-card p-10 text-center animate-slide-up">
            <div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 mx-auto"
              style={{
                background: 'rgba(220,38,38,0.15)',
                border: '2px solid rgba(220,38,38,0.3)',
                boxShadow: '0 0 40px rgba(220,38,38,0.2)',
                animation: 'breathing 3s ease-in-out infinite',
              }}
            >
              <Sword className="w-12 h-12 text-crimson" strokeWidth={1.5} />
            </div>

            <h1 className="text-4xl font-heading font-extrabold text-text-primary mb-3 tracking-tight">
              Welcome to the Corps
            </h1>
            <p className="text-text-secondary mb-2">
              You survived Final Selection. Now your real training begins.
            </p>
            <p className="text-text-muted text-sm mb-8 max-w-sm mx-auto">
              Complete this initiation to receive your Nichirin Sword and Kasugai Crow companion.
            </p>

            <button
              onClick={handleNext}
              className="btn-primary px-10 py-4 text-lg font-bold inline-flex items-center gap-2"
            >
              Begin Initiation <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ─── STEP 1: BREATHING STYLE SELECTION ─── */}
        {currentStep === 'breathing' && (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-heading font-extrabold text-text-primary mb-2">
                Choose Your Breathing Style
              </h2>
              <p className="text-text-secondary text-sm">
                This defines your elemental affinity and the color of your Nichirin Sword. It can be changed later.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6 max-h-[50vh] overflow-y-auto pr-1">
              {BREATHING_STYLES.map((style) => {
                const isSelected = selectedStyle?.id === style.id;
                const { Icon } = style;
                return (
                  <button
                    key={style.id}
                    onClick={() => handleSelectStyle(style)}
                    className="relative p-4 rounded-2xl text-left transition-all duration-300"
                    style={{
                      background: isSelected
                        ? `linear-gradient(135deg, ${style.color}25, ${style.color}10)`
                        : 'rgba(255,255,255,0.03)',
                      border: `1px solid ${isSelected ? style.color + '60' : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: isSelected ? `0 0 20px ${style.color}20` : 'none',
                      transform: isSelected ? 'scale(1.02)' : 'scale(1)',
                    }}
                  >
                    {isSelected && (
                      <div
                        className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: style.color }}
                      >
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                    <Icon className="w-6 h-6 mb-2" style={{ color: style.color }} />
                    <div className="font-bold text-text-primary text-sm">{style.label}</div>
                    <div className="text-[10px] opacity-50 mb-1 kanji-display">{style.kanji}</div>
                    <div className="text-text-muted text-[11px] leading-tight line-clamp-2">{style.desc}</div>
                  </button>
                );
              })}
            </div>

            <button
              onClick={handleNext}
              disabled={!selectedStyle}
              className="btn-primary w-full py-4 font-bold text-base flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              style={selectedStyle ? { background: selectedColor, boxShadow: `0 0 20px ${selectedColor}40` } : {}}
            >
              {selectedStyle ? (
                <>Seal the {selectedStyle.label} Oath <ChevronRight className="w-5 h-5" /></>
              ) : (
                'Select a Breathing Style'
              )}
            </button>
          </div>
        )}

        {/* ─── STEP 2: SWORD REVEAL ─── */}
        {currentStep === 'sword' && (
          <div className="glass-card p-10 text-center animate-slide-up">
            <div className="relative inline-flex items-center justify-center w-28 h-28 mb-6 mx-auto">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: `radial-gradient(circle, ${selectedColor}30, transparent 70%)`,
                  animation: 'breathing 2s ease-in-out infinite',
                  boxShadow: `0 0 60px ${selectedColor}40`,
                }}
              />
              <Sword
                className="w-14 h-14 relative z-10"
                style={{ color: selectedColor, filter: `drop-shadow(0 0 12px ${selectedGlow})` }}
                strokeWidth={1.5}
              />
            </div>

            <h2 className="text-3xl font-heading font-extrabold text-text-primary mb-3">
              Your Nichirin Sword
            </h2>
            <p className="text-text-secondary mb-2">
              The ore has absorbed the sun's light and taken on your chosen color.
            </p>
            <div
              className="inline-block px-5 py-2 rounded-full text-sm font-bold mb-6"
              style={{ background: `${selectedColor}20`, border: `1px solid ${selectedColor}50`, color: selectedGlow }}
            >
              {selectedStyle?.label} Nichirin Blade
            </div>

            <div className="glass-card p-4 mb-6 text-left border border-white/5">
              <div className="flex justify-between text-xs text-text-muted mb-2">
                <span>Blade Durability</span>
                <span>100 / 100</span>
              </div>
              <div className="w-full h-2 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: '100%',
                    background: `linear-gradient(90deg, ${selectedColor}, ${selectedGlow})`,
                    boxShadow: `0 0 10px ${selectedColor}`,
                  }}
                />
              </div>
              <p className="text-xs text-text-muted mt-2 opacity-60">
                Complete daily training to maintain your sword's edge.
              </p>
            </div>

            <button
              onClick={handleNext}
              className="btn-primary px-10 py-4 font-bold inline-flex items-center gap-2"
              style={{ background: selectedColor, boxShadow: `0 0 20px ${selectedColor}40` }}
            >
              Receive the Sword <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}

        {/* ─── STEP 3: CROW INTRODUCTION ─── */}
        {currentStep === 'crow' && (
          <div className="animate-slide-up">
            <div className="text-center mb-6">
              <h2 className="text-3xl font-heading font-extrabold text-text-primary mb-2">
                Your Kasugai Crow
              </h2>
              <p className="text-text-secondary text-sm">It has been assigned to you by Master Ubuyashiki.</p>
            </div>

            <div className="glass-card p-8">
              {/* Crow SVG */}
              <div className="flex justify-center mb-6">
                <div className="relative">
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(30,10,40,0.8) 0%, transparent 70%)',
                      transform: 'scale(2)',
                    }}
                  />
                  <svg viewBox="0 0 120 120" width="160" height="160" className="relative z-10" style={{ filter: 'drop-shadow(0 0 20px rgba(150,100,255,0.3))' }}>
                    {/* Body */}
                    <ellipse cx="60" cy="72" rx="28" ry="22" fill="#1a0a2e" />
                    {/* Wing */}
                    <path d="M32 65 Q15 55 20 40 Q35 55 50 60Z" fill="#120820" />
                    <path d="M88 65 Q105 55 100 40 Q85 55 70 60Z" fill="#120820" />
                    {/* Head */}
                    <ellipse cx="60" cy="44" rx="18" ry="16" fill="#1a0a2e" />
                    {/* Eyes */}
                    <circle cx="54" cy="42" r="4" fill="#fff" />
                    <circle cx="66" cy="42" r="4" fill="#fff" />
                    <circle cx="55" cy="42" r="2.5" fill="#1a0a2e" />
                    <circle cx="67" cy="42" r="2.5" fill="#1a0a2e" />
                    <circle cx="55.5" cy="41.5" r="0.8" fill="#fff" />
                    <circle cx="67.5" cy="41.5" r="0.8" fill="#fff" />
                    {/* Beak */}
                    <path d="M57 50 L60 56 L63 50Z" fill="#f59e0b" />
                    {/* Talons */}
                    <line x1="50" y1="93" x2="44" y2="104" stroke="#1a0a2e" strokeWidth="3" strokeLinecap="round" />
                    <line x1="60" y1="94" x2="60" y2="106" stroke="#1a0a2e" strokeWidth="3" strokeLinecap="round" />
                    <line x1="70" y1="93" x2="76" y2="104" stroke="#1a0a2e" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  {/* Thought bubble animation */}
                  <div className="absolute -top-2 -right-2">
                    <div
                      className="w-2 h-2 rounded-full bg-purple-400/60"
                      style={{ animation: 'float 1.5s ease-in-out infinite' }}
                    />
                  </div>
                </div>
              </div>

              {/* Speech bubble */}
              <div
                className="relative rounded-2xl p-5 mb-6"
                style={{
                  background: 'rgba(150,100,255,0.08)',
                  border: '1px solid rgba(150,100,255,0.2)',
                }}
              >
                <div className="absolute -top-3 left-8 w-0 h-0" style={{
                  borderLeft: '8px solid transparent',
                  borderRight: '8px solid transparent',
                  borderBottom: '12px solid rgba(150,100,255,0.2)',
                }} />
                <p key={crowMsgIdx} className="text-text-primary text-sm leading-relaxed font-medium animate-fade-in italic">
                  "{CROW_MESSAGES[crowMsgIdx]}"
                </p>
                <div className="flex justify-end mt-2 gap-1">
                  {CROW_MESSAGES.map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-all"
                      style={{ background: i === crowMsgIdx ? '#a78bfa' : 'rgba(255,255,255,0.2)' }}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleCrowNext}
                className="btn-primary w-full py-4 font-bold inline-flex items-center justify-center gap-2"
              >
                {crowMsgIdx < CROW_MESSAGES.length - 1 ? (
                  <><Star className="w-4 h-4" /> Continue</>
                ) : (
                  <>Understood, Crow <ChevronRight className="w-5 h-5" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP 4: READY ─── */}
        {currentStep === 'ready' && (
          <div className="glass-card p-10 text-center animate-slide-up">
            <div
              className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-6 mx-auto"
              style={{
                background: `${selectedColor}20`,
                border: `2px solid ${selectedColor}50`,
                boxShadow: `0 0 60px ${selectedColor}30`,
                animation: 'breathing 2.5s ease-in-out infinite',
              }}
            >
              <Check className="w-12 h-12" style={{ color: selectedColor }} />
            </div>

            <h2 className="text-4xl font-heading font-extrabold text-text-primary mb-3 tracking-tight">
              You Are Ready
            </h2>
            <p className="text-text-secondary mb-1">
              Breathing Style: <span className="font-bold" style={{ color: selectedColor }}>{selectedStyle?.label || 'Water'}</span>
            </p>
            <p className="text-text-muted text-sm mb-8">
              Your Nichirin Sword has been forged. Your Crow awaits your orders. Begin your mission.
            </p>

            <button
              onClick={handleFinish}
              disabled={saving}
              className="btn-primary px-12 py-4 text-lg font-bold inline-flex items-center gap-2 disabled:opacity-50"
              style={{ background: selectedColor, boxShadow: `0 0 30px ${selectedColor}50` }}
            >
              {saving ? (
                <><div className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white animate-spin" /> Enlisting...</>
              ) : (
                <>Enter the Village <ChevronRight className="w-5 h-5" /></>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
