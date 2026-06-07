/**
 * SlayerStatusDashboard.jsx
 * The primary RPG identity card. Shows: Rank, Archetype, Sword Tier,
 * Growth Multiplier, Training Efficiency, next-rank progress, and Corruption.
 */
import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import useHabitStore from '../stores/habitStore';
import useGrowthStore from '../stores/growthStore';
import { TrendingUp, Swords, Sparkles, Skull, ChevronRight } from 'lucide-react';

export default function SlayerStatusDashboard() {
  const { profile, user } = useAuthStore();
  const { techniques, allLogs, fetchAllLogs } = useHabitStore();
  const {
    recompute, syncProfileMetrics,
    daysTrained, consistencyPercent, growthMultiplier,
    corruptionIndex, corruptionLevel, swordTier,
    currentRank, nextRank, progressToNextRank,
    archetypeData,
  } = useGrowthStore();

  // Recompute whenever data changes
  useEffect(() => {
    if (profile && techniques) {
      recompute(profile, allLogs, techniques);
    }
  }, [profile, allLogs, techniques, recompute]);

  // Sync back to DB once computed
  useEffect(() => {
    if (user && growthMultiplier > 1) {
      syncProfileMetrics(user.id);
    }
  }, [growthMultiplier, user, syncProfileMetrics]);

  // Fetch logs on mount
  useEffect(() => {
    if (user) fetchAllLogs(user.id);
  }, [user, fetchAllLogs]);

  const rankColor = currentRank.color;
  const corruptColor = corruptionLevel?.color || '#22c55e';

  return (
    <div
      className="glass-card p-5 md:p-6 relative overflow-hidden"
      style={{ borderTop: `3px solid ${rankColor}` }}
    >
      {/* Background rank glow */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-10 pointer-events-none"
        style={{ background: `radial-gradient(circle, ${rankColor}, transparent 70%)` }}
      />

      {/* Corruption veil overlay */}
      {corruptionIndex > 50 && (
        <div
          className="absolute inset-0 pointer-events-none rounded-xl"
          style={{
            background: `radial-gradient(ellipse at bottom right, ${corruptColor}18, transparent 70%)`,
            animation: 'pulse 3s ease-in-out infinite',
          }}
        />
      )}

      <div className="relative z-10">
        {/* ── Top Row: Identity ── */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-4 mb-5">

          {/* Rank Badge */}
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${rankColor}25, ${rankColor}08)`,
              border: `2px solid ${rankColor}50`,
              boxShadow: `0 0 24px ${rankColor}20`,
            }}
          >
            <span className="kanji-display text-3xl" style={{ color: rankColor }}>
              {currentRank.kanji}
            </span>
          </div>

          {/* Name + Archetype */}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-0.5">
              {profile?.display_name || 'Slayer'}
            </p>
            <p className="text-xl font-heading font-extrabold" style={{ color: rankColor }}>
              {currentRank.rank}
            </p>
            <p className="text-sm text-text-secondary mt-0.5">
              {archetypeData?.name || 'Path Unforged'} · {swordTier}
            </p>
            {archetypeData && (
              <p className="text-xs text-text-muted mt-1 italic">{archetypeData.desc}</p>
            )}
          </div>

          {/* Days trained badge */}
          <div className="text-right shrink-0">
            <p className="text-3xl font-heading font-extrabold" style={{ color: rankColor }}>
              {daysTrained}
            </p>
            <p className="text-xs text-text-muted uppercase tracking-wider">Days Trained</p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          {[
            { label: 'Training Eff.', value: `${consistencyPercent}%`, icon: Sparkles, color: '#a78bfa' },
            { label: 'Growth',        value: `${growthMultiplier.toFixed(2)}×`, icon: TrendingUp, color: '#34d399' },
            { label: 'Sword',         value: swordTier.split(' ').slice(-1)[0], icon: Swords, color: rankColor },
            { label: 'Corruption',    value: `${corruptionIndex}%`, icon: Skull, color: corruptColor },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/3 rounded-xl p-3 flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${color}15` }}
              >
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-text-muted truncate">{label}</p>
                <p className="text-sm font-heading font-bold" style={{ color }}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Rank Promotion Progress ── */}
        {nextRank && (
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-xs text-text-muted font-semibold flex items-center gap-1">
                <ChevronRight className="w-3 h-3" /> Promotion to {nextRank.rank}
              </span>
              <span className="text-xs font-mono" style={{ color: rankColor }}>
                {progressToNextRank}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000"
                style={{
                  width: `${progressToNextRank}%`,
                  background: `linear-gradient(90deg, ${rankColor}aa, ${rankColor})`,
                  boxShadow: `0 0 10px ${rankColor}50`,
                }}
              />
            </div>
            <p className="text-xs text-text-muted mt-1.5">
              {progressToNextRank < 30
                ? `Keep your resolve, ${currentRank.rank}. The path to ${nextRank.rank} is long.`
                : progressToNextRank < 70
                ? `You are ${progressToNextRank}% toward ${nextRank.rank}. Do not slow your training.`
                : `You are close. ${100 - progressToNextRank}% remains before your promotion.`}
            </p>
          </div>
        )}

        {/* ── Corruption Warning ── */}
        {corruptionIndex > 25 && (
          <div
            className="mt-4 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2"
            style={{
              background: `${corruptColor}15`,
              border: `1px solid ${corruptColor}30`,
              color: corruptColor,
            }}
          >
            <Skull className="w-4 h-4 shrink-0" />
            {corruptionLevel.label} detected · Reduce missed training to purify
          </div>
        )}
      </div>
    </div>
  );
}
