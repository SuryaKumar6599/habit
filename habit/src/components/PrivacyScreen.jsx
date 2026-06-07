import { ShieldAlert, Fingerprint } from 'lucide-react';
import { useSecurityStore } from '../stores/securityStore';

export default function PrivacyScreen({ children }) {
  const { isLocked, isBlurred, unlock } = useSecurityStore();

  const isOverlayActive = isLocked || isBlurred;

  return (
    <>
      <div className={isOverlayActive ? 'filter blur-md pointer-events-none select-none transition-all duration-300' : 'transition-all duration-300'}>
        {children}
      </div>

      {isOverlayActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-abyss/80 backdrop-blur-xl animate-fade-in">
          <div className="text-center p-8 glass-card max-w-sm w-full mx-4 animate-slide-up flex flex-col items-center">
            
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-6">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.3), rgba(220,38,38,0.05))',
                  border: '2px solid rgba(220,38,38,0.3)',
                  animation: 'breathing 3s ease-in-out infinite',
                }}
              />
              <ShieldAlert className="w-9 h-9 text-crimson relative z-10" strokeWidth={1.5} />
            </div>

            <h2 className="text-2xl font-heading font-bold text-white mb-2">Secure Area</h2>
            <p className="text-text-muted mb-8 text-sm">
              Your Slayer logs are sealed. Verify your identity to continue.
            </p>

            <button
              onClick={unlock}
              className="btn-primary w-full flex items-center justify-center gap-3"
            >
              <Fingerprint className="w-5 h-5" />
              Unlock App
            </button>
          </div>
        </div>
      )}
    </>
  );
}
