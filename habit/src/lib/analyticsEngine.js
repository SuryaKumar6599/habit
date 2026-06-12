import { calculateEfficiency, calculateGrowthMomentum } from './projectionEngine';

const getDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
};

/**
 * Calculates Breathing Balance across the 4 core categories
 */
export const getBreathingBalance = (techniques, logs) => {
  const cutoff = getDaysAgo(7);
  const recentLogs = logs.filter(l => l.logged_date >= cutoff && l.activity_type === 'technique_completion');

  const categories = ['Mind', 'Body', 'Discipline', 'Wealth'];
  const balance = {};
  
  let totalPct = 0;
  let activeCats = 0;

  categories.forEach(cat => {
    const catTechs = techniques.filter(t => t.category === cat);
    if (catTechs.length === 0) {
      balance[cat] = 0;
    } else {
      const expected = catTechs.length * 7;
      const actual = recentLogs.filter(l => catTechs.some(t => t.id === l.technique_id)).length;
      const pct = Math.min(100, Math.round((actual / expected) * 100));
      balance[cat] = pct;
      totalPct += pct;
      activeCats++;
    }
  });

  const averageBalance = activeCats > 0 ? Math.round(totalPct / activeCats) : 0;
  return { ...balance, average: averageBalance };
};

/**
 * Calculates the Total Concentration Constant (North Star Metric)
 */
export const getTotalConcentrationConstant = (balance, consistency, momentum) => {
  let momentumBonus = 0;
  if (momentum === 'Accelerating') momentumBonus = 10;
  if (momentum === 'Declining') momentumBonus = -10;

  const components = [
    balance.Mind || 0,
    balance.Body || 0,
    balance.Discipline || 0,
    balance.Wealth || 0,
    consistency,
    50 + momentumBonus // Normalize momentum to 0-100 scale (Declining 40, Stable 50, Accelerating 60)
  ];

  // Average all 6 components
  const sum = components.reduce((a, b) => a + b, 0);
  const rawScore = Math.round(sum / 6);
  
  // Cap between 0 and 100
  return Math.min(100, Math.max(0, rawScore));
};

export const getTotalConcentrationTitle = (score) => {
  if (score < 20) return 'Recruit';
  if (score < 40) return 'Corps Member';
  if (score < 60) return 'Slayer';
  if (score < 80) return 'Hashira Candidate';
  if (score < 95) return 'Hashira';
  return 'Total Concentration Constant';
};

/**
 * Calculates Hashira Readiness Score
 */
export const getHashiraReadiness = (consistency, balanceAverage, growthVelocityPct, corruptionPct, momentum) => {
  // Weights:
  // Consistency 35%
  // Balance 25%
  // Growth 20%
  // Corruption/Missed Penalty 10%
  // Momentum 10%

  let momentumScore = 50;
  if (momentum === 'Accelerating') momentumScore = 100;
  if (momentum === 'Declining') momentumScore = 0;

  // Cap growth velocity at 100%
  const growthScore = Math.min(100, Math.max(0, growthVelocityPct * 5)); // e.g. 20% growth = 100 score

  // Inverse corruption
  const purityScore = Math.max(0, 100 - corruptionPct);

  const score = (
    (consistency * 0.35) +
    (balanceAverage * 0.25) +
    (growthScore * 0.20) +
    (purityScore * 0.10) +
    (momentumScore * 0.10)
  );

  return Math.round(score);
};
