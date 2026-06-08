import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabaseClient';
import { Target, CheckCircle2, CircleDashed } from 'lucide-react';

export default function DailyMissions({ compactRail = false }) {
  const { user, profile, updateProfile, trackEvent } = useAuthStore();
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const loadMissions = async () => {
      setLoading(true);
      const { data, error } = await supabase.rpc('generate_daily_missions', { target_user_id: user.id });

      if (!error && data) {
        setMissions(data);
      }
      setLoading(false);
    };

    loadMissions();
  }, [user]);

  const handleClaim = async (mission) => {
    if (mission.is_claimed) return;

    // Optimistic UI update
    setMissions(missions.map(m => m.id === mission.id ? { ...m, is_claimed: true } : m));

    // Update the mission record
    const { error } = await supabase
      .from('daily_missions')
      .update({ is_claimed: true })
      .eq('id', mission.id);

    if (!error) {
      // Award XP
      const currentXp = profile?.total_xp || 0;
      await updateProfile({ total_xp: currentXp + mission.reward_xp });

      // Telemetry
      if (typeof trackEvent === 'function') {
        trackEvent('mission_completed', 'engagement', mission.reward_xp, { mission_title: mission.title });
      }
    } else {
      // Revert optimistic update
      setMissions(missions.map(m => m.id === mission.id ? { ...m, is_claimed: false } : m));
    }
  };

  if (loading || missions.length === 0) return null;
  const claimedCount = missions.filter((mission) => mission.is_claimed).length;

  return (
    <section className="mb-6 animate-fade-in">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-crimson" />
          <h2 className="font-heading font-bold text-text-primary text-sm uppercase tracking-wide">Daily Bounties</h2>
        </div>
        <span className="section-label">{claimedCount}/{missions.length} Claimed</span>
      </div>

      <div className={compactRail ? 'mobile-card-rail' : 'grid grid-cols-1 md:grid-cols-3 gap-3'}>
        {missions.map(mission => {
          const isComplete = mission.current_count >= mission.target_count;
          const isClaimed = mission.is_claimed;

          return (
            <div
              key={mission.id}
              className={`interactive-card glass-card p-4 flex flex-col min-h-[150px] relative overflow-hidden transition-all duration-300 ${
                isClaimed ? 'opacity-55' : 'glass-card-hover'
              } ${compactRail ? 'min-w-[82vw] snap-start' : ''}`}
            >
              {isClaimed && (
                <div className="absolute inset-0 bg-black/40 z-10 flex items-center justify-center backdrop-blur-sm">
                  <span className="text-green-400 font-bold uppercase tracking-widest text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Claimed
                  </span>
                </div>
              )}

              <div className="flex justify-between items-start mb-2">
                <h3 className="text-sm font-semibold text-text-primary pr-2 leading-tight">
                  {mission.title}
                </h3>
                <span className="text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-md whitespace-nowrap border border-white/20">
                  +{mission.reward_xp} XP
                </span>
              </div>

              <div className="mt-auto pt-3">
                <div className="flex justify-between items-center text-[10px] text-text-muted mb-1 font-mono uppercase">
                  <span>Progress</span>
                  <span>{mission.current_count} / {mission.target_count}</span>
                </div>

                <div className="w-full bg-white/5 rounded-full h-1.5 mb-3 overflow-hidden border border-white/10">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${isComplete ? 'bg-green-500' : 'bg-crimson'}`}
                    style={{ width: `${Math.min(100, (mission.current_count / mission.target_count) * 100)}%` }}
                  />
                </div>

                <button
                  disabled={!isComplete || isClaimed}
                  onClick={() => handleClaim(mission)}
                  className={`w-full py-2 rounded-md text-xs font-bold transition-all flex items-center justify-center gap-2 ${isComplete && !isClaimed
                      ? 'bg-green-500 hover:bg-green-400 text-white shadow-[0_0_15px_rgba(34,197,94,0.3)]'
                      : 'bg-white/5 text-text-muted cursor-not-allowed'
                    }`}
                >
                  {isComplete && !isClaimed ? (
                    <>Claim Reward <CheckCircle2 className="w-3.5 h-3.5" /></>
                  ) : (
                    <>In Progress <CircleDashed className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
