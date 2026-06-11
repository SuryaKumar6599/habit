import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore, getRankInfo } from './authStore';
import { dateKeyDaysAgo, previousDateKey, todayKey, toLocalDateKey } from '../lib/dateKeys';
import { sendCrowMessage, sendCrowMessageOncePerDay, CROW_MESSAGE_TYPES } from '../lib/crowMessages';
import useCrowStore from './crowStore';
import { habitToTechnique, techniqueToHabitRow, mergeTechniques } from '../lib/techniqueMapper';
import { isDateProtectedByWisteria, hadRecentMissStreak } from '../lib/trainingAnalytics';

const BREATHING_ELEMENTS = {
  Water:   { color: '#3b82f6', bg: 'bg-blue-500',   label: 'Water Breathing',   icon: 'Droplets' },
  Flame:   { color: '#f97316', bg: 'bg-orange-500', label: 'Flame Breathing',   icon: 'Flame' },
  Thunder: { color: '#eab308', bg: 'bg-yellow-500', label: 'Thunder Breathing', icon: 'Zap' },
  Wind:    { color: '#22c55e', bg: 'bg-green-500',  label: 'Wind Breathing',    icon: 'Wind' },
  Stone:   { color: '#78716c', bg: 'bg-stone-500',  label: 'Stone Breathing',   icon: 'Mountain' },
  Mist:    { color: '#06b6d4', bg: 'bg-cyan-500',   label: 'Mist Breathing',    icon: 'CloudFog' },
  Frost:   { color: '#67e8f9', bg: 'bg-cyan-300',   label: 'Frost Breathing',   icon: 'Snowflake' },
  Love:    { color: '#ec4899', bg: 'bg-pink-500',   label: 'Love Breathing',    icon: 'Heart' },
  Serpent: { color: '#6366f1', bg: 'bg-indigo-500', label: 'Serpent Breathing', icon: 'Waves' },
  Insect:  { color: '#8b5cf6', bg: 'bg-violet-500', label: 'Insect Breathing',  icon: 'Bug' },
  Prosperity: { color: '#34d399', bg: 'bg-emerald-400', label: 'Prosperity Breathing', icon: 'Gem' },
  Moon:    { color: '#1e3a5f', bg: 'bg-blue-900',   label: 'Moon Breathing',    icon: 'Moon' },
  Sun:     { color: '#fbbf24', bg: 'bg-amber-400',  label: 'Sun Breathing',     icon: 'Sun' },
};

const getToday = () => todayKey();

const getLogDate = (log) => log.executed_at || log.logged_date;
const getLogTechniqueId = (log) => log.technique_id || log.habit_id;
const isCompletionLog = (log) => !log.activity_type || log.activity_type === 'completion';

const getTechniqueStreakFromLogs = (techniqueId, logs, dateKey) => {
  const completedDates = new Set(
    logs
      .filter((log) => isCompletionLog(log) && getLogTechniqueId(log) === techniqueId)
      .map(getLogDate)
      .filter(Boolean)
  );

  let cursor = completedDates.has(dateKey) ? dateKey : previousDateKey(dateKey);
  let streak = 0;
  while (completedDates.has(cursor)) {
    streak += 1;
    cursor = previousDateKey(cursor);
  }

  return streak;
};

const normalizeActivityLog = (log) => ({
  ...log,
  technique_id: log.habit_id,
  executed_at: log.logged_date,
  xp_gained: log.value,
});

const mergeLogs = (...groups) => {
  const logsById = new Map();
  groups.flat().filter(Boolean).forEach((log) => {
    const normalized = log.activity_type ? normalizeActivityLog(log) : log;
    logsById.set(normalized.id, { ...logsById.get(normalized.id), ...normalized });
  });
  return [...logsById.values()];
};

const updateTechniqueStreak = async (techniqueId, newStreak) => {
  const { error: habitError } = await supabase
    .from('habits')
    .update({ streak_count: newStreak })
    .eq('id', techniqueId);

  if (habitError) {
    await supabase
      .from('breathing_techniques')
      .update({ streak_count: newStreak })
      .eq('id', techniqueId);
  }
};

const useHabitStore = create(
  persist(
    (set, get) => ({
      techniques: [],
      todaysLogs: [],
      allLogs: [],
      pending_actions: [],
      loading: false,
      // Procrastination detector
      sessionOpenedAt: null,
      interventionFired: false,

      markSessionOpen: () => set({ sessionOpenedAt: Date.now(), interventionFired: false }),
      markInterventionFired: () => set({ interventionFired: true }),

      syncOfflineActions: async () => {
        const { pending_actions } = get();
        if (pending_actions.length === 0 || !window.navigator.onLine) return;
        
        const remaining = [];
        
        for (const action of pending_actions) {
          try {
            if (action.type === 'executeForm') {
              await get().executeForm(action.techniqueId, action.userId, action.offlineDate);
            } else if (action.type === 'finishEncounter') {
              await get().finishEncounter(action.userId, action.durationMinutes, action.offlineDate);
            }
          } catch (e) {
            console.error('Offline sync failed for action', action, e);
            remaining.push(action);
          }
        }
        
        set({ pending_actions: remaining });
      },

      fetchTechniques: async (userId) => {
        set({ loading: true });
        try {
          const [habitsResult, legacyResult] = await Promise.all([
            supabase
              .from('habits')
              .select('*')
              .eq('user_id', userId)
              .eq('is_active', true)
              .order('created_at', { ascending: true }),
            supabase
              .from('breathing_techniques')
              .select('*')
              .eq('user_id', userId)
              .eq('is_active', true)
              .order('created_at', { ascending: true }),
          ]);

          if (habitsResult.error && legacyResult.error) throw habitsResult.error;
          if (habitsResult.error) console.warn('Could not fetch habits:', habitsResult.error.message);
          if (legacyResult.error) console.warn('Could not fetch legacy techniques:', legacyResult.error.message);

          set({
            techniques: mergeTechniques(habitsResult.data, legacyResult.data),
            loading: false,
          });
        } catch (error) {
          console.error('Error fetching techniques:', error);
          set({ loading: false });
        }
      },

      fetchTodaysLogs: async (userId) => {
        const today = getToday();
        try {
          const [legacyResult, activityResult] = await Promise.all([
            supabase
              .from('slayer_logs')
              .select('*')
              .eq('user_id', userId)
              .eq('executed_at', today),
            supabase
              .from('activity_logs')
              .select('*')
              .eq('user_id', userId)
              .eq('activity_type', 'completion')
              .eq('logged_date', today),
          ]);

          if (legacyResult.error && activityResult.error) throw legacyResult.error;
          if (legacyResult.error) console.warn('Could not fetch legacy logs:', legacyResult.error.message);
          if (activityResult.error) console.warn('Could not fetch activity logs:', activityResult.error.message);
          set({ todaysLogs: mergeLogs(legacyResult.data || [], activityResult.data || []) });
        } catch (error) {
          console.error('Error fetching logs:', error);
        }
      },

      fetchAllLogs: async (userId) => {
        const fromDate = dateKeyDaysAgo(30);

        try {
          const [legacyResult, activityResult] = await Promise.all([
            supabase
              .from('slayer_logs')
              .select('*')
              .eq('user_id', userId)
              .gte('executed_at', fromDate)
              .order('executed_at', { ascending: true }),
            supabase
              .from('activity_logs')
              .select('*')
              .eq('user_id', userId)
              .gte('logged_date', fromDate)
              .order('logged_date', { ascending: true }),
          ]);

          if (legacyResult.error && activityResult.error) throw legacyResult.error;
          if (legacyResult.error) console.warn('Could not fetch legacy logs:', legacyResult.error.message);
          if (activityResult.error) console.warn('Could not fetch activity logs:', activityResult.error.message);
          set({ allLogs: mergeLogs(legacyResult.data || [], activityResult.data || []) });
        } catch (error) {
          console.error('Error fetching all logs:', error);
        }
      },

      detectMissedDays: async (userId) => {
        const { techniques, allLogs } = get();
        const profile = useAuthStore.getState().profile;
        const dailyTechniques = techniques.filter((t) => t.frequency === 'daily');
        if (dailyTechniques.length === 0) return { missesLogged: 0 };

        const today = getToday();
        const logsSnapshot = mergeLogs(allLogs, get().todaysLogs);
        const newMissLogs = [];

        const hasCompletion = (techniqueId, dateStr) =>
          logsSnapshot.some(
            (log) => isCompletionLog(log) && getLogTechniqueId(log) === techniqueId && getLogDate(log) === dateStr
          );

        const hasMiss = (techniqueId, dateStr) =>
          logsSnapshot.some(
            (log) => log.activity_type === 'miss' && getLogTechniqueId(log) === techniqueId && getLogDate(log) === dateStr
          );

        for (const technique of dailyTechniques) {
          const createdKey = toLocalDateKey(technique.created_at);

          for (let daysAgo = 1; daysAgo <= 14; daysAgo += 1) {
            const dateStr = dateKeyDaysAgo(daysAgo);
            if (dateStr < createdKey) break;
            if (isDateProtectedByWisteria(profile, dateStr)) continue;
            if (hasCompletion(technique.id, dateStr) || hasMiss(technique.id, dateStr)) continue;

            try {
              const { data, error } = await supabase
                .from('activity_logs')
                .insert({
                  user_id: userId,
                  habit_id: technique.id,
                  activity_type: 'miss',
                  value: 0,
                  logged_date: dateStr,
                })
                .select()
                .single();

              if (error) throw error;
              const normalized = normalizeActivityLog(data);
              newMissLogs.push({ log: normalized, technique });
            } catch (error) {
              console.warn('Could not log miss:', error.message);
            }
          }
        }

        if (newMissLogs.length > 0) {
          set((state) => ({
            allLogs: mergeLogs(state.allLogs, newMissLogs.map((entry) => entry.log)),
          }));

          const demonSpawns = newMissLogs.filter(({ technique }) => {
            let missedStreak = 0;
            for (let i = 1; i <= 21; i += 1) {
              const dateStr = dateKeyDaysAgo(i);
              const done = get().allLogs.some(
                (log) =>
                  isCompletionLog(log) &&
                  getLogTechniqueId(log) === technique.id &&
                  getLogDate(log) === dateStr
              );
              if (!done) missedStreak += 1;
              else break;
            }
            return missedStreak >= 3;
          });

          if (demonSpawns.length > 0) {
            const uniqueTechniques = [...new Set(demonSpawns.map((e) => e.technique.form_name))];
            const msg = await sendCrowMessage(userId, {
              title: 'Demon Activity Detected',
              content: `CAW! ${uniqueTechniques.length} form${uniqueTechniques.length > 1 ? 's' : ''} spawned demons after missed training. Return to the Training Grounds immediately.`,
              type: CROW_MESSAGE_TYPES.demon,
            });
            if (msg) useCrowStore.getState().prependMessage(msg);
          } else {
            const msg = await sendCrowMessageOncePerDay(userId, today, 'miss-summary', {
              title: 'Missed Training Logged',
              content: `The Corps recorded ${newMissLogs.length} missed day${newMissLogs.length > 1 ? 's' : ''}. Complete today's forms to halt corruption spread.`,
              type: CROW_MESSAGE_TYPES.warning,
            });
            if (msg) useCrowStore.getState().prependMessage(msg);
          }
        }

        const hour = new Date().getHours();
        const progress = get().getTodayProgress();
        if (hour >= 18 && progress.total > 0 && progress.completed < progress.total) {
          const remaining = progress.total - progress.completed;
          const msg = await sendCrowMessageOncePerDay(userId, today, 'streak-risk', {
            title: 'Streak at Risk',
            content: `CAW! ${remaining} form${remaining > 1 ? 's' : ''} remain before nightfall. The demons grow bolder with each hour.`,
            type: CROW_MESSAGE_TYPES.warning,
          });
          if (msg) useCrowStore.getState().prependMessage(msg);
        }

        return { missesLogged: newMissLogs.length };
      },

      addTechnique: async (userId, technique) => {
        try {
          const { data, error } = await supabase
            .from('habits')
            .insert(techniqueToHabitRow(userId, technique))
            .select()
            .single();

          if (error) throw error;
          const normalized = habitToTechnique(data);
          set((state) => ({ techniques: [...state.techniques, normalized] }));
          return { data: normalized };
        } catch (error) {
          console.error('Error adding technique:', error);
          return { error: error.message };
        }
      },

      deleteTechnique: async (techniqueId) => {
        try {
          const { error } = await supabase
            .from('habits')
            .update({ is_active: false })
            .eq('id', techniqueId);

          if (error) {
            const { error: legacyError } = await supabase
              .from('breathing_techniques')
              .update({ is_active: false })
              .eq('id', techniqueId);
            if (legacyError) throw legacyError;
          }

          set((state) => ({
            techniques: state.techniques.filter((t) => t.id !== techniqueId),
          }));
        } catch (error) {
          console.error('Error deleting technique:', error);
          return { error: error.message };
        }
      },

      executeForm: async (techniqueId, userId, forcedDate = null) => {
        const { todaysLogs, allLogs, techniques, pending_actions } = get();
        const today = forcedDate || getToday();
        const logsBeforeCompletion = mergeLogs(allLogs, todaysLogs);

        const alreadyDone = logsBeforeCompletion.find((log) =>
          isCompletionLog(log) && getLogTechniqueId(log) === techniqueId && getLogDate(log) === today
        );
        if (alreadyDone) return { alreadyDone: true };

        const technique = techniques.find((t) => t.id === techniqueId);
        if (!technique) return { error: 'Technique not found' };

        const currentTechniqueStreak = getTechniqueStreakFromLogs(techniqueId, logsBeforeCompletion, today);
        const streakBonus = Math.min(currentTechniqueStreak, 20);
        const xpGained = 10 + streakBonus;

        if (!window.navigator.onLine && !forcedDate) {
          set({
            pending_actions: [...pending_actions, { type: 'executeForm', techniqueId, userId, offlineDate: today }]
          });
          return { xpGained, queued: true };
        }

        try {
          const { data: logData, error: logError } = await supabase
            .from('activity_logs')
            .insert({
              user_id: userId,
              habit_id: techniqueId,
              activity_type: 'completion',
              value: xpGained,
              logged_date: today,
            })
            .select()
            .single();

          if (logError) throw logError;

          if (hadRecentMissStreak(techniqueId, logsBeforeCompletion, today)) {
            const { data: relapseLog } = await supabase
              .from('activity_logs')
              .insert({
                user_id: userId,
                habit_id: techniqueId,
                activity_type: 'relapse',
                value: 1,
                logged_date: today,
              })
              .select()
              .single();

            if (relapseLog) {
              const normalizedRelapse = normalizeActivityLog(relapseLog);
              set((state) => ({ allLogs: mergeLogs(state.allLogs, normalizedRelapse) }));

              await sendCrowMessage(userId, {
                title: 'Demon Vanquished',
                content: `You returned to ${technique.form_name} after a lapse. The Corps records this recovery. Stay vigilant.`,
                type: CROW_MESSAGE_TYPES.milestone,
              }).then((msg) => {
                if (msg) useCrowStore.getState().prependMessage(msg);
              });
            }
          }

          const completedLog = normalizeActivityLog(logData);
          const logsAfterCompletion = mergeLogs(logsBeforeCompletion, completedLog);
          const newStreak = getTechniqueStreakFromLogs(techniqueId, logsAfterCompletion, today);
          await updateTechniqueStreak(techniqueId, newStreak);

          const authStore = useAuthStore.getState();
          const profile = authStore.profile;
          
          if (profile) {
            const newXp = profile.total_xp + xpGained;
            const newStamina = Math.min((profile.current_stamina ?? 100) + 5, profile.max_stamina ?? 100);
            const newDurability = Math.min((profile.sword_durability ?? 100) + 5, 100);
            const rankInfo = getRankInfo(newXp);
            const rankChanged = profile.slayer_rank !== rankInfo.current.rank;

            const newRelationship = Math.min((profile.crow_relationship ?? 50) + 2, 100);
            const completionLogsBefore = logsBeforeCompletion.filter(isCompletionLog);
            const hadCompletionToday = completionLogsBefore.some((log) => getLogDate(log) === today);
            const hadCompletionYesterday = completionLogsBefore.some((log) => getLogDate(log) === previousDateKey(today));
            const newProfileStreak = hadCompletionToday
              ? (profile.current_streak ?? 0)
              : hadCompletionYesterday
              ? (profile.current_streak ?? 0) + 1
              : 1;
            const newMaxStreak = Math.max(profile.max_streak ?? 0, newProfileStreak);

            const profileUpdates = {
              total_xp: newXp,
              current_stamina: newStamina,
              sword_durability: newDurability,
              crow_status: 'Happy',
              crow_relationship: newRelationship,
              crow_last_interaction: new Date().toISOString(),
            };

            if (today === getToday()) {
              profileUpdates.current_streak = newProfileStreak;
              profileUpdates.max_streak = newMaxStreak;
            }

            const profileResult = await authStore.updateProfile(profileUpdates);
            
            if (profileResult?.error) throw new Error(profileResult.error);

            // Track analytics
            await authStore.trackEvent('habit_completed', 'habit', xpGained, { techniqueId, element: technique.breathing_element });

            set((state) => ({
              todaysLogs: mergeLogs(state.todaysLogs, completedLog),
              allLogs: mergeLogs(state.allLogs, completedLog),
              techniques: state.techniques.map((t) =>
                t.id === techniqueId ? { ...t, streak_count: newStreak } : t
              ),
            }));

            return { xpGained, rankChanged, newRank: rankInfo.current.rank };
          }

          return { xpGained };
        } catch (error) {
          console.error('Error executing form:', error);
          return { error: error.message };
        }
      },

      isTechniqueCompletedToday: (techniqueId) => {
        const { todaysLogs } = get();
        return todaysLogs.some((l) => l.technique_id === techniqueId);
      },

      getTodayProgress: () => {
        const { techniques, todaysLogs } = get();
        const dailyTechniques = techniques.filter((t) => t.frequency === 'daily');
        const completed = dailyTechniques.filter((t) =>
          todaysLogs.some((l) => l.technique_id === t.id)
        ).length;
        return {
          completed,
          total: dailyTechniques.length,
          percentage: dailyTechniques.length > 0 ? (completed / dailyTechniques.length) * 100 : 0,
        };
      },

      finishEncounter: async (userId, durationMinutes, forcedDate = null) => {
        const xpGained = durationMinutes;
        const today = forcedDate || getToday();
        const { pending_actions } = get();

        if (!window.navigator.onLine && !forcedDate) {
          set({
            pending_actions: [...pending_actions, { type: 'finishEncounter', userId, durationMinutes, offlineDate: today }]
          });
          return { xpGained, queued: true };
        }

        try {
          const { data: activityLog, error } = await supabase
            .from('activity_logs')
            .insert({
              user_id: userId,
              activity_type: 'focus_session',
              value: durationMinutes,
              logged_date: today,
            })
            .select()
            .single();

          if (error) throw error;

          const normalized = normalizeActivityLog(activityLog);
          set((state) => ({ allLogs: mergeLogs(state.allLogs, normalized) }));

          const authStore = useAuthStore.getState();
          const profile = authStore.profile;
          if (profile) {
            const newXp = profile.total_xp + xpGained;
            const newDurability = Math.min((profile.sword_durability ?? 100) + 10, 100);
            const newRelationship = Math.min((profile.crow_relationship ?? 50) + 5, 100);

            const profileResult = await authStore.updateProfile({
              total_xp: newXp,
              sword_durability: newDurability,
              crow_status: 'Happy',
              crow_relationship: newRelationship,
              crow_last_interaction: new Date().toISOString(),
            });
            
            if (profileResult?.error) throw new Error(profileResult.error);
            
            await authStore.trackEvent('timer_completed', 'encounter', xpGained, { durationMinutes });
          }

          return { xpGained };
        } catch (error) {
          console.error('Error saving encounter log:', error);
          return { error: error.message };
        }
      },
    }),
    {
      name: 'habit-storage',
      partialize: (state) => ({ pending_actions: state.pending_actions }),
    }
  )
);

export { BREATHING_ELEMENTS };
export default useHabitStore;
