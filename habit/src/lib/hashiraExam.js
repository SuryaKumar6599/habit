import { supabase } from './supabaseClient';
import { sendCrowMessage, CROW_MESSAGE_TYPES } from './crowMessages';
import { todayKey, toLocalDateKey, addDays } from './dateKeys';

export async function resolveExpiredExam(userId, exam, consistencyPercent, updateProfile) {
  if (!exam || exam.status !== 'active') return exam;
  if (todayKey() <= exam.expires_at) return exam;

  const passed = consistencyPercent >= exam.required_consistency;
  const cooldownUntil = passed ? null : toLocalDateKey(addDays(new Date(), 7));

  const { data, error } = await supabase
    .from('hashira_exams')
    .update({
      status: passed ? 'passed' : 'failed',
      cooldown_until: cooldownUntil,
    })
    .eq('id', exam.id)
    .select()
    .single();

  if (error) {
    console.warn('Could not resolve Hashira exam:', error.message);
    return exam;
  }

  if (passed) {
    await sendCrowMessage(userId, {
      title: 'Hashira Exam Passed',
      content: `You maintained ${consistencyPercent}% training efficiency. Promotion to ${exam.target_rank} is confirmed. The Corps salutes you.`,
      type: CROW_MESSAGE_TYPES.milestone,
    });

    if (updateProfile) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp')
        .eq('id', userId)
        .single();

      await updateProfile({
        total_xp: (profile?.total_xp || 0) + 250,
        slayer_rank: exam.target_rank,
      });
    }
  } else {
    await sendCrowMessage(userId, {
      title: 'Hashira Exam Failed',
      content: `Training efficiency fell to ${consistencyPercent}%. Required ${exam.required_consistency}%. Rest, recover, and retry after your cooldown.`,
      type: CROW_MESSAGE_TYPES.warning,
    });
  }

  return data;
}

export async function fetchActiveExam(userId) {
  const { data: active } = await supabase
    .from('hashira_exams')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (active) return active;

  const { data: cooldown } = await supabase
    .from('hashira_exams')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'failed')
    .gte('cooldown_until', todayKey())
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return cooldown || null;
}

export function isExamOnCooldown(exam) {
  return exam?.status === 'failed' && exam.cooldown_until && todayKey() <= exam.cooldown_until;
}
