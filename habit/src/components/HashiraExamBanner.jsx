import { useEffect, useState } from 'react';
import { Award, ChevronRight, Loader2, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuthStore } from '../stores/authStore';
import useGrowthStore from '../stores/growthStore';
import { sendCrowMessage, CROW_MESSAGE_TYPES } from '../lib/crowMessages';
import useCrowStore from '../stores/crowStore';
import {
  fetchActiveExam,
  resolveExpiredExam,
  isExamOnCooldown,
} from '../lib/hashiraExam';
import { toLocalDateKey, addDays, todayKey, parseDateKey } from '../lib/dateKeys';

export default function HashiraExamBanner() {
  const { user, updateProfile } = useAuthStore();
  const { nextRank, progressToNextRank, consistencyPercent } = useGrowthStore();
  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadExam = async () => {
      setLoading(true);
      let current = await fetchActiveExam(user.id);

      if (current?.status === 'active') {
        current = await resolveExpiredExam(user.id, current, consistencyPercent, updateProfile);
        if (current?.status !== 'active') {
          await useCrowStore.getState().fetchMessages(user.id);
        }
      }

      setExam(current?.status === 'active' || isExamOnCooldown(current) ? current : null);
      setLoading(false);
    };

    loadExam();
  }, [user, progressToNextRank, consistencyPercent, updateProfile]);

  const handleStartExam = async () => {
    if (!user || !nextRank) return;
    setStarting(true);

    const expiresAt = toLocalDateKey(addDays(new Date(), 7));
    const { data, error } = await supabase
      .from('hashira_exams')
      .insert({
        user_id: user.id,
        target_rank: nextRank.rank,
        expires_at: expiresAt,
        required_consistency: 90,
        required_days: 7,
        status: 'active',
      })
      .select()
      .single();

    if (!error && data) {
      setExam(data);
      const msg = await sendCrowMessage(user.id, {
        title: 'Hashira Exam Begun',
        content: `Maintain ${data.required_consistency}% training efficiency for ${data.required_days} days to earn promotion to ${data.target_rank}.`,
        type: CROW_MESSAGE_TYPES.milestone,
      });
      if (msg) useCrowStore.getState().prependMessage(msg);
    }
    setStarting(false);
  };

  if (loading || !nextRank) return null;

  if (exam?.status === 'active') {
    const daysLeft = daysBetweenKeys(todayKey(), exam.expires_at);
    const onTrack = consistencyPercent >= exam.required_consistency;

    return (
      <div
        className="mt-4 rounded-lg px-4 py-3 border flex flex-col sm:flex-row sm:items-center gap-3"
        style={{
          background: 'rgba(251,191,36,0.08)',
          borderColor: 'rgba(251,191,36,0.25)',
        }}
      >
        <div className="flex items-start gap-3 flex-1">
          <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-heading font-bold text-amber-300">
              Hashira Exam in Progress
            </p>
            <p className="text-xs text-text-secondary mt-0.5">
              Target: {exam.target_rank} · {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining ·
              Need {exam.required_consistency}% efficiency (currently {consistencyPercent}%)
            </p>
          </div>
        </div>
        <span
          className="text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-md shrink-0"
          style={{
            background: onTrack ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: onTrack ? '#4ade80' : '#f87171',
            border: `1px solid ${onTrack ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          {onTrack ? 'On Track' : 'Below Target'}
        </span>
      </div>
    );
  }

  if (isExamOnCooldown(exam)) {
    const daysUntil = daysBetweenKeys(todayKey(), exam.cooldown_until);
    return (
      <div
        className="mt-4 rounded-lg px-4 py-3 border flex items-center gap-3"
        style={{
          background: 'rgba(239,68,68,0.08)',
          borderColor: 'rgba(239,68,68,0.2)',
        }}
      >
        <Clock className="w-5 h-5 text-red-400 shrink-0" />
        <p className="text-xs text-text-secondary">
          Hashira Exam cooldown active. Retry in {daysUntil} day{daysUntil !== 1 ? 's' : ''}.
        </p>
      </div>
    );
  }

  if (progressToNextRank < 85) return null;

  return (
    <div
      className="mt-4 rounded-lg px-4 py-3 border flex flex-col sm:flex-row sm:items-center gap-3"
      style={{
        background: 'rgba(251,191,36,0.08)',
        borderColor: 'rgba(251,191,36,0.25)',
      }}
    >
      <div className="flex items-start gap-3 flex-1">
        <Award className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-heading font-bold text-amber-300">
            Hashira Exam Available
          </p>
          <p className="text-xs text-text-secondary mt-0.5">
            You are {progressToNextRank}% toward {nextRank.rank}. Begin a 7-day exam at 90% training efficiency to claim promotion.
          </p>
        </div>
      </div>
      <button
        onClick={handleStartExam}
        disabled={starting}
        className="btn-primary flex items-center justify-center gap-1.5 text-sm py-2 px-4 shrink-0"
      >
        {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
        Begin Exam
      </button>
    </div>
  );
}

function daysBetweenKeys(fromKey, toKey) {
  const from = parseDateKey(fromKey);
  const to = parseDateKey(toKey);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) return 0;
  return Math.max(0, Math.ceil((to - from) / 86400000));
}
