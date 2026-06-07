/**
 * BreathingBalanceChart.jsx
 * Radar-style bar chart showing mastery % for each Breathing Style.
 * Unlocks "Total Concentration: Constant" when all core 6 styles hit ≥80%.
 */
import useGrowthStore from '../stores/growthStore';
import useHabitStore, { BREATHING_ELEMENTS } from '../stores/habitStore';
import { Wind, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

const CORE_STYLES = ['Water', 'Thunder', 'Flame', 'Stone', 'Wind', 'Mist'];

export default function BreathingBalanceChart() {
  const { breathingBalance, archetypeData } = useGrowthStore();
  const { techniques } = useHabitStore();

  // Only show styles that have at least 1 habit configured
  const activeElements = [...new Set(techniques.map(t => t.breathing_element))];
  const displayStyles = activeElements.length > 0 ? activeElements : CORE_STYLES;

  const coreBalance = CORE_STYLES.map(s => breathingBalance[s] || 0);
  const isConstant = coreBalance.every(v => v >= 80);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-heading font-bold text-text-primary flex items-center gap-2">
            <Wind className="w-4 h-4 text-cyan-400" />
            Breathing Balance
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            {archetypeData ? `${archetypeData.name} Archetype` : 'Your form distribution'}
          </p>
        </div>

        {isConstant && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400/15 border border-amber-400/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-400">Constant</span>
          </div>
        )}
      </div>

      {displayStyles.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-6">
          Add breathing techniques to see your balance.
        </p>
      ) : (
        <div className="space-y-3">
          {displayStyles.map(el => {
            const elData = BREATHING_ELEMENTS[el];
            const Icon = elData ? LucideIcons[elData.icon] : null;
            const pct = breathingBalance[el] || 0;
            const isCore = CORE_STYLES.includes(el);

            return (
              <div key={el}>
                <div className="flex justify-between items-center mb-1">
                  <span
                    className="text-sm flex items-center gap-1.5 font-medium"
                    style={{ color: elData?.color || '#fff' }}
                  >
                    {Icon && <Icon className="w-3.5 h-3.5" />}
                    {elData?.label || `${el} Breathing`}
                  </span>
                  <span className="text-xs font-mono" style={{ color: elData?.color || '#aaa' }}>
                    {pct}%
                  </span>
                </div>
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: elData?.color || '#fff',
                      boxShadow: `0 0 8px ${elData?.color || '#fff'}50`,
                    }}
                  />
                </div>
                {isCore && pct >= 80 && (
                  <p className="text-[10px] text-text-muted mt-0.5 pl-1">✓ Mastered</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {isConstant && (
        <div className="mt-4 p-3 rounded-xl bg-amber-400/10 border border-amber-400/20 text-center">
          <p className="text-xs font-bold text-amber-400">
            ⚡ Total Concentration: Constant — All core styles mastered
          </p>
        </div>
      )}
    </div>
  );
}
