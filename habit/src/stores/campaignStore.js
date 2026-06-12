import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

const DEMON_TYPES = [
  { goal: 'Career', name: 'Ignorance Demon', tier: 'Upper Moon', baseHp: 3000 },
  { goal: 'Health', name: 'Decay Demon', tier: 'Upper Moon', baseHp: 3000 },
  { goal: 'Wealth', name: 'Poverty Demon', tier: 'Upper Moon', baseHp: 3000 },
];

const useCampaignStore = create((set, get) => ({
  activeCampaign: null,
  campaignHistory: [],
  loading: false,

  fetchActiveCampaign: async (userId) => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('demon_campaigns')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is no rows returned

      set({ activeCampaign: data || null, loading: false });
      return data;
    } catch (error) {
      console.error('Error fetching campaign:', error);
      set({ loading: false });
      return null;
    }
  },

  spawnCampaign: async (userId, habitId = null) => {
    try {
      const type = DEMON_TYPES[Math.floor(Math.random() * DEMON_TYPES.length)];
      
      const { data, error } = await supabase
        .from('demon_campaigns')
        .insert({
          user_id: userId,
          demon_name: type.name,
          tier: type.tier,
          max_hp: type.baseHp,
          current_hp: type.baseHp,
          linked_habit_id: habitId,
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        })
        .select()
        .single();

      if (error) throw error;
      set({ activeCampaign: data });
      return data;
    } catch (error) {
      console.error('Error spawning campaign:', error);
      return null;
    }
  },

  damageActiveCampaign: async (userId, damageAmount) => {
    const { activeCampaign } = get();
    if (!activeCampaign) return null;

    const newHp = Math.max(0, activeCampaign.current_hp - damageAmount);
    const newStatus = newHp === 0 ? 'defeated' : 'active';

    try {
      const { data, error } = await supabase
        .from('demon_campaigns')
        .update({
          current_hp: newHp,
          status: newStatus
        })
        .eq('id', activeCampaign.id)
        .select()
        .single();

      if (error) throw error;
      
      if (newStatus === 'defeated') {
        set({ activeCampaign: null });
      } else {
        set({ activeCampaign: data });
      }

      return { campaign: data, defeated: newStatus === 'defeated' };
    } catch (error) {
      console.error('Error damaging campaign:', error);
      return null;
    }
  }
}));

export default useCampaignStore;
