import { useEffect } from 'react';
import useHabitStore, { BREATHING_ELEMENTS } from '../stores/habitStore';
import { useAuthStore } from '../stores/authStore';
import { Activity, Flame, ShieldAlert } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export default function ButterflyMansionAnalytics() {
  const { user } = useAuthStore();
  const { allLogs, fetchAllLogs, techniques } = useHabitStore();

  useEffect(() => {
    if (user) {
      fetchAllLogs(user.id);
    }
  }, [user, fetchAllLogs]);

  // Process data for charts
  const processStats = () => {
    let totalXP = 0;
    const elementCounts = {};
    const dailyCounts = {};

    allLogs.forEach((log) => {
      totalXP += log.xp_gained;
      
      const tech = techniques.find(t => t.id === log.technique_id);
      if (tech) {
        elementCounts[tech.breathing_element] = (elementCounts[tech.breathing_element] || 0) + 1;
      }

      const dateStr = log.executed_at;
      dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
    });

    return { totalXP, elementCounts, dailyCounts };
  };

  const stats = processStats();
  
  // Calculate max streak (simplified version for this UI)
  const maxStreak = Math.max(...techniques.map(t => t.streak_count), 0);
  
  // Demon encounters (missed days calculation - simple heuristic)
  // We assume any day with 0 logs in the past 30 days is a "Demon Encounter"
  // Note: For a real app this would need more complex logic comparing against active habits on that day
  let demonEncounters = 0;
  if (allLogs.length > 0) {
     const thirtyDaysAgo = new Date();
     thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
     const today = new Date();
     
     for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
       const dateStr = d.toISOString().split('T')[0];
       if (!stats.dailyCounts[dateStr]) {
         demonEncounters++;
       }
     }
  }

  // Generate 30 days array for the heatmap grid
  const generateGrid = () => {
    const grid = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      grid.push({
        date: dateStr,
        count: stats.dailyCounts[dateStr] || 0
      });
    }
    return grid;
  };

  const heatMapGrid = generateGrid();

  const getHeatmapColor = (count) => {
    if (count === 0) return 'rgba(255, 255, 255, 0.05)';
    if (count === 1) return 'rgba(220, 38, 38, 0.3)'; // crimson light
    if (count === 2) return 'rgba(220, 38, 38, 0.6)'; // crimson mid
    return 'rgba(220, 38, 38, 0.9)'; // crimson solid
  };

  return (
    <div className="animate-fade-in pb-20 md:pb-0">
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text-primary mb-1 flex items-center gap-2">
          <Activity className="w-7 h-7 text-love-glow" />
          Butterfly Mansion
        </h1>
        <p className="text-sm text-text-secondary">Recovery and training analytics supervised by Shinobu Kocho.</p>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="glass-card p-5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10">
             <Flame className="w-16 h-16 text-crimson" />
           </div>
           <p className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-1">Missions Cleared</p>
           <p className="text-3xl font-heading font-bold text-text-primary">{allLogs.length}</p>
           <p className="text-xs text-text-secondary mt-2">Forms executed in 30 days</p>
        </div>
        
        <div className="glass-card p-5 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-3 opacity-10">
             <Activity className="w-16 h-16 text-flame" />
           </div>
           <p className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-1">Max Streak</p>
           <p className="text-3xl font-heading font-bold text-text-primary">{maxStreak}</p>
           <p className="text-xs text-text-secondary mt-2">Highest continuous focus</p>
        </div>

        <div className="glass-card p-5 relative overflow-hidden border-l-2 border-l-purple-500">
           <div className="absolute top-0 right-0 p-3 opacity-10">
             <ShieldAlert className="w-16 h-16 text-purple-500" />
           </div>
           <p className="text-xs text-text-muted uppercase tracking-widest font-semibold mb-1">Demons Encountered</p>
           <p className="text-3xl font-heading font-bold text-text-primary">{demonEncounters}</p>
           <p className="text-xs text-text-secondary mt-2">Days with missed training</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Heatmap Section */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
            <Flame className="w-5 h-5 text-crimson" />
            Total Concentration Log
          </h3>
          <p className="text-sm text-text-secondary mb-6">Your dedication to training over the last 30 days.</p>
          
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
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getHeatmapColor(0) }}></div>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getHeatmapColor(1) }}></div>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getHeatmapColor(2) }}></div>
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: getHeatmapColor(3) }}></div>
            </div>
            <span>High Focus</span>
          </div>
        </div>

        {/* Breathing Mastery Breakdown */}
        <div className="glass-card p-6">
          <h3 className="text-lg font-heading font-bold mb-4">Breathing Mastery</h3>
          <p className="text-sm text-text-secondary mb-6">Distribution of your forms.</p>
          
          {Object.keys(stats.elementCounts).length === 0 ? (
            <p className="text-sm text-text-muted text-center py-8 border border-dashed border-white/10 rounded-lg">
              No training data available yet.
            </p>
          ) : (
            <div className="space-y-4">
              {Object.entries(stats.elementCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([element, count]) => {
                  const elData = BREATHING_ELEMENTS[element];
                  const Icon = elData ? LucideIcons[elData.icon] : null;
                  const percentage = (count / allLogs.length) * 100;
                  
                  return (
                    <div key={element}>
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="text-sm flex items-center gap-1.5" style={{ color: elData?.color || '#fff' }}>
                          {Icon && <Icon className="w-4 h-4" />}
                          {element}
                        </span>
                        <span className="text-xs font-mono text-text-muted">{count} logs</span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000"
                          style={{ 
                            width: `${percentage}%`, 
                            backgroundColor: elData?.color || '#fff',
                            boxShadow: `0 0 8px ${elData?.color}50`
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
