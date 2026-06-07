import { useAuthStore, getRankInfo, RANK_THRESHOLDS } from '../stores/authStore';
import useHabitStore from '../stores/habitStore';
import { Shield, Swords, Heart, TrendingUp, Sparkles } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function RankStatusCard() {
  const { profile } = useAuthStore();
  const { getTodayProgress } = useHabitStore();
  const [showRankUp, setShowRankUp] = useState(false);
  const [prevRank, setPrevRank] = useState(null);

  const totalXp = profile?.total_xp || 0;
  const stamina = profile?.current_stamina || 100;
  const maxStamina = profile?.max_stamina || 100;
  const rankInfo = getRankInfo(totalXp);
  const progress = getTodayProgress();

  // Detect rank-up
  useEffect(() => {
    if (prevRank && prevRank !== rankInfo.current.rank) {
      setShowRankUp(true);
      const timer = setTimeout(() => setShowRankUp(false), 3000);
      return () => clearTimeout(timer);
    }
    setPrevRank(rankInfo.current.rank);
  }, [rankInfo.current.rank]);

  const staminaPercent = Math.round((stamina / maxStamina) * 100);
  
  const growthMultiplier = profile?.growth_multiplier || 1.0;
  const consistencyPercent = profile?.consistency_percent || 0;
  const swordTier = profile?.sword_tier || 'Wooden Sword';
  const archetype = profile?.archetype || 'Unassigned';
  const resonanceLevel = profile?.resonance_level || 1;

  const getStaminaColor = (pct) => {
    if (pct > 60) return 'var(--color-hp-full)';
    if (pct > 30) return 'var(--color-hp-mid)';
    return 'var(--color-hp-low)';
  };

  const getRankColor = (rank) => {
    const colors = {
      Mizunoto: '#64748b', Mizunoe: '#3b82f6', Kanoto: '#06b6d4',
      Kanoe: '#22c55e', Tsuchinoto: '#eab308', Tsuchinoe: '#f97316',
      Hinoto: '#ef4444', Hinoe: '#ec4899', Kinoto: '#8b5cf6',
      Kinoe: '#6366f1', Hashira: '#fbbf24',
    };
    return colors[rank] || '#64748b';
  };

  const rankColor = getRankColor(rankInfo.current.rank);

  return (
    <div className="glass-card p-5 md:p-6 relative overflow-hidden">
      {/* Rank-up celebration overlay */}
      {showRankUp && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center animate-fade-in"
          style={{
            background: 'rgba(10,10,18,0.85)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <div className="text-center animate-rank-up">
            <Sparkles className="w-10 h-10 mx-auto mb-3" style={{ color: rankColor }} />
            <p className="text-text-secondary text-xs uppercase tracking-widest mb-1">Rank Promotion</p>
            <p className="text-3xl font-heading font-extrabold" style={{ color: rankColor }}>
              {rankInfo.current.rank}
            </p>
            <p className="kanji-display text-5xl mt-2" style={{ color: rankColor, opacity: 0.6 }}>
              {rankInfo.current.kanji}
            </p>
          </div>
        </div>
      )}

      {/* Background glow */}
      <div
        className="absolute -top-20 -right-20 w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${rankColor}, transparent 70%)`,
        }}
      />

      <div className="relative z-10">
        {/* Top Row: Rank Badge + Stats */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
          {/* Rank Badge */}
          <div className="flex items-center gap-3.5">
            <div
              className="relative w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                background: `linear-gradient(135deg, ${rankColor}20, ${rankColor}08)`,
                border: `2px solid ${rankColor}40`,
                boxShadow: `0 0 20px ${rankColor}15`,
              }}
            >
              <span className="kanji-display text-2xl" style={{ color: rankColor }}>
                {rankInfo.current.kanji}
              </span>
              {rankInfo.current.rank === 'Hashira' && (
                <div
                  className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: rankColor }}
                >
                  <Sparkles className="w-3 h-3 text-void" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs text-text-muted uppercase tracking-widest font-semibold">Slayer Rank</p>
              <p className="text-lg font-heading font-bold" style={{ color: rankColor }}>
                {rankInfo.current.rank} <span className="text-sm opacity-70 ml-1">Lv.{resonanceLevel}</span>
              </p>
              <p className="text-xs text-text-muted mt-0.5">{archetype} • {swordTier}</p>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="flex gap-4 sm:ml-auto">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-500/10">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Training Eff.</p>
                <p className="text-sm font-heading font-bold text-text-primary">
                  {consistencyPercent}%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-blue-500/10">
                <TrendingUp className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-text-muted">Growth</p>
                <p className="text-sm font-heading font-bold text-text-primary">
                  {growthMultiplier.toFixed(2)}x
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* XP Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-text-muted font-semibold">
              {rankInfo.next ? `Progress to ${rankInfo.next.rank}` : 'Maximum Rank Achieved'}
            </span>
            <span className="text-xs font-mono" style={{ color: rankColor }}>
              {rankInfo.next
                ? `${rankInfo.xpInCurrentRank} / ${rankInfo.xpToNextRank} XP`
                : '∞ XP'
              }
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${rankInfo.progress}%`,
                background: `linear-gradient(90deg, ${rankColor}, ${rankColor}cc)`,
                boxShadow: `0 0 10px ${rankColor}40`,
              }}
            />
          </div>
        </div>

        {/* Stamina / HP Bar */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-xs text-text-muted font-semibold flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" style={{ color: getStaminaColor(staminaPercent) }} />
              Stamina
            </span>
            <span className="text-xs font-mono" style={{ color: getStaminaColor(staminaPercent) }}>
              {stamina} / {maxStamina}
            </span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{
                width: `${staminaPercent}%`,
                background: `linear-gradient(90deg, ${getStaminaColor(staminaPercent)}, ${getStaminaColor(staminaPercent)}aa)`,
                boxShadow: `0 0 8px ${getStaminaColor(staminaPercent)}30`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
