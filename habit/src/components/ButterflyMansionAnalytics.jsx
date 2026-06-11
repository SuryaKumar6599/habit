/**
 * ButterflyMansionAnalytics.jsx
 * Renamed in spirit to "Slayer Ledgers" / War Room.
 * Now hosts: Hashira Path Simulator, Breathing Balance, Corruption Index,
 * Wisteria House, and the legacy heatmap.
 */
import { useEffect } from 'react';
import useHabitStore from '../stores/habitStore';
import { useAuthStore } from '../stores/authStore';
import { BookOpen } from 'lucide-react';

import HashiraPathSimulator from './HashiraPathSimulator';
import BreathingBalanceChart from './BreathingBalanceChart';
import CorruptionIndex from './CorruptionIndex';
import WisteriaHouse from './WisteriaHouse';
import CorpsSettings from './CorpsSettings';
import useGrowthStore from '../stores/growthStore';
import { dateKeyDaysAgo } from '../lib/dateKeys';

export default function ButterflyMansionAnalytics() {
  const { user, profile } = useAuthStore();
  const { allLogs, fetchAllLogs, techniques } = useHabitStore();
  const { recompute, fetchSnapshots, snapshots } = useGrowthStore();

  useEffect(() => {
    if (user) {
      fetchAllLogs(user.id);
      fetchSnapshots(user.id);
    }
  }, [user, fetchAllLogs, fetchSnapshots]);

  useEffect(() => {
    if (profile && techniques) {
      recompute(profile, allLogs, techniques);
    }
  }, [profile, allLogs, techniques, snapshots, recompute]);

  // Heatmap helpers (legacy — preserved)
  const processStats = () => {
    const dailyCounts = {};
    allLogs.forEach(log => {
      const dateStr = log.executed_at || log.logged_date;
      if (dateStr) dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    });
    return { dailyCounts };
  };

  const stats = processStats();

  const generateGrid = () => {
    const grid = [];
    for (let i = 29; i >= 0; i--) {
      const dateStr = dateKeyDaysAgo(i);
      grid.push({ date: dateStr, count: stats.dailyCounts[dateStr] || 0 });
    }
    return grid;
  };

  const heatMapGrid = generateGrid();
  const getHeatmapColor = (count) => {
    if (count === 0) return 'rgba(255,255,255,0.05)';
    if (count === 1) return 'rgba(220,38,38,0.3)';
    if (count === 2) return 'rgba(220,38,38,0.6)';
    return 'rgba(220,38,38,0.9)';
  };

  return (
    <div className="animate-fade-in pb-20 md:pb-0 space-y-8">

      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text-primary mb-1 flex items-center gap-2">
          <BookOpen className="w-7 h-7 text-white" />
          Slayer Ledgers
        </h1>
        <p className="text-sm text-text-secondary">
          Your growth trajectory, breathing mastery, and corruption analysis.
        </p>
      </div>

      {/* ── HEADLINE: Hashira Path Simulator ── */}
      <HashiraPathSimulator />

      {/* ── ROW: Breathing Balance + Corruption ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BreathingBalanceChart />
        <CorruptionIndex />
      </div>

      {/* ── Wisteria House + Settings ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WisteriaHouse />
        <CorpsSettings />
      </div>

      {/* ── Legacy Training Heatmap ── */}
      <div className="glass-card p-6">
        <h3 className="text-lg font-heading font-bold mb-4">Total Concentration Log</h3>
        <p className="text-sm text-text-secondary mb-6">Your training frequency over the last 30 days.</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {heatMapGrid.map((day, i) => (
            <div
              key={i}
              className="w-8 h-8 md:w-10 md:h-10 rounded-md transition-all hover:scale-110 relative group"
              style={{ backgroundColor: getHeatmapColor(day.count) }}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-void rounded text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10 transition-opacity">
                {day.date}: {day.count} forms
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs text-text-muted mt-2">
          <span>Less Focus</span>
          <div className="flex gap-1">
            {[0,1,2,3].map(n => (
              <div key={n} className="w-3 h-3 rounded-sm" style={{ backgroundColor: getHeatmapColor(n) }}/>
            ))}
          </div>
          <span>High Focus</span>
        </div>
      </div>

    </div>
  );
}
