import { getRankInfo, RANK_THRESHOLDS } from '../stores/authStore';

// Date utility
const getDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

/**
 * Calculates training efficiency (0-100) based on completions vs expectations
 */
export const calculateEfficiency = (techniques, logs, days = 30) => {
  if (!techniques || techniques.length === 0) return 0;
  
  const cutoff = getDaysAgo(days);
  const recentLogs = logs.filter(l => l.logged_date >= cutoff && l.activity_type === 'technique_completion');
  
  // Max possible completions = number of techniques * days
  const expectedCompletions = techniques.length * days;
  const actualCompletions = recentLogs.length;
  
  if (expectedCompletions === 0) return 0;
  return Math.min(100, Math.round((actualCompletions / expectedCompletions) * 100));
};

/**
 * Calculates the ETA (in days) to reach a target rank
 */
export const calculateETA = (currentXp, efficiency, dailyMaxXp, targetRankLevel = 'Hashira') => {
  if (efficiency <= 0 || dailyMaxXp <= 0) return Infinity;
  
  const targetRank = RANK_THRESHOLDS.find(r => r.rank === targetRankLevel);
  if (!targetRank) return Infinity;
  
  const xpNeeded = targetRank.xp - currentXp;
  if (xpNeeded <= 0) return 0;
  
  const dailyExpectedXp = (efficiency / 100) * dailyMaxXp;
  if (dailyExpectedXp <= 0) return Infinity;
  
  return Math.ceil(xpNeeded / dailyExpectedXp);
};

/**
 * Projects the user's rank at a future date
 */
export const projectRank = (currentXp, efficiency, dailyMaxXp, daysInFuture) => {
  const dailyExpectedXp = (efficiency / 100) * dailyMaxXp;
  const projectedXp = currentXp + (dailyExpectedXp * daysInFuture);
  return getRankInfo(projectedXp).current;
};

/**
 * Calculates alternative futures
 */
export const calculateAlternativeFutures = (currentXp, currentEfficiency, dailyMaxXp, targetRank = 'Hashira') => {
  const decliningEfficiency = Math.max(0, currentEfficiency - 20);
  const improvedEfficiency = Math.min(100, currentEfficiency + 18);
  const perfectEfficiency = 95;

  return {
    declining: { efficiency: decliningEfficiency, eta: calculateETA(currentXp, decliningEfficiency, dailyMaxXp, targetRank) },
    current: { efficiency: currentEfficiency, eta: calculateETA(currentXp, currentEfficiency, dailyMaxXp, targetRank) },
    improved: { efficiency: improvedEfficiency, eta: calculateETA(currentXp, improvedEfficiency, dailyMaxXp, targetRank) },
    perfect: { efficiency: perfectEfficiency, eta: calculateETA(currentXp, perfectEfficiency, dailyMaxXp, targetRank) },
  };
};

/**
 * Identifies top growth drivers
 */
export const calculateContribution = (techniques) => {
  const totalTechXp = techniques.reduce((sum, t) => sum + (t.xp || 0), 0);
  if (totalTechXp === 0) return [];

  return techniques
    .map(t => ({
      name: t.form_name,
      xp: t.xp || 0,
      percentage: Math.round(((t.xp || 0) / totalTechXp) * 100)
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 3);
};

/**
 * Determines how dropping a technique affects ETA
 */
export const calculateImpactForecast = (technique, techniques, currentXp, currentEfficiency, dailyMaxXp, targetRank = 'Hashira') => {
  const currentEta = calculateETA(currentXp, currentEfficiency, dailyMaxXp, targetRank);
  
  // Simulate dropping this technique (e.g. 1 less completion per day = -10 max xp effectively, or efficiency drop)
  // We'll simulate a 3 sessions/week drop -> approx -4.2 XP/day.
  const dropPenaltyDailyXp = (3 / 7) * 10; 
  const newDailyExpectedXp = ((currentEfficiency / 100) * dailyMaxXp) - dropPenaltyDailyXp;
  
  if (newDailyExpectedXp <= 0) return Infinity;
  
  const targetXp = RANK_THRESHOLDS.find(r => r.rank === targetRank)?.xp || 8000;
  const xpNeeded = targetXp - currentXp;
  const newEta = Math.ceil(xpNeeded / newDailyExpectedXp);
  
  const penalty = newEta - currentEta;
  return penalty > 0 ? penalty : 0;
};

/**
 * Returns Growth Momentum: Accelerating, Stable, or Declining
 */
export const calculateGrowthMomentum = (logs) => {
  const cutoff7 = getDaysAgo(7);
  const cutoff14 = getDaysAgo(14);

  const thisWeekLogs = logs.filter(l => l.logged_date >= cutoff7 && l.activity_type === 'technique_completion');
  const lastWeekLogs = logs.filter(l => l.logged_date >= cutoff14 && l.logged_date < cutoff7 && l.activity_type === 'technique_completion');

  if (thisWeekLogs.length > lastWeekLogs.length + 2) return 'Accelerating';
  if (thisWeekLogs.length < lastWeekLogs.length - 2) return 'Declining';
  return 'Stable';
};

/**
 * Generates the "What Changed?" Crow Intelligence Report
 */
export const calculateWhatChanged = (logs, techniques, currentEta, previousEta) => {
  const cutoff7 = getDaysAgo(7);
  const cutoff14 = getDaysAgo(14);

  const thisWeek = logs.filter(l => l.logged_date >= cutoff7);
  const lastWeek = logs.filter(l => l.logged_date >= cutoff14 && l.logged_date < cutoff7);

  const techDiffs = techniques.map(t => {
    const twCount = thisWeek.filter(l => l.technique_id === t.id).length;
    const lwCount = lastWeek.filter(l => l.technique_id === t.id).length;
    return { name: t.form_name, diff: twCount - lwCount, twCount };
  });

  const positiveDrivers = techDiffs.filter(t => t.diff > 0).sort((a,b) => b.diff - a.diff);
  const negativeDrivers = techDiffs.filter(t => t.diff < 0).sort((a,b) => a.diff - b.diff);

  const diffDays = previousEta - currentEta;
  
  let summary = '';
  if (diffDays > 0) {
    summary = `+${diffDays} Days Faster To Hashira`;
  } else if (diffDays < 0) {
    summary = `${diffDays} Days Slower To Hashira`;
  } else {
    summary = `Hashira ETA is stable`;
  }

  return {
    diffDays,
    summary,
    positiveDrivers: positiveDrivers.slice(0, 2),
    negativeDrivers: negativeDrivers.slice(0, 2),
  };
};
