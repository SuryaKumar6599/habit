import { create } from 'zustand';
import { supabase } from '../lib/supabaseClient';

const useCrowStore = create((set, get) => ({
  messages: [],
  loading: false,

  fetchMessages: async (userId) => {
    if (!userId) return;
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('crow_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;
      set({ messages: data || [], loading: false });
    } catch (error) {
      console.error('Error fetching crow messages:', error);
      set({ loading: false });
    }
  },

  markAsRead: async (messageId) => {
    const { error } = await supabase
      .from('crow_messages')
      .update({ is_read: true })
      .eq('id', messageId);

    if (error) {
      console.warn('Could not mark message read:', error.message);
      return;
    }

    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, is_read: true } : m
      ),
    }));
  },

  markAllRead: async (userId) => {
    const unread = get().messages.filter((m) => !m.is_read);
    if (unread.length === 0) return;

    const { error } = await supabase
      .from('crow_messages')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('is_read', false);

    if (error) {
      console.warn('Could not mark all messages read:', error.message);
      return;
    }

    set((state) => ({
      messages: state.messages.map((m) => ({ ...m, is_read: true })),
    }));
  },

  getUnreadCount: () => get().messages.filter((m) => !m.is_read).length,

  prependMessage: (message) => {
    if (!message) return;
    set((state) => ({
      messages: [message, ...state.messages.filter((m) => m.id !== message.id)],
    }));
  },
}));

export default useCrowStore;
