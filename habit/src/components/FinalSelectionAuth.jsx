import { useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Sword, Shield, Flame, Zap, Wind, Droplets, Eye, Mail, Lock, UserRound } from 'lucide-react';
import { seededRange } from '../lib/deterministicRandom';

const AUTH_PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  left: `${seededRange(i + 1, 0, 100)}%`,
  top: `${seededRange(i + 21, 0, 100)}%`,
  width: `${seededRange(i + 41, 2, 5)}px`,
  height: `${seededRange(i + 61, 2, 5)}px`,
  background: ['#ffffff', '#f4f4f5', '#e4e4e7', '#d4d4d8', '#a1a1aa'][i % 5],
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
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden app-shell px-4 py-8">
      {/* Background Effects */}
      <div className="particle-field">
        <div className="app-backdrop absolute inset-0 opacity-45" />
        <div className="zenitsu-bolts absolute inset-0 opacity-35" />
        {/* Floating Particles */}
        {AUTH_PARTICLES.map((particle, i) => (
          <div
            key={i}
            className="particle"
            style={particle}
          />
        ))}
      </div>

      {/* Main Card */}
      <div className="relative z-10 w-full max-w-5xl animate-slide-up grid lg:grid-cols-[0.95fr_1.05fr] gap-4 lg:gap-0">
        <section className="hidden lg:flex glass-card rounded-r-none p-8 min-h-[620px] flex-col justify-between overflow-hidden relative">
          <div
            className="absolute inset-x-0 top-0 h-1"
            style={{ background: 'linear-gradient(90deg, #ffffff, #a1a1aa, #3f3f46)' }}
          />
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-wider">
              <Zap className="w-4 h-4" />
              Thunder Breathing
            </div>
            <h1 className="mt-8 text-5xl font-heading font-extrabold text-text-primary leading-tight">
              Strike once. Make today count.
            </h1>
            <p className="mt-4 text-sm text-text-secondary max-w-sm leading-6">
              A focused glass command post for fast habit actions, daily bounties, rank progress, and steady momentum.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              ['Forms', 'Daily practice'],
              ['Bounties', 'Claim XP'],
              ['Rank', 'Earn promotion'],
              ['Threats', 'Break misses'],
            ].map(([label, value]) => (
              <div key={label} className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="section-label !text-[9px]">{label}</p>
                <p className="mt-1 text-sm font-semibold text-text-primary">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <div className="glass-card lg:rounded-l-none p-6 md:p-8 lg:p-10">
          {/* Header */}
          <div className="text-center mb-7">
            {/* Corps Emblem */}
            <div className="relative inline-flex items-center justify-center w-16 h-16 mb-5">
              <div
                className="absolute inset-0 rounded-lg"
                style={{
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.02))',
                  border: '2px solid rgba(255,255,255,0.1)',
                  animation: 'breathing 3s ease-in-out infinite',
                  color: 'rgba(255,255,255,0.5)',
                }}
              />
              <Zap className="w-9 h-9 text-white relative z-10" strokeWidth={1.8} />
            </div>

            <h1
              className="text-3xl md:text-4xl font-heading font-extrabold mb-2"
              style={{
                background: 'linear-gradient(135deg, #ffffff, #d4d4d8 52%, #71717a)',
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
                className="w-8 h-8 rounded-md flex items-center justify-center"
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
              <span className="font-semibold">Crow Dispatch:</span> {error}
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
              <span className="font-semibold">Butterfly Message:</span> {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="animate-slide-down">
                <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                  Slayer Name
                </label>
                <div className="relative">
                  <UserRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your warrior name"
                    className="input-field pl-10"
                    id="auth-display-name"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Crow Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@corps.jp"
                  className="input-field pl-10"
                  required
                  id="auth-email"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
                Corps Seal
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-field pl-10 pr-12"
                  required
                  minLength={6}
                  id="auth-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-text-muted hover:text-text-secondary hover:bg-white/5 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
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
                className="text-white hover:text-zinc-300 font-semibold transition-colors"
                id="auth-toggle"
              >
                {isSignUp ? 'Return to Corps Gate' : 'Join Final Selection'}
              </button>
            </p>
          </div>
        </div>

        <p className="lg:col-span-2 text-center text-text-muted text-xs mt-2 lg:mt-6 tracking-wider">
          鬼滅の刃 · DEMON SLAYER CORPS · 滅
        </p>
      </div>
    </div>
  );
}
