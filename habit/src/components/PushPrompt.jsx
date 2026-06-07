import { useState, useEffect } from 'react';
import { Bell, X } from 'lucide-react';

export default function PushPrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Check if already asked
    const asked = localStorage.getItem('push_prompt_asked');
    if (!asked) {
      // Delay showing the prompt
      const timer = setTimeout(() => setShow(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleResponse = (accepted) => {
    localStorage.setItem('push_prompt_asked', 'true');
    setShow(false);
    
    if (accepted) {
      // Mock requesting notification permissions
      if ('Notification' in window) {
        Notification.requestPermission().then((permission) => {
          if (permission === 'granted') {
            new Notification('Kasugai Crow', {
              body: 'CAW! I will notify you of missions and demons!',
              icon: '/favicon.svg'
            });
          }
        });
      }
    }
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 animate-slide-up">
      <div className="glass-card p-5 border border-purple-500/30 relative overflow-hidden shadow-2xl">
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(168,85,247,0.15), transparent 70%)' }}
        />
        
        <button 
          onClick={() => handleResponse(false)}
          className="absolute top-3 right-3 text-text-muted hover:text-text-primary z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 relative z-10">
          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center border border-purple-500/40 flex-shrink-0">
            <Bell className="w-5 h-5 text-purple-400 animate-shake" />
          </div>
          <div>
            <h4 className="font-bold text-text-primary mb-1">Kasugai Crow Updates</h4>
            <p className="text-xs text-text-secondary mb-3 leading-relaxed">
              Allow the crow to notify you about demon sightings, Hashira encounters, and your daily training.
            </p>
            <div className="flex gap-2">
              <button 
                onClick={() => handleResponse(true)}
                className="px-4 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 text-white text-xs font-bold transition-colors"
              >
                Allow
              </button>
              <button 
                onClick={() => handleResponse(false)}
                className="px-4 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-text-muted text-xs font-bold transition-colors"
              >
                Not Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
