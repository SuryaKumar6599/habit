import { useState, useMemo } from 'react';
import useHabitStore from '../stores/habitStore';
import DemonPanel from './DemonPanel';
import { computeActiveDemons } from '../lib/worldState';
import { Skull, ShieldAlert } from 'lucide-react';

export default function DemonEncyclopedia() {
  const { techniques, allLogs } = useHabitStore();
  const activeDemons = useMemo(() => computeActiveDemons(techniques, allLogs), [techniques, allLogs]);

  return (
    <div className="animate-fade-in pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
      <div className="glass-card p-4 md:p-5 mb-6 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-crimson/0 via-crimson/50 to-crimson/0" />
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-lg bg-crimson/10 border border-crimson/20 flex items-center justify-center">
            <Skull className="w-5 h-5 text-crimson" />
          </div>
          <div>
            <p className="section-label mb-0.5">Corps Intelligence</p>
            <h1 className="text-2xl font-heading font-extrabold text-text-primary leading-none">
              Demon Encyclopedia
            </h1>
          </div>
        </div>
        <p className="text-sm text-text-secondary mt-2">
          Monitor active threats spawned from missed training sessions. Defeat them by executing their corresponding forms.
        </p>
      </div>

      <div className="space-y-6">
        {activeDemons.length > 0 ? (
          <DemonPanel demons={activeDemons} onVanquish={() => {}} />
        ) : (
          <div className="glass-card p-12 text-center border-dashed border-white/10">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
              <ShieldAlert className="w-8 h-8 text-text-muted" />
            </div>
            <h3 className="text-xl font-heading font-bold text-text-primary mb-2">No Active Threats</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto">
              Your dedication is absolute. No demons have manifested from neglect recently. Keep your blade sharp.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
