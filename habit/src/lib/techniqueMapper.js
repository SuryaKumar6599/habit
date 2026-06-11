export const habitToTechnique = (habit) => ({
  id: habit.id,
  user_id: habit.user_id,
  form_name: habit.name,
  description: habit.description || '',
  breathing_element: habit.breathing_element || habit.category || 'Water',
  frequency: habit.frequency || (habit.target_frequency_per_week >= 7 ? 'daily' : 'weekly'),
  streak_count: habit.streak_count ?? 0,
  is_active: habit.is_active ?? true,
  created_at: habit.created_at,
});

export const techniqueToHabitRow = (userId, input) => ({
  user_id: userId,
  name: input.formName,
  description: input.description || '',
  breathing_technique: `${input.breathingElement} Breathing`,
  category: input.breathingElement,
  breathing_element: input.breathingElement,
  frequency: input.frequency,
  target_frequency_per_week: input.frequency === 'daily' ? 7 : 1,
  is_active: true,
  streak_count: 0,
});

export const mergeTechniques = (habits, legacyTechniques) => {
  const byId = new Map();

  (legacyTechniques || []).forEach((technique) => {
    byId.set(technique.id, technique);
  });

  (habits || []).forEach((habit) => {
    byId.set(habit.id, habitToTechnique(habit));
  });

  return [...byId.values()].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
};
