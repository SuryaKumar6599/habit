import { useState, useEffect } from 'react';
import useCampaignStore from '../stores/campaignStore';
import { useAuthStore } from '../stores/authStore';
import { supabase } from '../lib/supabaseClient';
import { Target, Skull, Swords } from 'lucide-react';

export default function CurrentCampaignCard() {
  const { user } = useAuthStore();
  const { activeCampaign: currentCampaign, fetchActiveCampaign: fetchCampaign } = useCampaignStore();

  useEffect(() => {
    if (user) {
      fetchCampaign(user.id);
    }
  }, [user, fetchCampaign]);

  if (!currentCampaign) {
    return (
      <div className="glass-card p-6 border-dashed border-white/10 flex flex-col items-center text-center">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
          <Target className="w-6 h-6 text-text-muted" />
        </div>
        <h3 className="text-lg font-heading font-bold text-text-primary mb-1">No Active Campaign</h3>
        <p className="text-sm text-text-secondary max-w-sm mb-4">
          Align your training with your life goals. Defeating a campaign demon brings you closer to your ultimate vision.
        </p>
        <button className="btn-primary py-2 px-4 text-sm" onClick={() => {/* Placeholder for future create campaign flow */}}>
          Select Goal Campaign
        </button>
      </div>
    );
  }

  const hpPercent = Math.max(0, Math.min(100, (currentCampaign.current_hp / currentCampaign.max_hp) * 100));
  const isDying = hpPercent < 20;

  return (
    <div className="glass-card p-5 relative overflow-hidden flex flex-col md:flex-row md:items-center gap-5">
      <div className="absolute inset-0 pointer-events-none opacity-20"
           style={{ background: `radial-gradient(circle at right, ${isDying ? 'rgba(220,38,38,0.5)' : 'rgba(255,255,255,0.1)'}, transparent 70%)` }} />
      
      <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-crimson/10 border border-crimson/20 flex items-center justify-center">
        <Skull className={`w-7 h-7 ${isDying ? 'text-red-500 animate-pulse' : 'text-crimson'}`} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="section-label mb-1 uppercase tracking-widest text-xs flex items-center gap-1.5 text-crimson-light">
          <Swords className="w-3.5 h-3.5" /> Current Campaign
        </p>
        <h2 className="text-xl md:text-2xl font-heading font-extrabold text-white leading-tight truncate">
          {currentCampaign.demon_name}
        </h2>
        <p className="text-sm text-text-secondary mt-1">{currentCampaign.tier} Threat Level</p>
      </div>

      <div className="md:w-64 flex-shrink-0 flex flex-col gap-2 relative z-10">
        <div className="flex justify-between text-xs font-bold text-text-primary">
          <span>HP</span>
          <span className="font-mono">{currentCampaign.current_hp.toLocaleString()} / {currentCampaign.max_hp.toLocaleString()}</span>
        </div>
        <div className="h-2.5 w-full bg-void rounded-full overflow-hidden border border-white/10">
          <div 
            className={`h-full transition-all duration-1000 ${isDying ? 'bg-red-500' : 'bg-crimson'}`}
            style={{ width: `${hpPercent}%`, boxShadow: `0 0 10px ${isDying ? 'rgba(239,68,68,0.8)' : 'rgba(220,38,38,0.8)'}` }}
          />
        </div>
        <p className="text-xs text-text-muted text-right">
          {hpPercent.toFixed(1)}% remaining
        </p>
      </div>
    </div>
  );
}
