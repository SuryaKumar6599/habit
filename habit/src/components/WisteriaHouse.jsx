/**
 * WisteriaHouse.jsx
 * Earned recovery token system. Users earn Wisteria Ward tokens
 * by maintaining ≥80% consistency for 14 consecutive days.
 * Max 3 tokens, max 3 days per activation, no chaining.
 */
import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import useGrowthStore from '../stores/growthStore';
import { Leaf, ShieldCheck, Lock } from 'lucide-react';

export default function WisteriaHouse() {
  const { profile, updateProfile } = useAuthStore();
  const { consistencyPercent, wisteriaTokens } = useGrowthStore();
  const [activating, setActivating] = useState(false);
  const [message, setMessage] = useState(null);

  const tokens = profile?.wisteria_tokens ?? wisteriaTokens ?? 0;
  const isResting = profile?.wisteria_active ?? false;
  const wisteriaEndDate = profile?.wisteria_end_date;

  const handleActivate = async () => {
    if (tokens <= 0) return;
    if (isResting) return;
    setActivating(true);

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 3);

    const result = await updateProfile({
      wisteria_tokens: tokens - 1,
      wisteria_active: true,
      wisteria_end_date: endDate.toISOString().split('T')[0],
    });

    if (result?.error) {
      setMessage({ text: 'Failed to activate Ward.', type: 'error' });
    } else {
      setMessage({ text: 'Wisteria Ward activated. 3 days of rest granted.', type: 'success' });
    }
    setActivating(false);
    setTimeout(() => setMessage(null), 4000);
  };

  const progressTo14Days = Math.min(100, Math.round((consistencyPercent / 80) * 70));

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Leaf className="w-5 h-5 text-green-400" />
        <h3 className="text-base font-heading font-bold text-text-primary">Wisteria House</h3>
        <span className="ml-auto text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
          Recovery Ward
        </span>
      </div>

      {/* Token display */}
      <div className="flex items-center gap-2 mb-4">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="flex-1 h-8 rounded-lg flex items-center justify-center transition-all duration-500"
            style={{
              background: i < tokens ? 'rgba(134,239,172,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${i < tokens ? 'rgba(134,239,172,0.4)' : 'rgba(255,255,255,0.1)'}`,
            }}
          >
            {i < tokens
              ? <Leaf className="w-4 h-4 text-green-400" />
              : <Lock className="w-3.5 h-3.5 text-text-muted opacity-30" />
            }
          </div>
        ))}
      </div>

      {/* Status */}
      {isResting ? (
        <div className="bg-green-400/10 border border-green-400/20 rounded-xl p-3 text-center">
          <ShieldCheck className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-sm font-bold text-green-400">Wisteria Ward Active</p>
          <p className="text-xs text-text-muted">
            Resting until {wisteriaEndDate}. Growth paused, not lost.
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-text-muted mb-3">
            Earn 1 ward by maintaining <strong className="text-text-secondary">80%+ Training Efficiency</strong> for
            14 days. Max 3 wards. Each ward grants 3 days of streak protection.
          </p>

          {/* How far to next token */}
          {tokens < 3 && (
            <div className="mb-3">
              <div className="flex justify-between text-xs text-text-muted mb-1">
                <span>Progress to next Ward</span>
                <span>{consistencyPercent}% / 80%</span>
              </div>
              <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                <div
                  className="h-full rounded-full bg-green-400 transition-all duration-1000"
                  style={{ width: `${progressTo14Days}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleActivate}
            disabled={tokens === 0 || activating}
            className="w-full py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
            style={{
              background: tokens > 0 ? 'rgba(134,239,172,0.2)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${tokens > 0 ? 'rgba(134,239,172,0.3)' : 'rgba(255,255,255,0.1)'}`,
              color: tokens > 0 ? '#86efac' : '#64748b',
              cursor: tokens > 0 ? 'pointer' : 'not-allowed',
            }}
          >
            <Leaf className="w-4 h-4" />
            {activating ? 'Activating...' : tokens > 0 ? 'Activate Wisteria Ward' : 'No Wards Available'}
          </button>
        </>
      )}

      {message && (
        <p className={`mt-2 text-xs text-center ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
