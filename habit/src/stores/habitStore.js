import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore, getRankInfo } from './authStore';

const BREATHING_ELEMENTS = {
  Water:   { color: '#3b82f6', bg: 'bg-blue-500',   label: 'Water Breathing',   icon: 'Droplets' },
  Flame:   { color: '#f97316', bg: 'bg-orange-500', label: 'Flame Breathing',   icon: 'Flame' },
  Thunder: { color: '#eab308', bg: 'bg-yellow-500', label: 'Thunder Breathing', icon: 'Zap' },
  Wind:    { color: '#22c55e', bg: 'bg-green-500',  label: 'Wind Breathing',    icon: 'Wind' },
  Stone:   { color: '#78716c', bg: 'bg-stone-500',  label: 'Stone Breathing',   icon: 'Mountain' },
  Mist:    { color: '#06b6d4', bg: 'bg-cyan-500',   label: 'Mist Breathing',    icon: 'CloudFog' },
  Love:    { color: '#ec4899', bg: 'bg-pink-500',   label: 'Love Breathing',    icon: 'Heart' },
  Serpent: { color: '#6366f1', bg: 'bg-indigo-500', label: 'Serpent Breathing', icon: 'Waves' },
  Insect:  { color: '#8b5cf6', bg: 'bg-violet-500', label: 'Insect Breathing',  icon: 'Bug' },
  Moon:    { color: '#1e3a5f', bg: 'bg-blue-900',   label: 'Moon Breathing',    icon: 'Moon' },
  Sun:     { color: '#fbbf24', bg: 'bg-amber-400',  label: 'Sun Breathing',     icon: 'Sun' },
};

const getToday = () => new Date().toISOString().split('T')[0];

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
        
        console.log('Syncing offline actions...', pending_actions.length);
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
          const { data, error } = await supabase
            .from('breathing_techniques')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

          if (error) throw error;
          set({ techniques: data || [], loading: false });
        } catch (error) {
          console.error('Error fetching techniques:', error);
          set({ loading: false });
        }
      },

      fetchTodaysLogs: async (userId) => {
        const today = getToday();
        try {
          const { data, error } = await supabase
            .from('slayer_logs')
            .select('*')
            .eq('user_id', userId)
            .eq('executed_at', today);

          if (error) throw error;
          set({ todaysLogs: data || [] });
        } catch (error) {
          console.error('Error fetching logs:', error);
        }
      },

      fetchAllLogs: async (userId) => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const fromDate = thirtyDaysAgo.toISOString().split('T')[0];

        try {
          const { data, error } = await supabase
            .from('slayer_logs')
            .select('*')
            .eq('user_id', userId)
            .gte('executed_at', fromDate)
            .order('executed_at', { ascending: true });

          if (error) throw error;
          set({ allLogs: data || [] });
        } catch (error) {
          console.error('Error fetching all logs:', error);
        }
      },

      addTechnique: async (userId, technique) => {
        try {
          const { data, error } = await supabase
            .from('breathing_techniques')
            .insert({
              user_id: userId,
              form_name: technique.formName,
              description: technique.description,
              breathing_element: technique.breathingElement,
              frequency: technique.frequency,
            })
            .select()
            .single();

          if (error) throw error;
          set((state) => ({ techniques: [...state.techniques, data] }));
          return { data };
        } catch (error) {
          console.error('Error adding technique:', error);
          return { error: error.message };
        }
      },

      deleteTechnique: async (techniqueId) => {
        try {
          const { error } = await supabase
            .from('breathing_techniques')
            .update({ is_active: false })
            .eq('id', techniqueId)
            .select()
            .single();

          if (error) throw error;
          set((state) => ({
            techniques: state.techniques.filter((t) => t.id !== techniqueId),
          }));
        } catch (error) {
          console.error('Error deleting technique:', error);
          return { error: error.message };
        }
      },

      executeForm: async (techniqueId, userId, forcedDate = null) => {
        const { todaysLogs, techniques, pending_actions } = get();
        const today = forcedDate || getToday();

        const alreadyDone = todaysLogs.find((l) => l.technique_id === techniqueId && l.executed_at === today);
        if (alreadyDone) return { alreadyDone: true };

        const technique = techniques.find((t) => t.id === techniqueId);
        if (!technique) return { error: 'Technique not found' };

        const streakBonus = Math.min(technique.streak_count, 20);
        const xpGained = 10 + streakBonus;

        if (!window.navigator.onLine && !forcedDate) {
          set({
            pending_actions: [...pending_actions, { type: 'executeForm', techniqueId, userId, offlineDate: today }]
          });
          return { xpGained, queued: true };
        }

        try {
          const { data: logData, error: logError } = await supabase
            .from('slayer_logs')
            .insert({
              technique_id: techniqueId,
              user_id: userId,
              executed_at: today,
              xp_gained: xpGained,
            })
            .select()
            .single();

          if (logError) throw logError;

          const newStreak = technique.streak_count + 1;
          const { error: techError } = await supabase
            .from('breathing_techniques')
            .update({ streak_count: newStreak })
            .eq('id', techniqueId)
            .select()
            .single();
            
          if (techError) throw techError;

          const authStore = useAuthStore.getState();
          const profile = authStore.profile;
          
          if (profile) {
            const newXp = profile.total_xp + xpGained;
            const newStamina = Math.min((profile.current_stamina ?? 100) + 5, profile.max_stamina ?? 100);
            const newDurability = Math.min((profile.sword_durability ?? 100) + 5, 100);
            const rankInfo = getRankInfo(newXp);
            const rankChanged = profile.slayer_rank !== rankInfo.current.rank;

            const newRelationship = Math.min((profile.crow_relationship ?? 50) + 2, 100);
            const newProfileStreak = (profile.current_streak ?? 0) + 1;
            const newMaxStreak = Math.max(profile.max_streak ?? 0, newProfileStreak);

            const profileResult = await authStore.updateProfile({
              total_xp: newXp,
              current_stamina: newStamina,
              slayer_rank: rankInfo.current.rank,
              sword_durability: newDurability,
              crow_status: 'Happy',
              crow_relationship: newRelationship,
              crow_last_interaction: new Date().toISOString(),
              current_streak: newProfileStreak,
              max_streak: newMaxStreak,
            });
            
            if (profileResult?.error) throw new Error(profileResult.error);

            // Track analytics
            await authStore.trackEvent('habit_completed', 'habit', xpGained, { techniqueId, element: technique.breathing_element });

            set((state) => ({
              todaysLogs: [...state.todaysLogs, logData],
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
          const { error } = await supabase
            .from('encounter_logs')
            .insert({
              user_id: userId,
              duration_minutes: durationMinutes,
              xp_gained: xpGained
            })
            .select()
            .single();

          if (error) throw error;

          const authStore = useAuthStore.getState();
          const profile = authStore.profile;
          if (profile) {
            const newXp = profile.total_xp + xpGained;
            const newDurability = Math.min((profile.sword_durability ?? 100) + 10, 100);
            const rankInfo = getRankInfo(newXp);
            const newRelationship = Math.min((profile.crow_relationship ?? 50) + 5, 100);

            const profileResult = await authStore.updateProfile({
              total_xp: newXp,
              slayer_rank: rankInfo.current.rank,
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
