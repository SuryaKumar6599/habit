/**
 * HashiraPathSimulator.jsx
 * The headline feature — a dual-line growth curve + interactive
 * future-projection slider. Shows Ideal Path vs Actual Path and
 * projects rank/sword/corruption at 30/90/180/365 days.
 */
import { useState } from 'react';
import useGrowthStore, { RANK_THRESHOLDS } from '../stores/growthStore';
import { TrendingUp, Zap, Target } from 'lucide-react';

// ── Tiny SVG chart (no external chart dep) ──────────────────────────────────

function PathChart({ idealPath, actualPath, width = 600, height = 200 }) {
  const allMultipliers = [...idealPath, ...actualPath].map(p => p.multiplier);
  const maxM = Math.max(...allMultipliers, 1.5);
  const minM = 1;
  const maxDay = Math.max(
    idealPath[idealPath.length - 1]?.day || 1,
    actualPath[actualPath.length - 1]?.day || 1,
    1
  );

  const toX = (day) => ((day - 1) / Math.max(maxDay - 1, 1)) * width;
  const toY = (m)   => height - ((m - minM) / (maxM - minM)) * height;

  const pathD = (pts) => pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${toX(p.day).toFixed(1)},${toY(p.multiplier).toFixed(1)}`)
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" style={{ height: 180 }}>
      <defs>
        <linearGradient id="idealGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0"/>
        </linearGradient>
        <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.4"/>
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0"/>
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map(f => (
        <line
          key={f}
          x1={0} y1={height * f} x2={width} y2={height * f}
          stroke="rgba(255,255,255,0.06)" strokeDasharray="4 6"
        />
      ))}

      {/* Ideal path area */}
      <path
        d={`${pathD(idealPath)} L${toX(idealPath[idealPath.length - 1]?.day || 1)},${height} L0,${height} Z`}
        fill="url(#idealGrad)"
      />
      {/* Actual path area */}
      <path
        d={`${pathD(actualPath)} L${toX(actualPath[actualPath.length - 1]?.day || 1)},${height} L0,${height} Z`}
        fill="url(#actualGrad)"
      />

      {/* Lines */}
      <path d={pathD(idealPath)} fill="none" stroke="#3b82f6" strokeWidth="2" strokeDasharray="6 4"/>
      <path d={pathD(actualPath)} fill="none" stroke="#ffffff" strokeWidth="2.5"/>
    </svg>
  );
}

// ── Projection Card ──────────────────────────────────────────────────────────

function ProjectionCard({ label, data }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-1 text-center">
      <p className="text-xs text-text-muted uppercase tracking-widest">{label}</p>
      <p className="text-xl font-heading font-extrabold" style={{ color: data.rank.color }}>
        {data.rank.kanji}
      </p>
      <p className="text-sm font-semibold" style={{ color: data.rank.color }}>{data.rank.rank}</p>
      <p className="text-xs text-text-secondary">{data.sword}</p>
      <p className="text-xs font-mono text-text-muted">{data.multiplier.toFixed(2)}×</p>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function HashiraPathSimulator() {
  const {
    idealPath, actualPath, actualPathFromSnapshots, projections,
    daysTrained, consistencyPercent, growthMultiplier,
  } = useGrowthStore();

  const [simConsistency, setSimConsistency] = useState(consistencyPercent);

  const isAhead = actualPath.length > 0 &&
    actualPath[actualPath.length - 1]?.multiplier >= idealPath[actualPath.length - 1]?.multiplier;

  // Project with sim consistency
  const simProject = (extraDays) => {
    const futureDay = daysTrained + extraDays;
    const c = simConsistency / 100;
    const m = +(1 + Math.log10(futureDay + 1) * (0.5 + 0.5 * c * c)).toFixed(2);
    const rank = RANK_THRESHOLDS.reduce((acc, r) => m >= r.multiplierMin ? r : acc, RANK_THRESHOLDS[0]);
    return { multiplier: m, rank };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-text-primary flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-white" />
            Hashira Path Simulator
          </h2>
          <p className="text-sm text-text-secondary mt-0.5">
            Your compounding growth trajectory vs the 1% Ideal Path
          </p>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-xs font-bold"
          style={{
            background: isAhead ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
            color: isAhead ? '#4ade80' : '#f87171',
            border: `1px solid ${isAhead ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}
        >
          {isAhead ? '↑ Ahead of Ideal' : '↓ Behind Ideal'}
        </div>
      </div>

      {/* Growth curve chart */}
      <div className="glass-card p-5">
        <div className="flex gap-4 text-xs text-text-muted mb-4">
          <span className="flex items-center gap-1.5">
            <span className="w-6 border-t-2 border-dashed border-blue-400 inline-block"/> Ideal Path (1%/day)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-6 border-t-2 border-white inline-block"/>
            {actualPathFromSnapshots ? 'Recorded Path' : 'Your Path'}
          </span>
        </div>

        {idealPath.length > 1 || actualPath.length > 1 ? (
          <PathChart idealPath={idealPath} actualPath={actualPath} />
        ) : (
          <div className="h-40 flex items-center justify-center text-text-muted text-sm">
            Complete at least 2 days of training to see your growth curve.
          </div>
        )}

        <div className="mt-3 flex justify-between text-xs text-text-muted">
          <span>Day 1</span>
          <span className="font-mono text-white">{growthMultiplier.toFixed(2)}× current</span>
          <span>Day {daysTrained}</span>
        </div>
      </div>

      {/* Future Projections (current consistency) */}
      <div>
        <h3 className="text-sm font-heading font-bold text-text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
          <Target className="w-4 h-4 text-white" />
          Your Current Trajectory
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {projections.d30  && <ProjectionCard label="30 Days" data={projections.d30}  />}
          {projections.d90  && <ProjectionCard label="90 Days" data={projections.d90}  />}
          {projections.d180 && <ProjectionCard label="6 Months" data={projections.d180}/>}
          {projections.d365 && <ProjectionCard label="1 Year"   data={projections.d365}/>}
        </div>
      </div>

      {/* Simulator Slider */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-heading font-bold text-text-secondary uppercase tracking-widest mb-1 flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          Simulate Your Future
        </h3>
        <p className="text-xs text-text-muted mb-4">
          Drag to adjust Training Efficiency and see how your rank evolves.
        </p>

        <div className="flex items-center gap-4 mb-4">
          <span className="text-xs text-text-muted w-16">
            {simConsistency}% eff.
          </span>
          <input
            type="range" min="10" max="100" step="5"
            value={simConsistency}
            onChange={e => setSimConsistency(Number(e.target.value))}
            className="flex-1 accent-white"
          />
          <span className="text-xs text-text-muted w-20 text-right">
            {simProject(365).rank.rank}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2">
          {[
            { label: '30d', days: 30 },
            { label: '90d', days: 90 },
            { label: '6mo', days: 180 },
            { label: '1yr', days: 365 },
          ].map(({ label, days }) => {
            const sim = simProject(days);
            return (
              <div key={label} className="text-center p-2 rounded-lg bg-white/3">
                <p className="text-xs text-text-muted">{label}</p>
                <p className="text-base font-heading font-bold" style={{ color: sim.rank.color }}>
                  {sim.rank.kanji}
                </p>
                <p className="text-[10px] text-text-muted">{sim.multiplier.toFixed(1)}×</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
