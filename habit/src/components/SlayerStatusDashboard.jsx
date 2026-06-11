/**
 * SlayerStatusDashboard.jsx
 * The primary RPG identity card. Shows: Rank, Archetype, Sword Tier,
 * Growth Multiplier, Training Efficiency, next-rank progress, and Corruption.
 */
import { useEffect, useRef } from 'react';
import { useAuthStore, getRankInfo } from '../stores/authStore';
import useHabitStore from '../stores/habitStore';
import useGrowthStore from '../stores/growthStore';
import { supabase } from '../lib/supabaseClient';
import { todayKey } from '../lib/dateKeys';
import HashiraExamBanner from './HashiraExamBanner';
import { sendCrowMessageOncePerDay, CROW_MESSAGE_TYPES } from '../lib/crowMessages';
import useCrowStore from '../stores/crowStore';
import { getWeekRecapStats } from '../lib/trainingAnalytics';
import { TrendingUp, Swords, Sparkles, Skull, ChevronRight } from 'lucide-react';

export default function SlayerStatusDashboard() {
  const { profile, user, fetchProfile } = useAuthStore();
  const { techniques, allLogs, fetchAllLogs } = useHabitStore();
  const {
    recompute, syncProfileMetrics, saveSnapshot, fetchSnapshots, snapshots,
    daysTrained, consistencyPercent, growthMultiplier,
    corruptionIndex, corruptionLevel, swordTier,
    currentRank, nextRank, progressToNextRank,
    archetypeData,
  } = useGrowthStore();
  const maintenanceRan = useRef(false);
  const weeklyRecapRan = useRef(false);
  const xpRank = getRankInfo(profile?.total_xp || 0);

  // Recompute whenever data changes
  useEffect(() => {
    if (profile && techniques) {
      recompute(profile, allLogs, techniques);
    }
  }, [profile, allLogs, techniques, snapshots, recompute]);

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

  // Daily maintenance: wisteria eligibility, ward expiry, growth snapshots
  useEffect(() => {
    if (!user || maintenanceRan.current) return;
    maintenanceRan.current = true;

    const runMaintenance = async () => {
      const tokensBefore = profile?.wisteria_tokens ?? 0;

      await supabase.rpc('expire_wisteria_wards');
      await supabase.rpc('check_wisteria_eligibility', { target_user_id: user.id });
      await fetchProfile(user.id);

      const tokensAfter = useAuthStore.getState().profile?.wisteria_tokens ?? 0;
      if (tokensAfter > tokensBefore) {
        const msg = await sendCrowMessageOncePerDay(user.id, todayKey(), 'wisteria-token', {
          title: 'Wisteria Ward Earned',
          content: `Your consistent training earned a Wisteria recovery ward (${tokensAfter}/3). Visit the Butterfly Mansion to activate rest.`,
          type: CROW_MESSAGE_TYPES.milestone,
        });
        if (msg) useCrowStore.getState().prependMessage(msg);
      }

      const snapshotKey = `growth-snapshot-${user.id}`;
      if (localStorage.getItem(snapshotKey) !== todayKey()) {
        await saveSnapshot(user.id);
        localStorage.setItem(snapshotKey, todayKey());
      }
      await fetchSnapshots(user.id);
    };

    runMaintenance();
  }, [user, fetchProfile, saveSnapshot, fetchSnapshots, profile?.wisteria_tokens]);

  // Monday weekly training recap
  useEffect(() => {
    if (!user || !techniques.length || weeklyRecapRan.current) return;
    if (new Date().getDay() !== 1) return;

    weeklyRecapRan.current = true;

    const sendRecap = async () => {
      const stats = getWeekRecapStats(techniques, allLogs);
      const msg = await sendCrowMessageOncePerDay(user.id, todayKey(), 'weekly-recap', {
        title: 'Weekly Training Report',
        content: `Last 7 days: ${stats.completions}/${stats.expected} forms (${stats.percentage}%). ${
          stats.percentage >= 80
            ? 'The Hashira have been informed of your discipline.'
            : 'The demons gained ground. Train harder this week.'
        }`,
        type: CROW_MESSAGE_TYPES.milestone,
      });
      if (msg) useCrowStore.getState().prependMessage(msg);
    };

    sendRecap();
  }, [user, techniques, allLogs]);

  const rankColor = currentRank.color;
  const corruptColor = corruptionLevel?.color || '#22c55e';

  return (
    <div
      className="glass-card p-4 md:p-5 relative overflow-hidden"
      style={{ borderTop: `2px solid ${rankColor}` }}
    >
      <div
        className="absolute inset-x-0 top-0 h-28 pointer-events-none opacity-70"
        style={{
          background: `linear-gradient(115deg, ${rankColor}18, transparent 44%), linear-gradient(180deg, rgba(255,255,255,0.04), transparent)`,
        }}
      />

      {/* Corruption veil overlay */}
      {corruptionIndex > 50 && (
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
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
            className="w-16 h-16 rounded-lg flex items-center justify-center shrink-0"
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
            <p className="section-label mb-1">
              {profile?.display_name || 'Slayer'}
            </p>
            <p className="text-2xl font-heading font-extrabold leading-none" style={{ color: rankColor }}>
              {currentRank.rank}
            </p>
            <p className="text-sm text-text-secondary mt-0.5">
              {archetypeData?.name || 'Path Unforged'} · {swordTier}
            </p>
            <p className="text-[10px] text-text-muted mt-1">
              Corps XP Rank: {xpRank.current.rank} · {profile?.total_xp?.toLocaleString() || 0} XP
            </p>
            {archetypeData && (
              <p className="text-xs text-text-muted mt-1 italic">{archetypeData.desc}</p>
            )}
          </div>

          {/* Days trained badge */}
          <div className="sm:text-right shrink-0 bg-white/5 border border-white/10 rounded-lg px-4 py-3">
            <p className="text-3xl font-heading font-extrabold leading-none" style={{ color: rankColor }}>
              {daysTrained}
            </p>
            <p className="section-label !text-[9px] mt-1">Days Trained</p>
          </div>
        </div>

        {/* ── Stats Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-5">
          {[
            { label: 'Training Eff.', value: `${consistencyPercent}%`, icon: Sparkles, color: '#a78bfa' },
            { label: 'Growth',        value: `${growthMultiplier.toFixed(2)}×`, icon: TrendingUp, color: '#34d399' },
            { label: 'Sword',         value: swordTier.split(' ').slice(-1)[0], icon: Swords, color: rankColor },
            { label: 'Corruption',    value: `${corruptionIndex}%`, icon: Skull, color: corruptColor },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-3 flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
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
            <div className="h-2 rounded-full bg-white/5 overflow-hidden border border-white/10">
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

        <HashiraExamBanner />

        {/* ── Corruption Warning ── */}
        {corruptionIndex > 25 && (
          <div
            className="mt-4 rounded-lg px-4 py-2.5 text-xs font-semibold flex items-center gap-2"
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
