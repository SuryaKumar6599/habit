import { useState, useEffect, useRef, useCallback } from 'react';
import useHabitStore, { BREATHING_ELEMENTS } from '../stores/habitStore';
import { useAuthStore } from '../stores/authStore';
import { Plus, Flame, Check, Trash2, AlertCircle } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import AddTechniqueModal from './AddTechniqueModal';
import KasugaiCrow from './KasugaiCrow';
import SwordDurability from './SwordDurability';
import DemonPanel from './DemonPanel';
import HashiraTrainingModal from './HashiraTrainingModal';
import { computeActiveDemons } from '../lib/worldState';
import { supabase } from '../lib/supabaseClient';
import DailyMissions from './DailyMissions';

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
  const toastTimer = useRef(null);

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
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [user, fetchTechniques, fetchTodaysLogs, fetchAllLogs, markSessionOpen, trackEvent]);

  const activeDemons = computeActiveDemons(techniques, allLogs);

  const showToast = useCallback((msg, type = 'error') => {
    setToast({ msg, type });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  }, []);

  const handleExecute = async (techniqueId) => {
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

  return (
    <div className="animate-fade-in pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-0">
      {/* Toast notification */}
      {toast && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold animate-slide-down shadow-xl"
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-heading font-extrabold text-text-primary mb-1">
            Training Grounds
          </h1>
          <p className="text-sm text-text-secondary">Master your forms through daily repetition.</p>
        </div>
        
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Technique
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Stats & Companions */}
        <div className="lg:col-span-1 order-2 lg:order-1">
          <KasugaiCrow />
          <SwordDurability />
        </div>

        {/* Right Column: Techniques list */}
        <div className="lg:col-span-2 order-1 lg:order-2 space-y-6">
          <DailyMissions />

          {activeDemons.length > 0 && (
            <div className="mb-6">
              <DemonPanel activeDemons={activeDemons} />
            </div>
          )}

          {techniques.length === 0 ? (
            <div className="glass-card p-12 text-center border-dashed border-white/10">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Flame className="w-8 h-8 text-text-muted" />
              </div>
              <h3 className="text-lg font-bold text-text-primary mb-2">No Techniques Yet</h3>
              <p className="text-sm text-text-secondary max-w-md mx-auto">
                The Demon Slayer Corps requires daily discipline. Add your first breathing technique to begin training.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {techniques.map((technique) => {
                const element = BREATHING_ELEMENTS[technique.breathing_element];
                const isCompletedToday = todaysLogs.some(l => l.technique_id === technique.id);
                const isExecuting = executingId === technique.id;
                
                return (
                  <div 
                    key={technique.id} 
                    className={`glass-card p-5 relative overflow-hidden flex flex-col min-h-[160px] transition-all duration-500 ${
                      isCompletedToday ? 'opacity-70 scale-[0.98]' : 'hover:-translate-y-1 hover:shadow-lg hover:shadow-white/5'
                    }`}
                    style={{
                      borderLeft: `3px solid ${element?.color}`,
                    }}
                  >
                    {/* Background glow based on element */}
                    <div 
                      className="absolute top-0 right-0 w-32 h-32 rounded-full mix-blend-screen pointer-events-none transition-opacity duration-700"
                      style={{
                        background: `radial-gradient(circle, ${element?.color}20, transparent 70%)`,
                        transform: 'translate(30%, -30%)',
                        opacity: isCompletedToday ? 0.3 : 1
                      }}
                    />

                    <div className="flex justify-between items-start mb-2 relative z-10">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full"
                            style={{ 
                              color: element?.color, 
                              background: `${element?.color}15`,
                              border: `1px solid ${element?.color}30`
                            }}
                          >
                            {technique.breathing_element}
                          </span>
                          {technique.streak_count > 0 && (
                            <span className="flex items-center text-[10px] font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
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
                        className="p-1.5 text-text-muted hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
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
                          className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold tracking-wide"
                          style={{
                            background: `${element?.color}15`,
                            color: element?.color,
                            border: `1px solid ${element?.color}30`,
                            boxShadow: `inset 0 0 10px ${element?.color}10`,
                          }}
                        >
                          <Check className="w-4.5 h-4.5" strokeWidth={3} />
                          Total Concentration: Constant
                        </div>
                      ) : (
                        <div className="relative">
                          {/* Ripple burst overlay */}
                          {rippleId === technique.id && (
                            <div
                              className="absolute inset-0 rounded-xl pointer-events-none"
                              style={{
                                border: `2px solid ${element?.color}`,
                                animation: 'ripple-burst 0.6s ease-out forwards',
                              }}
                            />
                          )}
                          <button
                            onClick={() => handleExecute(technique.id)}
                            disabled={isExecuting}
                            className={`w-full py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm font-bold tracking-wide transition-all ${
                              isExecuting ? 'opacity-80 scale-[1.03]' : 'hover:scale-[1.02]'
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
                            {isExecuting ? 'Executing...' : 'Execute Form'}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
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
