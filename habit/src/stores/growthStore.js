/**
 * growthStore.js
 * Central calculation engine for the Total Concentration Growth System.
 * Drives: Growth Multiplier, Breathing Balance, Corruption Index, Archetype, Sword Tier.
 */
import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';
import { parseDateKey, todayKey, toLocalDateKey } from '../lib/dateKeys';

// ---------------------------------------------------------------------------
// CONSTANTS
// ---------------------------------------------------------------------------

export const RANK_THRESHOLDS = [
  { rank: 'Recruit',            kanji: '新',  multiplierMin: 0,     color: '#94a3b8' },
  { rank: 'Mizunoto',           kanji: '癸',  multiplierMin: 1.02,  color: '#64748b' },
  { rank: 'Mizunoe',            kanji: '壬',  multiplierMin: 1.05,  color: '#3b82f6' },
  { rank: 'Kanoto',             kanji: '辛',  multiplierMin: 1.10,  color: '#06b6d4' },
  { rank: 'Kanoe',              kanji: '庚',  multiplierMin: 1.20,  color: '#22c55e' },
  { rank: 'Tsuchinoto',         kanji: '己',  multiplierMin: 1.35,  color: '#eab308' },
  { rank: 'Tsuchinoe',          kanji: '戊',  multiplierMin: 1.55,  color: '#f97316' },
  { rank: 'Hinoto',             kanji: '丁',  multiplierMin: 1.80,  color: '#ef4444' },
  { rank: 'Hinoe',              kanji: '丙',  multiplierMin: 2.10,  color: '#ec4899' },
  { rank: 'Kinoto',             kanji: '乙',  multiplierMin: 2.50,  color: '#8b5cf6' },
  { rank: 'Kinoe',              kanji: '甲',  multiplierMin: 3.00,  color: '#6366f1' },
  { rank: 'Hashira Candidate',  kanji: '候',  multiplierMin: 4.00,  color: '#fbbf24' },
  { rank: 'Hashira',            kanji: '柱',  multiplierMin: 6.00,  color: '#f59e0b' },
  { rank: 'Legendary Hashira',  kanji: '伝',  multiplierMin: 10.00, color: '#fde68a' },
];

export const SWORD_TIERS = [
  { tier: 'Wooden Sword',        minDays: 0,   minConsistency: 0  },
  { tier: 'Standard Nichirin',   minDays: 7,   minConsistency: 50 },
  { tier: 'Refined Blade',       minDays: 30,  minConsistency: 65 },
  { tier: 'Tempered Blade',      minDays: 60,  minConsistency: 75 },
  { tier: 'Elite Nichirin',      minDays: 90,  minConsistency: 80 },
  { tier: 'Breathing Resonance', minDays: 180, minConsistency: 85 },
  { tier: 'Hashira Grade',       minDays: 270, minConsistency: 90 },
  { tier: 'Legendary Nichirin',  minDays: 365, minConsistency: 95 },
];

export const CORRUPTION_LEVELS = [
  { label: 'Protected Village',   maxIndex: 10,  color: '#22c55e' },
  { label: 'Demon Sightings',     maxIndex: 25,  color: '#eab308' },
  { label: 'Lower Moon Presence', maxIndex: 45,  color: '#f97316' },
  { label: 'Upper Moon Threat',   maxIndex: 65,  color: '#ef4444' },
  { label: 'Muzan\'s Domain',     maxIndex: 85,  color: '#8b5cf6' },
  { label: 'Upper Moon Presence', maxIndex: 100, color: '#dc2626' },
];

export const ARCHETYPES = {
  Scholar:  { name: 'Scholar Slayer',  desc: 'Wisdom forged through knowledge', primary: 'Water',   secondary: 'Thunder' },
  Warrior:  { name: 'Warrior Slayer',  desc: 'Power honed in the crucible',     primary: 'Stone',   secondary: 'Flame'   },
  Athlete:  { name: 'Athletic Slayer', desc: 'Speed and endurance perfected',   primary: 'Flame',   secondary: 'Wind'    },
  Ascetic:  { name: 'Mist Ascetic',    desc: 'Discipline above all else',       primary: 'Mist',    secondary: 'Water'   },
  Balanced: { name: 'Total Concentration Master', desc: 'Harmony across all breathing forms', primary: 'Sun', secondary: 'Moon' },
};

// ---------------------------------------------------------------------------
// HELPER FUNCTIONS
// ---------------------------------------------------------------------------

const toLocalDayNumber = (value) => {
  const date = typeof value === 'string' ? parseDateKey(value) : new Date(value);
  return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000);
};

const getDaysTrained = (startDate, createdAt) => {
  const baseKey = startDate || toLocalDateKey(createdAt || new Date());
  const diffDays = toLocalDayNumber(todayKey()) - toLocalDayNumber(baseKey);
  return Math.max(1, diffDays);
};

const computeGrowthMultiplier = (daysTrained, consistencyPct) => {
  const c = consistencyPct / 100;
  // Damped log formula: 1 + log10(t+1) * (0.5 + 0.5*c²)
  return +(1 + Math.log10(daysTrained + 1) * (0.5 + 0.5 * c * c)).toFixed(2);
};

const computeConsistency = (completionLogs, habits, daysTrained) => {
  if (habits.length === 0) return 0;
  const totalExpected = habits.reduce((sum, habit) => {
    const weeklyFrequency = habit.target_frequency_per_week ?? (habit.frequency === 'weekly' ? 1 : 7);
    return sum + Math.max(1, Math.ceil((daysTrained * weeklyFrequency) / 7));
  }, 0);
  const totalDone = completionLogs.length;
  return Math.min(100, Math.round((totalDone / totalExpected) * 100));
};

const computeCorruption = (missLogs, relapseLogs, perfectDays) => {
  let index = 0;
  index += missLogs * 2;
  index += relapseLogs * 15;
  index -= perfectDays * 5;
  return Math.max(0, Math.min(100, Math.round(index)));
};

const computeSwordTier = (daysTrained, consistencyPct) => {
  let result = SWORD_TIERS[0];
  for (const tier of SWORD_TIERS) {
    if (daysTrained >= tier.minDays && consistencyPct >= tier.minConsistency) {
      result = tier;
    }
  }
  return result.tier;
};

const computeRankFromMultiplier = (multiplier) => {
  let rank = RANK_THRESHOLDS[0];
  for (const r of RANK_THRESHOLDS) {
    if (multiplier >= r.multiplierMin) rank = r;
  }
  return rank;
};

const computeArchetype = (breathingBalance) => {
  const entries = Object.entries(breathingBalance);
  if (entries.length === 0) return 'Unassigned';

  // Check balanced: all 6 core styles > 70%
  const coreStyles = ['Water','Thunder','Flame','Stone','Wind','Mist'];
  const allBalanced = coreStyles.every(s => (breathingBalance[s] || 0) >= 70);
  if (allBalanced) return 'Balanced';

  const top = entries.sort((a, b) => b[1] - a[1])[0][0];
  if (top === 'Water' || top === 'Thunder') return 'Scholar';
  if (top === 'Stone' || top === 'Flame')   return 'Warrior';
  if (top === 'Flame' || top === 'Wind')    return 'Athlete';
  if (top === 'Mist')                       return 'Ascetic';
  return 'Scholar';
};

const computeBreathingBalance = (techniques, completionLogs) => {
  const balance = {};
  if (!techniques || techniques.length === 0) return balance;

  // Count logs per breathing element
  const counts = {};
  completionLogs.forEach(log => {
    const tech = techniques.find(t => t.id === (log.technique_id || log.habit_id));
    const el = tech?.breathing_element || tech?.category;
    if (el) counts[el] = (counts[el] || 0) + 1;
  });

  const maxCount = Math.max(1, ...Object.values(counts));
  techniques.forEach(t => {
    const el = t.breathing_element;
    if (el) balance[el] = Math.round(((counts[el] || 0) / maxCount) * 100);
  });

  return balance;
};

// ---------------------------------------------------------------------------
// STORE
// ---------------------------------------------------------------------------

const useGrowthStore = create((set, get) => ({
  // Derived metrics
  daysTrained: 0,
  consistencyPercent: 0,
  growthMultiplier: 1.0,
  corruptionIndex: 0,
  corruptionLevel: CORRUPTION_LEVELS[0],
  swordTier: 'Wooden Sword',
  currentRank: RANK_THRESHOLDS[0],
  nextRank: RANK_THRESHOLDS[1],
  progressToNextRank: 0,
  breathingBalance: {},
  archetype: 'Unassigned',
  archetypeData: null,
  idealPath: [],
  actualPath: [],
  projections: {},
  wisteriaTokens: 0,
  loading: false,
  snapshots: [],

  // Recompute everything from raw profile + logs
  recompute: (profile, allLogs, techniques) => {
    const completionLogs = allLogs.filter(l =>
      !l.activity_type || l.activity_type === 'completion'
    );
    const missLogs = allLogs.filter(l => l.activity_type === 'miss').length;
    const relapseLogs = allLogs.filter(l => l.activity_type === 'relapse').length;

    const daysTrained = getDaysTrained(profile?.start_date, profile?.created_at);
    const consistencyPercent = computeConsistency(completionLogs, techniques, daysTrained);
    const growthMultiplier = computeGrowthMultiplier(daysTrained, consistencyPercent);
    const breathingBalance = computeBreathingBalance(techniques, completionLogs);

    // Calculate perfect days (days where all habits were completed)
    const groupByDate = {};
    completionLogs.forEach(l => {
      const d = l.executed_at || l.logged_date;
      if (d) groupByDate[d] = (groupByDate[d] || 0) + 1;
    });
    const perfectDays = Object.values(groupByDate).filter(c => c >= techniques.length).length;

    const corruptionIndex = computeCorruption(missLogs, relapseLogs, perfectDays);
    const corruptionLevel = CORRUPTION_LEVELS.find(l => corruptionIndex <= l.maxIndex) || CORRUPTION_LEVELS[5];
    const swordTier = computeSwordTier(daysTrained, consistencyPercent);
    const currentRank = computeRankFromMultiplier(growthMultiplier);
    const nextRank = RANK_THRESHOLDS[RANK_THRESHOLDS.indexOf(currentRank) + 1] || null;
    const archetypeKey = computeArchetype(breathingBalance);
    const archetypeData = ARCHETYPES[archetypeKey] || null;

    const progressToNextRank = nextRank
      ? Math.min(100, Math.round(
          ((growthMultiplier - currentRank.multiplierMin) /
           (nextRank.multiplierMin - currentRank.multiplierMin)) * 100
        ))
      : 100;

    // Projections (30/90/180/365 days from now)
    const buildProjection = (extraDays) => {
      const futureDay = daysTrained + extraDays;
      const projMultiplier = computeGrowthMultiplier(futureDay, consistencyPercent);
      const projRank = computeRankFromMultiplier(projMultiplier);
      const projSword = computeSwordTier(futureDay, consistencyPercent);
      return { multiplier: projMultiplier, rank: projRank, sword: projSword };
    };

    const projections = {
      d30:  buildProjection(30),
      d90:  buildProjection(90),
      d180: buildProjection(180),
      d365: buildProjection(365),
    };

    // Growth curve (keep to last 60 days max for perf)
    const cappedDays = Math.min(daysTrained, 90);
    const idealPath = Array.from({ length: cappedDays }, (_, i) => ({
      day: i + 1,
      multiplier: +(1.01 ** (i + 1)).toFixed(3),
    }));
    const actualPath = idealPath.map(p => ({
      day: p.day,
      multiplier: computeGrowthMultiplier(p.day, consistencyPercent),
    }));

    // Wisteria tokens from profile
    const wisteriaTokens = profile?.wisteria_tokens ?? 0;

    set({
      daysTrained, consistencyPercent, growthMultiplier,
      corruptionIndex, corruptionLevel, swordTier,
      currentRank, nextRank, progressToNextRank,
      breathingBalance, archetype: archetypeKey, archetypeData,
      idealPath, actualPath, projections,
      wisteriaTokens,
    });
  },

  // Persist weekly snapshot to Supabase
  saveSnapshot: async (userId) => {
    const s = get();
    await supabase.from('growth_snapshots').upsert({
      user_id: userId,
      snapshot_date: todayKey(),
      days_trained: s.daysTrained,
      consistency_percent: s.consistencyPercent,
      growth_multiplier: s.growthMultiplier,
      corruption_index: s.corruptionIndex,
      snapshot_rank: s.currentRank.rank,
      snapshot_sword_tier: s.swordTier,
      snapshot_breathing_balance: s.breathingBalance,
    }, { onConflict: 'user_id,snapshot_date' });
  },

  fetchSnapshots: async (userId) => {
    const { data } = await supabase
      .from('growth_snapshots')
      .select('*')
      .eq('user_id', userId)
      .order('snapshot_date', { ascending: false })
      .limit(52);
    set({ snapshots: data || [] });
  },

  // Sync computed values back to profiles table
  syncProfileMetrics: async (userId) => {
    const s = get();
    await supabase.from('profiles').update({
      growth_multiplier: s.growthMultiplier,
      consistency_percent: s.consistencyPercent,
      corruption_index: s.corruptionIndex,
      sword_tier: s.swordTier,
      slayer_rank: s.currentRank.rank,
      archetype: s.archetypeData?.name || 'Unassigned',
    }).eq('id', userId);
  },
}));

export default useGrowthStore;
export {
  computeGrowthMultiplier, computeConsistency, computeSwordTier,
  computeRankFromMultiplier, computeBreathingBalance, getDaysTrained,
};
