import { dateKeyDaysAgo, previousDateKey } from './dateKeys';

const getLogDate = (log) => log.executed_at || log.logged_date;
const getLogTechniqueId = (log) => log.technique_id || log.habit_id;
const isCompletionLog = (log) => !log.activity_type || log.activity_type === 'completion';

export const getMissedStreakBeforeDate = (techniqueId, logs, beforeDateKey) => {
  let missedStreak = 0;
  let cursor = previousDateKey(beforeDateKey);

  for (let i = 0; i < 21; i += 1) {
    const done = logs.some(
      (log) =>
        isCompletionLog(log) &&
        getLogTechniqueId(log) === techniqueId &&
        getLogDate(log) === cursor
    );
    if (!done) {
      missedStreak += 1;
      cursor = previousDateKey(cursor);
    } else {
      break;
    }
  }

  return missedStreak;
};

export const hadRecentMissStreak = (techniqueId, logs, dateKey, threshold = 3) =>
  getMissedStreakBeforeDate(techniqueId, logs, dateKey) >= threshold;

export const isDateProtectedByWisteria = (profile, dateKey) => {
  if (!profile?.wisteria_active || !profile?.wisteria_end_date) return false;
  return dateKey <= profile.wisteria_end_date;
};

export const countMissedDaysInRange = (techniqueId, logs, startDateKey, endDateKey) => {
  let count = 0;
  let cursor = endDateKey;

  while (cursor >= startDateKey) {
    const done = logs.some(
      (log) =>
        isCompletionLog(log) &&
        getLogTechniqueId(log) === techniqueId &&
        getLogDate(log) === cursor
    );
    if (!done) count += 1;
    cursor = previousDateKey(cursor);
  }

  return count;
};

export const getWeekRecapStats = (techniques, logs) => {
  const dailyTechniques = techniques.filter((t) => t.frequency === 'daily');
  if (dailyTechniques.length === 0) {
    return { completions: 0, expected: 0, percentage: 0 };
  }

  let completions = 0;
  const expected = dailyTechniques.length * 7;

  for (let daysAgo = 1; daysAgo <= 7; daysAgo += 1) {
    const dateStr = dateKeyDaysAgo(daysAgo);
    dailyTechniques.forEach((technique) => {
      const done = logs.some(
        (log) =>
          isCompletionLog(log) &&
          getLogTechniqueId(log) === technique.id &&
          getLogDate(log) === dateStr
      );
      if (done) completions += 1;
    });
  }

  return {
    completions,
    expected,
    percentage: expected > 0 ? Math.round((completions / expected) * 100) : 0,
  };
};
