import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

const RANK_THRESHOLDS = [
  { rank: 'Mizunoto', xp: 0, kanji: '癸' },
  { rank: 'Mizunoe', xp: 100, kanji: '壬' },
  { rank: 'Kanoto', xp: 300, kanji: '辛' },
  { rank: 'Kanoe', xp: 600, kanji: '庚' },
  { rank: 'Tsuchinoto', xp: 1000, kanji: '己' },
  { rank: 'Tsuchinoe', xp: 1500, kanji: '戊' },
  { rank: 'Hinoto', xp: 2200, kanji: '丁' },
  { rank: 'Hinoe', xp: 3000, kanji: '丙' },
  { rank: 'Kinoto', xp: 4000, kanji: '乙' },
  { rank: 'Kinoe', xp: 5500, kanji: '甲' },
  { rank: 'Hashira', xp: 8000, kanji: '柱' },
];

export const getRankInfo = (totalXp) => {
  let currentRank = RANK_THRESHOLDS[0];
  let nextRank = RANK_THRESHOLDS[1];
  
  for (let i = RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= RANK_THRESHOLDS[i].xp) {
      currentRank = RANK_THRESHOLDS[i];
      nextRank = RANK_THRESHOLDS[i + 1] || null;
      break;
    }
  }
  
  const xpInCurrentRank = totalXp - currentRank.xp;
  const xpToNextRank = nextRank ? nextRank.xp - currentRank.xp : 0;
  const progress = nextRank ? (xpInCurrentRank / xpToNextRank) * 100 : 100;
  
  return {
    current: currentRank,
    next: nextRank,
    progress: Math.min(progress, 100),
    xpInCurrentRank,
    xpToNextRank,
  };
};

export { RANK_THRESHOLDS };

export const useAuthStore = create((set, get) => ({
  user: null,
  profile: null,
  loading: true,
  error: null,

  initialize: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user || null, loading: false });
      if (session?.user) {
        get().fetchProfile(session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      set({ user: session?.user || null });
      if (session?.user) {
        get().fetchProfile(session.user.id);
      } else {
        set({ profile: null });
      }
    });

    // Realtime Sync for Profile
    const profileChannel = supabase.channel('profile_sync')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, (payload) => {
        const { user } = get();
        if (user && payload.new.id === user.id) {
          set({ profile: payload.new });
        }
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(profileChannel);
    };
  },

  fetchProfile: async (userId) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        console.warn('Profile missing (likely schema reset). Re-creating profile...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({ id: userId, display_name: 'Recovered Slayer' })
          .select()
          .single();
          
        if (!createError && newProfile) {
          set({ profile: newProfile });
          return;
        } else {
          console.error('Failed to recreate profile. Signing out.');
          get().signOut();
          return;
        }
      }
      console.error('Error fetching profile:', error);
      set({ error: error.message });
      return;
    }

    // Sync rank based on XP
    const rankInfo = getRankInfo(data.total_xp);
    if (data.slayer_rank !== rankInfo.current.rank) {
      await supabase
        .from('profiles')
        .update({ slayer_rank: rankInfo.current.rank })
        .eq('id', userId);
      data.slayer_rank = rankInfo.current.rank;
    }

    set({ profile: data });
  },

  updateProfile: async (updates) => {
    const { user } = get();
    if (!user) return { error: 'No user authenticated' };

    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;

      set({ profile: data });
      return { data };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error.message };
    }
  },

  trackEvent: async (eventName, category = 'general', value = 0, eventData = {}) => {
    const { user } = get();
    if (!user) return;

    try {
      await supabase.from('analytics_events').insert({
        user_id: user.id,
        event_name: eventName,
        event_category: category,
        event_value: value,
        event_data: eventData
      });
    } catch (e) {
      console.error('Analytics error:', e);
    }
  },

  signUp: async (email, password, displayName) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName || 'New Recruit' },
      },
    });

    if (error) {
      set({ error: error.message, loading: false });
      return { error };
    }

    set({ loading: false });
    return { data };
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      set({ error: error.message, loading: false });
      return { error };
    }

    set({ loading: false });
    return { data };
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error signing out:', error);
      return;
    }
    set({ user: null, profile: null });
  },

  clearError: () => set({ error: null }),
}));
