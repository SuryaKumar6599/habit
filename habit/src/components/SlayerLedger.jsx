import { useState, useEffect } from 'react';
import { useAuthStore, getRankInfo } from '../stores/authStore';
import useHabitStore from '../stores/habitStore';
import { 
  getBreathingBalance, 
  getTotalConcentrationConstant, 
  getTotalConcentrationTitle 
} from '../lib/analyticsEngine';
import { 
  calculateEfficiency, 
  calculateAlternativeFutures, 
  calculateWhatChanged, 
  calculateContribution,
  calculateGrowthMomentum,
  calculateETA,
  projectRank
} from '../lib/projectionEngine';
import { Swords, Compass, Flame, Crosshair, Brain, Dumbbell, Shield, Coins, AlertTriangle, TrendingUp, ChevronRight } from 'lucide-react';

export default function SlayerLedger() {
  const { profile } = useAuthStore();
  const { techniques, allLogs } = useHabitStore();
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!profile || !techniques) return;

    const currentXp = profile.total_xp || 0;
    const dailyMaxXp = Math.max(10, techniques.length * 10);
    const efficiency = calculateEfficiency(techniques, allLogs, 30);
    const momentum = calculateGrowthMomentum(allLogs);
    
    // Core Scoring
    const balance = getBreathingBalance(techniques, allLogs);
    const tcc = getTotalConcentrationConstant(balance, efficiency, momentum);
    const tccTitle = getTotalConcentrationTitle(tcc);

    // Futures
    const alternativeFutures = calculateAlternativeFutures(currentXp, efficiency, dailyMaxXp, 'Hashira');
    const currentEta = alternativeFutures.current.eta;
    
    // What Changed
    const previousEfficiency = calculateEfficiency(techniques, allLogs, 60); // proxy for previous period
    const prevEta = calculateETA(currentXp, previousEfficiency, dailyMaxXp, 'Hashira');
    const whatChanged = calculateWhatChanged(allLogs, techniques, currentEta, prevEta);

    // Growth Drivers
    const contributions = calculateContribution(techniques);

    // Future Self Card Projections
    const rank365 = projectRank(currentXp, efficiency, dailyMaxXp, 365).rank;

    setData({
      currentXp,
      efficiency,
      momentum,
      balance,
      tcc,
      tccTitle,
      alternativeFutures,
      whatChanged,
      contributions,
      rank365
    });

  }, [profile, techniques, allLogs]);

  if (!data) {
    return <div className="p-8 text-center text-text-muted animate-pulse">Consulting the Ledger...</div>;
  }

  const {
    currentXp,
    efficiency,
    momentum,
    balance,
    tcc,
    tccTitle,
    alternativeFutures,
    whatChanged,
    contributions,
    rank365
  } = data;

  const currentRank = getRankInfo(currentXp).current.rank;

  return (
    <div className="animate-fade-in pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 max-w-4xl mx-auto space-y-6">
      
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-extrabold text-text-primary mb-2 flex items-center gap-3">
          <Compass className="w-8 h-8 text-indigo-400" />
          Hashira Path Simulator
        </h1>
        <p className="text-sm text-text-secondary">Project your future identity based on your current discipline.</p>
      </div>

      {/* 1. Future Self Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-5 relative overflow-hidden border-t-2 border-zinc-500">
          <div className="absolute top-0 right-0 p-3 opacity-20"><Swords className="w-16 h-16" /></div>
          <p className="text-xs font-bold uppercase tracking-widest text-text-muted mb-4">Today</p>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-text-muted uppercase">Rank</p>
              <p className="font-heading font-bold text-xl text-text-primary">{currentRank}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase">Sword</p>
              <p className="font-heading font-semibold text-text-secondary">Training Blade</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted uppercase">Efficiency</p>
              <p className="font-mono text-zinc-300 font-bold">{efficiency}%</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 relative overflow-hidden border-t-2 border-emerald-500">
          <div className="absolute top-0 right-0 p-3 opacity-20"><Flame className="w-16 h-16 text-emerald-400" /></div>
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-400 mb-4">365 Days From Now</p>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-emerald-500/70 uppercase font-bold">Projected Rank</p>
              <p className="font-heading font-bold text-2xl text-emerald-400">{rank365}</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-500/70 uppercase font-bold">Sword Evolution</p>
              <p className="font-heading font-semibold text-text-primary">Elite Nichirin</p>
            </div>
            <div>
              <p className="text-[10px] text-emerald-500/70 uppercase font-bold">Target Efficiency</p>
              <p className="font-mono text-emerald-400 font-bold">{Math.max(efficiency, 75)}%</p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Alternative Futures */}
      <section className="glass-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-5 flex items-center gap-2">
          <Crosshair className="w-4 h-4" /> Alternative Futures
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Declining', data: alternativeFutures.declining, color: 'text-red-400', bg: 'bg-red-500/10' },
            { label: 'Current', data: alternativeFutures.current, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Improved', data: alternativeFutures.improved, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Perfect', data: alternativeFutures.perfect, color: 'text-purple-400', bg: 'bg-purple-500/10' },
          ].map((path) => (
            <div key={path.label} className={`rounded-xl p-4 border border-white/5 ${path.bg}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider mb-2 ${path.color}`}>{path.label} Path</p>
              <p className="text-2xl font-mono font-black text-text-primary">
                {path.data.eta === Infinity ? '∞' : path.data.eta}
                <span className="text-xs text-text-muted font-sans ml-1">Days</span>
              </p>
              <p className="text-[10px] text-text-muted mt-1">at {path.data.efficiency}% efficiency</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Total Concentration Constant & Breathing Balance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="glass-card p-5 md:col-span-1 flex flex-col justify-center items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 pointer-events-none" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-text-secondary mb-2 relative z-10">
            Total Concentration
          </h2>
          <div className="relative z-10 my-4">
            <div className="text-6xl font-mono font-black text-white drop-shadow-[0_0_15px_rgba(167,139,250,0.5)]">
              {tcc}<span className="text-2xl">%</span>
            </div>
          </div>
          <p className="text-sm font-heading font-bold text-indigo-300 relative z-10 uppercase tracking-widest">
            {tccTitle}
          </p>
        </section>

        <section className="glass-card p-5 md:col-span-2">
          <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-5">Breathing Balance</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Mind', value: balance.Mind, icon: Brain, color: '#a78bfa' },
              { label: 'Body', value: balance.Body, icon: Dumbbell, color: '#f87171' },
              { label: 'Discipline', value: balance.Discipline, icon: Shield, color: '#60a5fa' },
              { label: 'Wealth', value: balance.Wealth, icon: Coins, color: '#fbbf24' },
            ].map((cat) => (
              <div key={cat.label} className="text-center">
                <div 
                  className="w-10 h-10 rounded-full mx-auto mb-2 flex items-center justify-center"
                  style={{ background: `${cat.color}15`, border: `1px solid ${cat.color}30` }}
                >
                  <cat.icon className="w-4 h-4" style={{ color: cat.color }} />
                </div>
                <p className="text-lg font-mono font-bold text-text-primary">{cat.value}%</p>
                <p className="text-[10px] text-text-muted uppercase tracking-widest">{cat.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* 4. Crow Forecasts & What Changed */}
      <section className="glass-card p-5 border-l-4 border-l-indigo-500">
        <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> Crow Intelligence Report
        </h2>
        
        <div className="bg-white/5 rounded-lg p-4 mb-4">
          <p className="text-lg font-heading font-bold text-white mb-1">
            This Week: <span className={whatChanged.diffDays > 0 ? 'text-emerald-400' : whatChanged.diffDays < 0 ? 'text-red-400' : 'text-blue-400'}>{whatChanged.summary}</span>
          </p>
          <p className="text-xs text-text-muted uppercase tracking-widest">Momentum: {momentum}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Growth Catalysts
            </p>
            {whatChanged.positiveDrivers.length > 0 ? (
              <ul className="space-y-2">
                {whatChanged.positiveDrivers.map((d, i) => (
                  <li key={i} className="text-sm text-text-secondary flex justify-between">
                    <span>✓ {d.name}</span>
                    <span className="text-emerald-400 font-bold">+{d.diff}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted italic">No positive catalysts identified this week.</p>
            )}
          </div>
          <div>
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 rotate-180" /> Risk Factors
            </p>
            {whatChanged.negativeDrivers.length > 0 ? (
              <ul className="space-y-2">
                {whatChanged.negativeDrivers.map((d, i) => (
                  <li key={i} className="text-sm text-text-secondary flex justify-between">
                    <span>✗ {d.name}</span>
                    <span className="text-red-400 font-bold">{d.diff}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-text-muted italic">No risk factors detected. Path is clear.</p>
            )}
          </div>
        </div>
      </section>

      {/* 5. Top Growth Drivers */}
      <section className="glass-card p-5">
        <h2 className="text-sm font-bold uppercase tracking-widest text-text-secondary mb-4">
          Top Growth Drivers (All Time)
        </h2>
        {contributions.length > 0 ? (
          <div className="space-y-3">
            {contributions.map((c, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-mono font-bold text-zinc-500">#{i+1}</span>
                  <span className="font-heading font-semibold text-text-primary">{c.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 h-1.5 bg-black/40 rounded-full overflow-hidden hidden sm:block">
                    <div className="h-full bg-crimson" style={{ width: `${c.percentage}%` }} />
                  </div>
                  <span className="text-sm font-bold text-crimson">{c.percentage}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-text-muted text-center py-4">No growth data accumulated yet.</p>
        )}
      </section>

    </div>
  );
}
