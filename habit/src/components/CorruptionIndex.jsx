/**
 * CorruptionIndex.jsx
 * Visualizes the Demon Corruption Index as a spreading threat bar.
 * The UI darkens and turns purple/red as corruption rises.
 */
import useGrowthStore, { CORRUPTION_LEVELS } from '../stores/growthStore';
import { Skull } from 'lucide-react';
import { useEffect } from 'react';

export default function CorruptionIndex() {
  const { corruptionIndex, corruptionLevel } = useGrowthStore();

  const level = corruptionLevel || CORRUPTION_LEVELS[0];
  const color = level.color;

  // Apply global corruption theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (corruptionIndex > 60) {
      root.style.setProperty('--corruption-opacity', String((corruptionIndex - 60) / 100));
    } else {
      root.style.setProperty('--corruption-opacity', '0');
    }
  }, [corruptionIndex]);

  const segments = CORRUPTION_LEVELS.map((l, i) => {
    const prevMax = i === 0 ? 0 : CORRUPTION_LEVELS[i - 1].maxIndex;
    const segWidth = ((l.maxIndex - prevMax) / 100) * 100;
    const filled = corruptionIndex >= l.maxIndex
      ? 100
      : corruptionIndex > prevMax
        ? ((corruptionIndex - prevMax) / (l.maxIndex - prevMax)) * 100
        : 0;
    return { ...l, segWidth, filled };
  });

  return (
    <div className="glass-card p-5"
      style={{ borderLeft: corruptionIndex > 50 ? `3px solid ${color}` : undefined }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-heading font-bold text-text-primary flex items-center gap-2">
          <Skull className="w-4 h-4" style={{ color }} />
          Demon Corruption
        </h3>
        <span
          className="text-xs font-bold px-2.5 py-1 rounded-lg"
          style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}
        >
          {level.label}
        </span>
      </div>

      {/* Segmented corruption bar */}
      <div className="flex gap-0.5 h-3 rounded-full overflow-hidden mb-2">
        {segments.map((seg, i) => (
          <div
            key={i}
            className="relative overflow-hidden"
            style={{ width: `${seg.segWidth}%`, background: 'rgba(255,255,255,0.05)' }}
          >
            <div
              className="absolute inset-y-0 left-0 transition-all duration-1000"
              style={{ width: `${seg.filled}%`, background: seg.color }}
            />
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-text-muted">
        <span>Protected</span>
        <span className="font-mono" style={{ color }}>{corruptionIndex}%</span>
        <span>Upper Moon</span>
      </div>

      {corruptionIndex === 0 && (
        <p className="text-xs text-green-400 mt-2">✓ Village is safe. Your discipline holds.</p>
      )}
      {corruptionIndex > 0 && corruptionIndex <= 25 && (
        <p className="text-xs text-text-muted mt-2">
          Minor inconsistency detected. Increase your Training Efficiency to purify.
        </p>
      )}
      {corruptionIndex > 25 && corruptionIndex <= 50 && (
        <p className="text-xs text-white mt-2">
          ⚠️ Demons are gathering. Return to your training before they grow stronger.
        </p>
      )}
      {corruptionIndex > 50 && (
        <p className="text-xs mt-2" style={{ color }}>
          🔴 Upper Moon presence sensed. Immediate action required.
        </p>
      )}
    </div>
  );
}
