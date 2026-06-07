import { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabaseClient';
import { Shield, ChevronRight, Check } from 'lucide-react';
import useHabitStore from '../stores/habitStore';

const HASHIRA = [
  { name: 'Giyu Tomioka', element: 'Water', quote: "Don't cry. Don't despair. Those things will do you no good.", color: '#3b82f6', glow: 'rgba(59,130,246,0.5)' },
  { name: 'Kyojuro Rengoku', element: 'Flame', quote: "Set your heart ablaze! Go beyond your limits!", color: '#f97316', glow: 'rgba(249,115,22,0.5)' },
  { name: 'Tengen Uzui', element: 'Sound', quote: "I am a god of festivals! Now, show me something flashy!", color: '#eab308', glow: 'rgba(234,179,8,0.5)' },
  { name: 'Sanemi Shinazugawa', element: 'Wind', quote: "I'll exterminate every last demon! Start moving!", color: '#22c55e', glow: 'rgba(34,197,94,0.5)' },
  { name: 'Gyomei Himejima', element: 'Stone', quote: "Namu Amida Butsu... Let us train your body to be unyielding.", color: '#78716c', glow: 'rgba(120,113,108,0.5)' },
  { name: 'Muichiro Tokito', element: 'Mist', quote: "What was the shape of that cloud again? Doesn't matter. Train.", color: '#06b6d4', glow: 'rgba(6,182,212,0.5)' },
  { name: 'Mitsuri Kanroji', element: 'Love', quote: "Wow! Your training is so cool! Let's do our best together!", color: '#ec4899', glow: 'rgba(236,72,153,0.5)' },
  { name: 'Obanai Iguro', element: 'Serpent', quote: "I won't accept weakness. Slither through the obstacles.", color: '#6366f1', glow: 'rgba(99,102,241,0.5)' },
  { name: 'Shinobu Kocho', element: 'Insect', quote: "If you can't behead a demon, you must be fast. Let's practice.", color: '#8b5cf6', glow: 'rgba(139,92,246,0.5)' },
];

export default function HashiraTrainingModal({ onClose }) {
  const { user, profile, updateProfile, trackEvent } = useAuthStore();
  const { fetchTodaysLogs } = useHabitStore();
  
  const [hashira, setHashira] = useState(null);
  const [phase, setPhase] = useState('intro'); // intro | reward | done
  const [loading, setLoading] = useState(true);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  useEffect(() => {
    // Pick a random Hashira
    const randomHashira = HASHIRA[Math.floor(Math.random() * HASHIRA.length)];
    setHashira(randomHashira);
    setLoading(false);

    if (user && typeof trackEvent === 'function') {
      trackEvent('hashira_spawned', 'encounter', 1, { hashira_name: randomHashira.name });
    }
  }, [user, trackEvent]);

  const handleClaimReward = async () => {
    if (!user || rewardClaimed) return;
    setRewardClaimed(true);

    const currentXp = profile?.total_xp || 0;
    const currentDurability = profile?.sword_durability || 100;
    
    // Hashira gives 100 XP and restores sword by 20 points
    await updateProfile({
      total_xp: currentXp + 100,
      sword_durability: Math.min(100, currentDurability + 20),
      last_hashira_visit: new Date().toISOString(),
    });

    if (typeof trackEvent === 'function') {
      trackEvent('hashira_completed', 'encounter', 100, { hashira_name: hashira.name });
    }

    setPhase('reward');
  };

  const handleClose = () => {
    if (user) {
      fetchTodaysLogs(user.id);
      if (!rewardClaimed && typeof trackEvent === 'function') {
        trackEvent('hashira_dismissed', 'encounter', 0, { hashira_name: hashira.name });
      }
    }
    onClose();
  };

  if (loading || !hashira) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-abyss/90 backdrop-blur-sm animate-fade-in">
      <div 
        className="glass-card w-full max-w-md overflow-hidden relative"
        style={{ border: `1px solid ${hashira.color}40`, boxShadow: `0 0 40px ${hashira.glow}` }}
      >
        {/* Hashira Background Glow */}
        <div 
          className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 pointer-events-none"
          style={{ background: `radial-gradient(circle, ${hashira.color}, transparent 70%)` }}
        />

        <div className="p-8 text-center relative z-10">
          
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4"
               style={{ background: `${hashira.color}20`, border: `2px solid ${hashira.color}50` }}>
            <Shield className="w-8 h-8" style={{ color: hashira.color }} />
          </div>
          
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-1">
              Hashira Encounter
            </p>
            <h2 className="text-2xl font-heading font-extrabold text-text-primary">
              {hashira.name}
            </h2>
            <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: hashira.color }}>
              {hashira.element} Hashira
            </p>
          </div>

          {phase === 'intro' ? (
            <div className="animate-slide-up">
              <div className="relative rounded-xl p-4 mb-8" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <p className="text-text-primary italic text-sm leading-relaxed">
                  "{hashira.quote}"
                </p>
              </div>

              <button
                onClick={handleClaimReward}
                className="btn-primary w-full py-4 text-sm font-bold flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${hashira.color}dd, ${hashira.color})`, boxShadow: `0 4px 15px ${hashira.glow}` }}
              >
                Accept Hashira Training <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="animate-slide-up">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center border border-green-500/40">
                  <Check className="w-6 h-6 text-green-400" />
                </div>
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">Training Complete</h3>
              <p className="text-text-secondary text-sm mb-6">
                You gained <strong className="text-amber-400">+100 XP</strong> and your sword durability improved!
              </p>
              
              <button
                onClick={handleClose}
                className="btn-primary w-full py-3 text-sm font-bold"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
