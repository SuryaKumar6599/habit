import { supabase } from './supabaseClient';

export const CROW_MESSAGE_TYPES = {
  notice: 'notice',
  warning: 'warning',
  milestone: 'milestone',
  mission: 'mission',
  demon: 'demon',
};

export async function sendCrowMessage(userId, { title, content, type = CROW_MESSAGE_TYPES.notice }) {
  if (!userId || !title || !content) return null;

  const { data, error } = await supabase
    .from('crow_messages')
    .insert({ user_id: userId, title, content, type })
    .select()
    .single();

  if (error) {
    console.warn('Could not send crow message:', error.message);
    return null;
  }
  return data;
}

export async function sendCrowMessageOncePerDay(userId, dateKey, dedupeKey, payload) {
  const storageKey = `crow-dedupe-${userId}-${dedupeKey}-${dateKey}`;
  if (localStorage.getItem(storageKey)) return null;

  const message = await sendCrowMessage(userId, payload);
  if (message) localStorage.setItem(storageKey, '1');
  return message;
}
