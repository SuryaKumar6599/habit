import { Skull, AlertTriangle, Swords } from 'lucide-react';

const TIER_COLORS = {
  'Lower Moon':         { text: 'text-violet-400', border: 'border-violet-500/40', bg: '#6366f115', glow: '#6366f1' },
  'Lower Moon Senior':  { text: 'text-orange-400', border: 'border-orange-500/40', bg: '#f9731615', glow: '#f97316' },
  'Upper Moon':         { text: 'text-red-400',    border: 'border-red-600/50',    bg: '#dc262615', glow: '#dc2626' },
};

function CorruptionBar({ pct, color }) {
  return (
    <div className="w-full h-1.5 rounded-full bg-amber-900/12 border border-amber-700/12 overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }}
      />
    </div>
  );
}

export default function DemonPanel({ demons, compactRail = false }) {
  if (!demons || demons.length === 0) return null;

  const hasBoss = demons.some(d => d.isBoss);

  return (
    <div className="mb-6 animate-slide-up">
      {/* Panel header */}
      <div className="flex items-center gap-2 mb-3">
        <Skull className="w-4 h-4 text-crimson" />
        <h2 className="text-xs font-bold uppercase tracking-widest text-crimson">
          Active Demons — {demons.length} threat{demons.length > 1 ? 's' : ''} detected
        </h2>
        {hasBoss && (
          <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-red-400 animate-pulse">
            Boss Encounter Available
          </span>
        )}
      </div>

      <div className={compactRail ? 'mobile-card-rail' : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'}>
        {demons.map((demon) => {
          const style = TIER_COLORS[demon.tier] ?? TIER_COLORS['Lower Moon'];

          return (
            <div
              key={demon.techniqueId}
              className={`interactive-card glass-card p-4 border ${style.border} relative overflow-hidden ${compactRail ? 'min-w-[82vw] snap-start' : ''}`}
              style={{ background: style.bg }}
            >
              {/* Glow pulse for boss */}
              {demon.isBoss && (
                <div
                  className="absolute inset-0 pointer-events-none animate-demon-pulse"
                  style={{ background: `radial-gradient(circle, ${style.glow}22, transparent 70%)` }}
                />
              )}

              <div className="flex items-start justify-between mb-1 relative z-10">
                <div>
                  <p className={`text-sm font-heading font-bold ${style.text}`}>
                    {demon.name}
                  </p>
                  <p className="text-[10px] text-text-muted uppercase tracking-wider">{demon.tier}</p>
                </div>
                <div className="flex items-center gap-1">
                  {demon.isBoss
                    ? <Swords className="w-4 h-4 text-red-400 animate-pulse" />
                    : <AlertTriangle className="w-3.5 h-3.5 text-orange-400" />
                  }
                </div>
              </div>

              <p className="text-xs text-text-secondary relative z-10 mt-1">
                Born from:{' '}
                <span className="text-text-primary font-semibold">{demon.techniqueName}</span>
              </p>
              <p className="text-[10px] text-text-muted mt-0.5 relative z-10">
                {demon.missedDays} day{demon.missedDays > 1 ? 's' : ''} without training
              </p>

              <CorruptionBar pct={demon.corruption} color={style.glow} />
              <p className="text-[10px] text-text-muted mt-1 relative z-10">
                Corruption: {demon.corruption}%
              </p>

              {demon.isBoss && (
                <p className="text-[10px] text-red-400 font-bold mt-2 relative z-10">
                  Complete a 90-min Encounter to banish this demon.
                </p>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-[10px] text-text-muted mt-3 italic">
        Complete the associated habit 3 days in a row to drive these demons away.
      </p>
    </div>
  );
}
