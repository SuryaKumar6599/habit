import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Sword, Shield, Flame, Zap, Wind, Droplets, Eye } from 'lucide-react';
import { seededRange } from '../lib/deterministicRandom';

const AUTH_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left: `${seededRange(i + 1, 0, 100)}%`,
  top: `${seededRange(i + 21, 0, 100)}%`,
  width: `${seededRange(i + 41, 2, 5)}px`,
  height: `${seededRange(i + 61, 2, 5)}px`,
  background: ['#dc2626', '#3b82f6', '#f97316', '#eab308', '#22c55e'][i % 5],
  animation: `float ${seededRange(i + 81, 4, 8)}s ease-in-out ${seededRange(i + 101, 0, 4)}s infinite, fade-in 1s ease-out`,
  opacity: seededRange(i + 121, 0.2, 0.5),
}));

export default function FinalSelectionAuth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { signUp, signIn, loading, error, clearError } = useAuthStore();
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setSuccess('');

    if (isSignUp) {
      const result = await signUp(email, password, displayName);
      if (!result.error) {
        setSuccess('A Kasugai Crow has been dispatched! Check your email to confirm enlistment.');
      }
    } else {
      await signIn(email, password);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    clearError();
    setSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-abyss">
      {/* Background Effects */}
      <div className="particle-field">
        {/* Floating Particles */}
        {AUTH_PARTICLES.map((particle, i) => (
          <div
            key={i}
            className="particle"
            style={particle}
          />
        ))}
        {/* Gradient orbs */}
        <div
          className="absolute w-96 h-96 rounded-full opacity-8"
          style={{
            background: 'radial-gradient(circle, rgba(220,38,38,0.15) 0%, transparent 70%)',
            top: '10%',
            right: '-10%',
            animation: 'float 8s ease-in-out infinite',
          }}
        />
        <div
          className="absolute w-80 h-80 rounded-full"
          style={{
            background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
            bottom: '10%',
            left: '-5%',
            animation: 'float 10s ease-in-out 2s infinite',
          }}
        />
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-md mx-4 animate-slide-up">
        <div className="glass-card p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            {/* Corps Emblem */}
            <div className="relative inline-flex items-center justify-center w-20 h-20 mb-5">
              <div
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(135deg, rgba(220,38,38,0.3), rgba(220,38,38,0.05))',
                  border: '2px solid rgba(220,38,38,0.3)',
                  animation: 'breathing 3s ease-in-out infinite',
                  color: 'rgba(220,38,38,0.4)',
                }}
              />
              <Sword className="w-9 h-9 text-crimson relative z-10" strokeWidth={1.5} />
            </div>

            <h1
              className="text-3xl md:text-4xl font-heading font-extrabold tracking-tight mb-2"
              style={{
                background: 'linear-gradient(135deg, #e8e6f0, #9896a8)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {isSignUp ? 'Final Selection' : 'Corps Gate'}
            </h1>
            <p className="text-text-secondary text-sm tracking-wide">
              {isSignUp
                ? 'Prove your worth. Enlist in the Demon Slayer Corps.'
                : 'Welcome back, Slayer. Enter the Corps headquarters.'}
            </p>
          </div>

          {/* Decorative element icons */}
          <div className="flex justify-center gap-3 mb-7">
            {[
              { Icon: Droplets, color: '#3b82f6' },
              { Icon: Flame, color: '#f97316' },
              { Icon: Zap, color: '#eab308' },
              { Icon: Wind, color: '#22c55e' },
              { Icon: Shield, color: '#78716c' },
            ].map(({ Icon, color }, i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: `${color}15`,
                  border: `1px solid ${color}30`,
                }}
              >
                <Icon className="w-4 h-4" style={{ color }} strokeWidth={2} />
              </div>
            ))}
          </div>

          {/* Error / Success Messages */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl text-sm animate-slide-down"
              style={{
                background: 'rgba(220,38,38,0.1)',
                border: '1px solid rgba(220,38,38,0.2)',
                color: '#fca5a5',
              }}
            >
              <span className="font-semibold">⚔️ Crow Dispatch:</span> {error}
            </div>
          )}

          {success && (
            <div className="mb-5 p-3.5 rounded-xl text-sm animate-slide-down"
              style={{
                background: 'rgba(34,197,94,0.1)',
                border: '1px solid rgba(34,197,94,0.2)',
                color: '#86efac',
              }}
            >
              <span className="font-semibold">🦋 Butterfly Message:</span> {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="animate-slide-down">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                  Slayer Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your warrior name"
                  className="input-field"
                  id="auth-display-name"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Crow Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@corps.jp"
                className="input-field"
                required
                id="auth-email"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Corps Seal
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pr-12"
                  required
                  minLength={6}
                  id="auth-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                  tabIndex={-1}
                >
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2.5 text-base mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
              id="auth-submit"
            >
              {loading ? (
                <div
                  className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white"
                  style={{ animation: 'spin 0.8s linear infinite' }}
                />
              ) : (
                <>
                  <Sword className="w-4.5 h-4.5" strokeWidth={2} />
                  {isSignUp ? 'Begin Final Selection' : 'Enter the Corps'}
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="mt-6 text-center">
            <p className="text-text-muted text-sm">
              {isSignUp ? 'Already a Demon Slayer?' : 'New recruit?'}{' '}
              <button
                onClick={toggleMode}
                className="text-crimson-light hover:text-crimson font-semibold transition-colors"
                id="auth-toggle"
              >
                {isSignUp ? 'Return to Corps Gate' : 'Join Final Selection'}
              </button>
            </p>
          </div>
        </div>

        {/* Bottom tagline */}
        <p className="text-center text-text-muted text-xs mt-6 tracking-wider">
          鬼滅の刃 · DEMON SLAYER CORPS · 滅
        </p>
      </div>
    </div>
  );
}
