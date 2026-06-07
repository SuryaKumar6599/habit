export const calculateGrowthMetrics = (profile, allLogs, allHabits) => {
  // 1. Calculate Days Trained
  const startDate = profile.start_date ? new Date(profile.start_date) : new Date(profile.created_at);
  const today = new Date();
  const diffTime = Math.abs(today - startDate);
  const daysTrained = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // 2. Calculate Consistency Percentage
  // (Total completions / Expected completions over days trained)
  const totalCompletions = allLogs.filter(l => l.activity_type === 'completion').length;
  // Simplification: Expecting 1 completion per active habit per day trained
  const expectedCompletions = Math.max(1, allHabits.length * daysTrained); 
  const consistencyPercent = Math.min(100, Math.round((totalCompletions / expectedCompletions) * 100));

  // 3. Multi-Factor Growth Score (Damped Formula)
  // M_actual = 1 + (log(t + 1) * (0.5 + 0.5 * c^2))
  // where c is consistency (0.0 to 1.0)
  const c = consistencyPercent / 100;
  const growthMultiplier = 1 + (Math.log10(daysTrained + 1) * (0.5 + 0.5 * (c * c)));

  // 4. Determine Archetype based on Breathing Balance
  let archetype = 'Unassigned';
  if (allHabits.length > 0) {
    const categories = allHabits.reduce((acc, habit) => {
      acc[habit.category] = (acc[habit.category] || 0) + 1;
      return acc;
    }, {});
    
    const maxCat = Object.keys(categories).reduce((a, b) => categories[a] > categories[b] ? a : b);
    if (maxCat === 'Reading') archetype = 'Scholar Slayer';
    else if (maxCat === 'Workout') archetype = 'Warrior Slayer';
    else if (maxCat === 'Focus') archetype = 'Mist Ascetic';
    else archetype = `${maxCat} Specialist`;
  }

  // 5. Sword Tier Evaluation
  let swordTier = 'Wooden Sword';
  if (daysTrained > 7 && consistencyPercent > 60) swordTier = 'Standard Nichirin';
  if (daysTrained > 30 && consistencyPercent > 70) swordTier = 'Refined Blade';
  if (daysTrained > 90 && consistencyPercent > 80) swordTier = 'Tempered Blade';
  if (daysTrained > 180 && consistencyPercent > 85) swordTier = 'Elite Nichirin';

  return {
    daysTrained,
    consistencyPercent,
    growthMultiplier: Number(growthMultiplier.toFixed(2)),
    archetype,
    swordTier
  };
};
