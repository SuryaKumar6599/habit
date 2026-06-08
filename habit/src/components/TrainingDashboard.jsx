import { useState, useEffect, useRef, useCallback } from 'react';
import useHabitStore, { BREATHING_ELEMENTS } from '../stores/habitStore';
import { useAuthStore } from '../stores/authStore';
import { Plus, Flame, Check, Trash2, AlertCircle, Swords, Target, Shield, Skull } from 'lucide-react';
import AddTechniqueModal from './AddTechniqueModal';
import KasugaiCrow from './KasugaiCrow';
import SwordDurability from './SwordDurability';
import DemonPanel from './DemonPanel';
import HashiraTrainingModal from './HashiraTrainingModal';
import { computeActiveDemons } from '../lib/worldState';
import { supabase } from '../lib/supabaseClient';
import DailyMissions from './DailyMissions';
import BreathingEffect from './BreathingEffect';

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
  const [activePanel, setActivePanel] = useState('forms');
  const toastTimer = useRef(null);
  const effectTimer = useRef(null);

  useEffect(() => {
    if (user) {
      fetchTechniques(user.id);
      fetchTodaysLogs(user.id);
      fetchAllLogs(user.id);
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
  }, [user, fetchTechniques, fetchTodaysLogs, fetchAllLogs, markSessionOpen, trackEvent]);

  const activeDemons = computeActiveDemons(techniques, allLogs);
  const completedTodayCount = techniques.filter((technique) =>
    todaysLogs.some((log) => log.technique_id === technique.id)
  ).length;
  const completionRate = techniques.length > 0
    ? Math.round((completedTodayCount / techniques.length) * 100)
    : 0;
  const supportCount = 2;
  const panelTabs = [
    { id: 'forms', label: 'Forms', count: techniques.length, Icon: Swords },
    { id: 'missions', label: 'Bounties', count: null, Icon: Target },
    { id: 'threats', label: 'Threats', count: activeDemons.length, Icon: Skull },
    { id: 'support', label: 'Support', count: supportCount, Icon: Shield },
  ];

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

  if (loading && techniques.length === 0) {
    return <div className="text-center py-20 text-text-muted animate-pulse">Loading forms...</div>;
  }

  const renderEmptyTechniques = () => (
    <div className="glass-card p-10 text-center border-dashed border-white/10">
      <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
        <Flame className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-lg font-bold text-text-primary mb-2">No Techniques Yet</h3>
      <p className="text-sm text-text-secondary max-w-md mx-auto">
        The Demon Slayer Corps requires daily discipline. Add your first breathing technique to begin training.
      </p>
    </div>
  );

  const renderTechniqueCard = (technique, index = 0, isRailCard = false) => {
    const element = BREATHING_ELEMENTS[technique.breathing_element];
    const isCompletedToday = todaysLogs.some(l => l.technique_id === technique.id);
    const isExecuting = executingId === technique.id;

    return (
      <div
        key={technique.id}
        className={`technique-card interactive-card glass-card p-4 relative overflow-hidden flex flex-col min-h-[178px] transition-all duration-300 ${
          isCompletedToday ? 'opacity-72' : 'glass-card-hover'
        } ${isRailCard ? 'min-w-[82vw] snap-start' : ''}`}
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

        <div className="flex justify-between items-start gap-3 mb-3 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
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
              {technique.streak_count > 0 && (
                <span className="flex items-center text-[10px] font-bold text-white bg-white/10 px-2 py-0.5 rounded-md border border-white/20">
                  <Flame className="w-3 h-3 mr-1" /> {technique.streak_count} Streak
                </span>
              )}
            </div>
            <h3 className="text-lg font-bold text-text-primary leading-tight mt-2">
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

        <p className="text-xs text-text-secondary mb-4 line-clamp-2 relative z-10">
          {technique.description}
        </p>

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
                id={`execute-${technique.id}`}
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

  const renderMobilePanel = () => {
    if (activePanel === 'forms') {
      return techniques.length === 0 ? renderEmptyTechniques() : (
        <div className="mobile-card-rail">
          {techniques.map((technique, index) => renderTechniqueCard(technique, index, true))}
        </div>
      );
    }

    if (activePanel === 'missions') {
      return <DailyMissions compactRail />;
    }

    if (activePanel === 'threats') {
      return activeDemons.length > 0 ? (
        <DemonPanel demons={activeDemons} compactRail />
      ) : (
        <div className="glass-card p-6 text-center">
          <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-base font-heading font-bold text-text-primary">No active threats</h3>
          <p className="text-xs text-text-muted mt-1">Your missed-day pressure is clear for now.</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <KasugaiCrow />
        <SwordDurability />
      </div>
    );
  };

  return (
    <div className="animate-fade-in pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-0">
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
      <div className="glass-card p-4 md:p-5 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-crimson/0 via-crimson/50 to-crimson/0" />
        <div>
          <p className="section-label mb-1">Training Grounds</p>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text-primary mb-1">
            Training Grounds
          </h1>
          <p className="text-sm text-text-secondary">{completedTodayCount} of {techniques.length} forms completed today.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-24">
              <p className="section-label !text-[9px]">Today</p>
              <p className="font-heading font-bold text-text-primary">{completionRate}%</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 min-w-24">
              <p className="section-label !text-[9px]">Threats</p>
              <p className="font-heading font-bold text-text-primary">{activeDemons.length}</p>
            </div>
          </div>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-primary flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Technique
          </button>
        </div>
      </div>

      <div className="lg:hidden">
        <div className="section-switcher mb-4" role="tablist" aria-label="Training dashboard sections">
          {panelTabs.map(({ id, label, count, Icon }) => {
            const isActive = activePanel === id;
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActivePanel(id)}
                className={`section-switcher__button ${isActive ? 'section-switcher__button--active' : ''}`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
                {count !== null && <strong>{count}</strong>}
              </button>
            );
          })}
        </div>

        <div key={activePanel} className="dashboard-panel">
          {renderMobilePanel()}
        </div>
      </div>

      <div className="hidden lg:grid grid-cols-[minmax(260px,0.9fr)_minmax(0,2fr)] gap-6">
        {/* Left Column: Stats & Companions */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <KasugaiCrow />
          <SwordDurability />
        </div>

        {/* Right Column: Techniques list */}
        <div className="order-1 lg:order-2 space-y-5">
          <DailyMissions />

          {activeDemons.length > 0 && (
            <div className="mb-6">
              <DemonPanel demons={activeDemons} />
            </div>
          )}

          {techniques.length === 0 ? (
            renderEmptyTechniques()
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {techniques.map((technique, index) => renderTechniqueCard(technique, index))}
            </div>
          )}
        </div>
      </div>

      <AddTechniqueModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      {showHashiraModal && (
        <HashiraTrainingModal onClose={() => setShowHashiraModal(false)} />
      )}
    </div>
  );
}
