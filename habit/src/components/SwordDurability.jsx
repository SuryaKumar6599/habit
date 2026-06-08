import { Sword } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

const ELEMENT_COLORS = {
  Water:   { bar: '#3b82f6', glow: 'rgba(96,165,250,0.5)'  },
  Flame:   { bar: '#f97316', glow: 'rgba(251,146,60,0.5)'  },
  Thunder: { bar: '#eab308', glow: 'rgba(250,204,21,0.5)'  },
  Wind:    { bar: '#22c55e', glow: 'rgba(74,222,128,0.5)'  },
  Stone:   { bar: '#78716c', glow: 'rgba(168,162,158,0.4)' },
  Mist:    { bar: '#06b6d4', glow: 'rgba(34,211,238,0.5)'  },
  Love:    { bar: '#ec4899', glow: 'rgba(244,114,182,0.5)' },
  Serpent: { bar: '#6366f1', glow: 'rgba(129,140,248,0.5)' },
  Insect:  { bar: '#8b5cf6', glow: 'rgba(167,139,250,0.5)' },
  Moon:    { bar: '#3b5998', glow: 'rgba(91,123,194,0.5)'  },
  Sun:     { bar: '#fbbf24', glow: 'rgba(252,211,77,0.5)'  },
};

export default function SwordDurability() {
  const { profile } = useAuthStore();
  const durability = profile?.sword_durability ?? 100;
  const element = profile?.breathing_element || 'Water';
  const swordRank = profile?.sword_rank || 'Standard';

  const ec = ELEMENT_COLORS[element] || ELEMENT_COLORS.Water;

  // Override with durability-based degradation colors
  let barColor = ec.bar;
  let glowColor = ec.glow;
  let statusText = swordRank;
  let criticalPulse = false;

  if (durability <= 25) {
    barColor = '#ef4444';
    glowColor = 'rgba(239,68,68,0.5)';
    statusText = 'Dull / Chipped';
    criticalPulse = true;
  } else if (durability <= 60) {
    barColor = '#eab308';
    glowColor = 'rgba(234,179,8,0.4)';
    statusText = 'Worn';
  }

  const clampedDurability = Math.max(0, Math.min(100, durability));

  return (
    <div
      className="glass-card p-4 mb-4 relative overflow-hidden"
      style={{ borderLeft: `2px solid ${barColor}40` }}
    >
      {/* Ambient element glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(ellipse at right top, ${glowColor.replace('0.5', '0.08')} 0%, transparent 60%)`,
        }}
      />

      {/* Critical vignette pulse */}
      {criticalPulse && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            boxShadow: 'inset 0 0 30px rgba(239,68,68,0.15)',
            animation: 'vignette-pulse 3s ease-in-out infinite',
          }}
        />
      )}

      <div className="flex items-center justify-between mb-3 relative z-10">
        <div className="flex items-center gap-2">
          <Sword
            className="w-5 h-5"
            style={{
              color: barColor,
              filter: `drop-shadow(0 0 4px ${glowColor})`,
              animation: criticalPulse ? 'pulse-glow 1.5s ease-in-out infinite' : 'none',
            }}
          />
          <h3 className="text-sm font-semibold uppercase tracking-widest text-text-secondary">
            Nichirin Sword
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
            style={{
              color: barColor,
              background: `${barColor}15`,
              border: `1px solid ${barColor}30`,
            }}
          >
            {statusText}
          </span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-amber-900/12 rounded-full h-3 mb-2 border border-amber-700/12 relative overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-1000 relative overflow-hidden"
          style={{
            width: `${clampedDurability}%`,
            background: `linear-gradient(90deg, ${barColor}99, ${barColor})`,
            boxShadow: `0 0 12px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.2)`,
          }}
        >
          {/* Sword glint sweep — only when healthy */}
          {durability > 60 && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 50%, transparent 100%)',
                backgroundSize: '200% 100%',
                animation: 'sword-glint 4s ease-in-out 2s infinite',
              }}
            />
          )}
        </div>
      </div>

      <div className="flex justify-between items-center relative z-10">
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: barColor, boxShadow: `0 0 4px ${glowColor}` }}
          />
          <span className="text-[10px] text-text-muted uppercase tracking-widest">{element} Blade</span>
        </div>
        <p className="text-xs text-text-muted font-mono">{durability} / 100</p>
      </div>
    </div>
  );
}
