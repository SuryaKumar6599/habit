import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useSecurityStore } from './stores/securityStore';
import FinalSelectionAuth from './components/FinalSelectionAuth';
import TrainingDashboard from './components/TrainingDashboard';
import ButterflyMansionAnalytics from './components/ButterflyMansionAnalytics';
import DemonEncounter from './components/DemonEncounter';
import SlayerStatusDashboard from './components/SlayerStatusDashboard';
import Navbar from './components/Navbar';
import PrivacyScreen from './components/PrivacyScreen';
import LaunchSequence from './components/LaunchSequence';
import OnboardingFlow from './components/OnboardingFlow';
import PushPrompt from './components/PushPrompt';
import { applyElementTheme } from './lib/worldState';
import { getTimeOfDay } from './lib/greetings';
import useHabitStore from './stores/habitStore';

function App() {
  const { user, profile, loading, initialize: initAuth, signOut } = useAuthStore();
  const { initialize: initSecurity } = useSecurityStore();
  const [launchComplete, setLaunchComplete] = useState(false);
  const [hydrationTimedOutFor, setHydrationTimedOutFor] = useState(null);
  const userId = user?.id;
  const hydrationTimeout = hydrationTimedOutFor === userId;

  const handleLaunchComplete = useCallback(() => {
    setLaunchComplete(true);
  }, []);

  useEffect(() => {
    document.body.dataset.time = getTimeOfDay();
    const interval = setInterval(() => {
      document.body.dataset.time = getTimeOfDay();
    }, 60000); // Check time every minute
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (profile?.breathing_element) {
      applyElementTheme(profile.breathing_element);
    }
  }, [profile?.breathing_element]);

  useEffect(() => {
    initSecurity();
    const cleanup = initAuth();
    return () => {
      if (cleanup) cleanup();
    };
  }, [initAuth, initSecurity]);

  useEffect(() => {
    // Offline sync triggers
    const handleOnline = () => {
      useHabitStore.getState().syncOfflineActions();
    };
    window.addEventListener('online', handleOnline);
    if (user && profile) {
      handleOnline(); // initial attempt when profile is ready
    }
    return () => window.removeEventListener('online', handleOnline);
  }, [user, profile]);

  useEffect(() => {
    if (userId && !profile && !loading) {
      const timer = setTimeout(() => {
        setHydrationTimedOutFor(userId);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [userId, profile, loading]);

  if (loading || (user && !profile && !hydrationTimeout)) {
    return (
      <div className="min-h-screen bg-abyss flex items-center justify-center flex-col gap-4">
        {/* Themed spinner: nichirin blade spin */}
        <div className="w-12 h-12 rounded-full border-2 border-slate-mid border-t-crimson animate-spin-slow"></div>
        <p className="text-text-muted text-sm tracking-widest uppercase animate-pulse-glow">Awaiting Kasugai Crow...</p>
      </div>
    );
  }

  if (user && !profile && hydrationTimeout) {
    return (
      <div className="min-h-screen bg-abyss flex items-center justify-center flex-col gap-4 p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-crimson/20 flex items-center justify-center mb-4">
          <span className="text-3xl">⚠️</span>
        </div>
        <h2 className="text-xl font-heading font-bold text-text-primary">Kasugai Crow Lost Contact</h2>
        <p className="text-text-muted text-sm max-w-sm">Unable to load your Slayer Profile. The connection to headquarters may be disrupted.</p>
        <div className="flex gap-4 mt-6">
          <button onClick={() => window.location.reload()} className="btn-primary py-2 px-6">Retry</button>
          <button onClick={signOut} className="bg-white/5 hover:bg-white/10 text-white font-bold py-2 px-6 rounded-lg transition-colors">Sign Out</button>
        </div>
      </div>
    );
  }

  if (!user) {
    return <FinalSelectionAuth />;
  }

  // Route new users through the onboarding flow
  if (!profile?.first_time_setup_completed) {
    return <OnboardingFlow onComplete={() => setLaunchComplete(true)} />;
  }

  if (!launchComplete) {
    return <LaunchSequence onComplete={handleLaunchComplete} />;
  }

  return (
    <PrivacyScreen>
      <div className="min-h-screen app-shell relative selection:bg-crimson selection:text-white">
        {/* Global Background Elements */}
        <div className="fixed inset-0 app-backdrop pointer-events-none z-0 opacity-45" />
        <div className="fixed inset-0 zenitsu-bolts pointer-events-none z-0 opacity-35" />
        
        <PushPrompt />

        <div className="relative z-10 flex flex-col min-h-screen pb-safe-bottom">
          <Navbar />
          
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 md:px-6 md:py-7 lg:px-8">
            <div className="mb-6">
              <SlayerStatusDashboard />
            </div>
            
            <Routes>
              <Route path="/" element={<TrainingDashboard />} />
              <Route path="/analytics" element={<ButterflyMansionAnalytics />} />
              <Route path="/encounter" element={<DemonEncounter />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </PrivacyScreen>
  );
}

export default App;
