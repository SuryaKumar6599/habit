import { useState, useEffect, useRef, useCallback } from 'react';
import useHabitStore, { BREATHING_ELEMENTS, getTechniqueMasteryInfo } from '../stores/habitStore';
import { useAuthStore } from '../stores/authStore';
import { Plus, Check, Trash2, AlertCircle, Swords, Brain, Dumbbell, Shield, ShieldAlert, Coins } from 'lucide-react';
import AddTechniqueModal from './AddTechniqueModal';
import HashiraTrainingModal from './HashiraTrainingModal';
import BreathingEffect from './BreathingEffect';
import { supabase } from '../lib/supabaseClient';

// New layout components
import SlayerStatusDashboard from './SlayerStatusDashboard';
import CurrentCampaignCard from './CurrentCampaignCard';
import KasugaiCrow from './KasugaiCrow';
import GrowthSnapshotCard from './GrowthSnapshotCard';

const CATEGORY_ICONS = {
  Mind: Brain,
  Body: Dumbbell,
  Discipline: Shield,
  Wealth: Coins,
};

export default function TrainingDashboard() {
  const { user, trackEvent } = useAuthStore();
  const {
    techniques,
    todaysLogs,
    allLogs,
    loading,
    fetchTechniques,
    fetchTodaysLogs,
    fetchAllLogs,
    detectMissedDays,
    executeForm,
    deleteTechnique,
    markSessionOpen,
  } = useHabitStore();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [executingId, setExecutingId] = useState(null);
  const [rippleId, setRippleId] = useState(null);
  const [toast, setToast] = useState(null);
  const [showHashiraModal, setShowHashiraModal] = useState(false);
  const [completionEffect, setCompletionEffect] = useState(null);
  const [highlightTechniqueId, setHighlightTechniqueId] = useState(null);
  
  const toastTimer = useRef(null);
  const effectTimer = useRef(null);
  const techniqueRefs = useRef({});

  useEffect(() => {
    if (user) {
      fetchTechniques(user.id);
      fetchTodaysLogs(user.id);
      const loadData = async () => {
        await fetchAllLogs(user.id);
        await detectMissedDays(user.id);
      };
      loadData();
      markSessionOpen();
      // Track app_open analytics
      if (typeof trackEvent === 'function') {
        trackEvent('app_open', 'session', 1, { source: 'dashboard' });
      }

      // Check if Hashira can spawn
      const checkHashira = async () => {
        const { data, error } = await supabase.rpc('can_spawn_hashira', { user_id: user.id });
        if (!error && data === true) {
          setShowHashiraModal(true);
        }
      };
      checkHashira();
    }
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (effectTimer.current) clearTimeout(effectTimer.current);
    };
  }, [user, fetchTechniques, fetchTodaysLogs, fetchAllLogs, detectMissedDays, markSessionOpen, trackEvent]);

  const showToast = useCallback((msg, type = 'error') => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const handleExecute = async (techniqueId) => {
    const technique = techniques.find((t) => t.id === techniqueId);
    setExecutingId(techniqueId);
    setRippleId(techniqueId);
    const result = await executeForm(techniqueId, user.id);
    setTimeout(() => {
      setExecutingId(null);
      setRippleId(null);
    }, 700);
    
    if (result?.error) {
      showToast(`⚠️ Failed to save: ${result.error}`);
    } else if (result?.queued) {
      showToast('📡 Offline — habit queued for sync', 'warn');
      setCompletionEffect({
        id: `${techniqueId}-${Date.now()}`,
        element: technique?.breathing_element || 'Water',
        techniqueName: technique?.form_name || 'Queued Form',
      });
    } else if (!result?.alreadyDone) {
      setCompletionEffect({
        id: `${techniqueId}-${Date.now()}`,
        element: technique?.breathing_element || 'Water',
        techniqueName: technique?.form_name || 'Completed Form',
      });
    }

    if (!result?.error && !result?.alreadyDone) {
      if (effectTimer.current) clearTimeout(effectTimer.current);
      effectTimer.current = setTimeout(() => setCompletionEffect(null), 2900);
    }
  };

  const handleDelete = async (techniqueId) => {
    if (window.confirm('Are you sure you want to delete this technique?')) {
      await deleteTechnique(techniqueId);
    }
  };

  const renderTechniqueCard = (technique, index = 0) => {
    const element = BREATHING_ELEMENTS[technique.breathing_element];
    const isCompletedToday = todaysLogs.some(l => l.technique_id === technique.id);
    const isExecuting = executingId === technique.id;
    const masteryInfo = getTechniqueMasteryInfo(technique.level || 1, technique.xp || 0);

    return (
      <div
        key={technique.id}
        ref={(el) => { techniqueRefs.current[technique.id] = el; }}
        className={`technique-card interactive-card glass-card p-4 relative overflow-hidden flex flex-col min-h-[190px] transition-all duration-300 ${
          isCompletedToday ? 'opacity-72' : 'glass-card-hover'
        } ${highlightTechniqueId === technique.id ? 'ring-2 ring-crimson/60' : ''}`}
        style={{
          borderLeft: `2px solid ${element?.color}`,
          '--technique-color': element?.color,
          animationDelay: `${Math.min(index * 50, 260)}ms`,
        }}
      >
        <div className="technique-card__idle-aura" />
        <div className="technique-card__breath-line technique-card__breath-line--one" />
        <div className="technique-card__breath-line technique-card__breath-line--two" />
        <div
          className="absolute inset-x-0 top-0 h-px pointer-events-none transition-opacity duration-700"
          style={{
            background: `linear-gradient(90deg, transparent, ${element?.color}80, transparent)`,
            opacity: isCompletedToday ? 0.3 : 1
          }}
        />

        <div className="flex justify-between items-start gap-3 mb-2 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{
                  color: element?.color,
                  background: `${element?.color}15`,
                  border: `1px solid ${element?.color}30`
                }}
              >
                {technique.breathing_element}
              </span>
              <span className="text-[10px] font-bold text-text-secondary bg-white/5 border border-white/10 px-2 py-0.5 rounded-md">
                Lv. {technique.level || 1} {masteryInfo.title}
              </span>
            </div>
            <h3 className="text-lg font-bold text-text-primary leading-tight mt-1">
              {technique.form_name}
            </h3>
          </div>

          <button
            onClick={() => handleDelete(technique.id)}
            className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors shrink-0"
            title="Delete Technique"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="mb-4 relative z-10">
          <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mb-1">
            <div 
              className="h-full rounded-full transition-all duration-500" 
              style={{ width: `${masteryInfo.progress}%`, background: element?.color }} 
            />
          </div>
          <p className="text-[9px] text-text-muted text-right">
            {(technique.xp || 0)} / {masteryInfo.requiredForNext} XP
          </p>
        </div>

        <div className="mt-auto relative z-10">
          {isCompletedToday ? (
            <div
              className="w-full py-2.5 rounded-md flex items-center justify-center gap-2 text-sm font-bold tracking-wide"
              style={{
                background: `${element?.color}15`,
                color: element?.color,
                border: `1px solid ${element?.color}30`,
                boxShadow: `inset 0 0 10px ${element?.color}10`,
              }}
            >
              <Check className="w-4.5 h-4.5" strokeWidth={3} />
              Completed Today
            </div>
          ) : (
            <div className="relative">
              {rippleId === technique.id && (
                <div
                  className="absolute inset-0 rounded-md pointer-events-none"
                  style={{
                    border: `2px solid ${element?.color}`,
                    animation: 'ripple-burst 0.6s ease-out forwards',
                  }}
                />
              )}
              <button
                onClick={() => handleExecute(technique.id)}
                disabled={isExecuting}
                className={`execute-button w-full py-2.5 rounded-md flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-all ${
                  isExecuting ? 'opacity-80' : 'hover:brightness-110'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${element?.color}dd, ${element?.color})`,
                  color: '#fff',
                  boxShadow: isExecuting
                    ? `0 0 30px ${element?.color}70`
                    : `0 4px 15px ${element?.color}40`,
                  animation: isExecuting ? 'execute-burst 0.5s cubic-bezier(0.16, 1, 0.3, 1)' : 'none',
                }}
              >
                <Swords className="w-4 h-4" />
                {isExecuting ? 'Executing...' : 'Execute Form'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading && techniques.length === 0) {
    return <div className="text-center py-20 text-text-muted animate-pulse">Loading training grounds...</div>;
  }

  // Group techniques by category (Mind, Body, Discipline, Wealth), fallback to Mind
  const groupedTechniques = techniques.reduce((acc, tech) => {
    let cat = tech.category;
    if (!['Mind', 'Body', 'Discipline', 'Wealth'].includes(cat)) {
      cat = 'Mind'; // default
    }
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tech);
    return acc;
  }, { Mind: [], Body: [], Discipline: [], Wealth: [] });

  return (
    <div className="animate-fade-in pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8 max-w-3xl mx-auto">
      <BreathingEffect key={completionEffect?.id} effect={completionEffect} />

      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold animate-slide-down shadow-xl"
          style={{
            background: toast.type === 'warn' ? 'rgba(234,179,8,0.15)' : 'rgba(220,38,38,0.15)',
            border: `1px solid ${toast.type === 'warn' ? 'rgba(234,179,8,0.3)' : 'rgba(220,38,38,0.3)'}`,
            color: toast.type === 'warn' ? '#fde047' : '#fca5a5',
            backdropFilter: 'blur(12px)',
          }}
        >
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {toast.msg}
        </div>
      )}

      {/* 1. Slayer Status */}
      <div className="mb-4">
        <SlayerStatusDashboard />
      </div>

      {/* 2. Current Campaign */}
      <div className="mb-4">
        <CurrentCampaignCard />
      </div>

      {/* 3. Crow Guidance */}
      <div className="mb-8">
        <KasugaiCrow />
      </div>

      {/* 4. Today's Training Header */}
      <div className="flex items-center justify-between mb-4 mt-8 px-1">
        <div>
          <h2 className="text-xl font-heading font-extrabold text-text-primary">Today's Training</h2>
          <p className="text-sm text-text-secondary">Execute your forms with absolute focus.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-text-primary border border-white/10 transition-colors"
          title="Add Technique"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* 4. Techniques Grouped */}
      <div className="space-y-8 mb-8">
        {['Mind', 'Body', 'Discipline', 'Wealth'].map((category) => {
          const techs = groupedTechniques[category];
          if (!techs || techs.length === 0) return null;
          const Icon = CATEGORY_ICONS[category] || ShieldAlert;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3 pl-1">
                <Icon className="w-4 h-4 text-crimson" />
                <h3 className="font-heading font-bold text-text-primary">{category} Forms</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {techs.map((technique, index) => renderTechniqueCard(technique, index))}
              </div>
            </div>
          );
        })}

        {techniques.length === 0 && (
          <div className="glass-card p-10 text-center border-dashed border-white/10">
            <h3 className="text-lg font-bold text-text-primary mb-2">No Techniques Yet</h3>
            <p className="text-sm text-text-secondary max-w-md mx-auto mb-4">
              The Demon Slayer Corps requires daily discipline. Add your first breathing technique to begin training.
            </p>
            <button onClick={() => setIsAddModalOpen(true)} className="btn-primary inline-flex items-center px-4 py-2">
              <Plus className="w-4 h-4 mr-2" />
              Add Technique
            </button>
          </div>
        )}
      </div>

      {/* 5. Growth Snapshot */}
      <div className="mb-8">
        <GrowthSnapshotCard />
      </div>

      <AddTechniqueModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
      {showHashiraModal && <HashiraTrainingModal onClose={() => setShowHashiraModal(false)} />}
    </div>
  );
}
