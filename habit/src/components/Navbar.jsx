import { NavLink, useLocation } from 'react-router-dom';
import { useAuthStore, getRankInfo } from '../stores/authStore';
import { Sword, Activity, LogOut, Menu, X, Swords,
         Droplets, Flame, Zap, Wind, Mountain, CloudFog,
         Heart, Waves, Bug, Moon, Sun } from 'lucide-react';
import { useState } from 'react';

const ELEMENT_META = {
  Water:   { Icon: Droplets, color: '#3b82f6' },
  Flame:   { Icon: Flame,    color: '#f97316' },
  Thunder: { Icon: Zap,      color: '#eab308' },
  Wind:    { Icon: Wind,     color: '#22c55e' },
  Stone:   { Icon: Mountain, color: '#78716c' },
  Mist:    { Icon: CloudFog, color: '#06b6d4' },
  Love:    { Icon: Heart,    color: '#ec4899' },
  Serpent: { Icon: Waves,    color: '#6366f1' },
  Insect:  { Icon: Bug,      color: '#8b5cf6' },
  Moon:    { Icon: Moon,     color: '#3b5998' },
  Sun:     { Icon: Sun,      color: '#fbbf24' },
};

export default function Navbar() {
  const { profile, signOut } = useAuthStore();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const rankInfo = getRankInfo(profile?.total_xp || 0);
  const element = profile?.breathing_element || 'Water';
  const elementMeta = ELEMENT_META[element] || ELEMENT_META.Water;
  const ElementIcon = elementMeta.Icon;

  const navItems = [
    { path: '/', label: 'Training Grounds', icon: Sword },
    { path: '/analytics', label: 'Butterfly Mansion', icon: Activity },
    { path: '/encounter', label: 'Demon Encounter', icon: Swords },
  ];

  const handleSignOut = async () => { await signOut(); };
  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-void/80 backdrop-blur-xl border-b border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.6)] pt-[env(safe-area-inset-top)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">

          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <Sword className="w-4 h-4 text-crimson" />
            </div>
            <div>
              <h1 className="font-heading font-bold text-text-primary text-sm hidden sm:block">
                Demon Slayer Corps
              </h1>
              <p className="section-label !text-[9px] hidden sm:block">
                Habit Tracker
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-lg border border-white/10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-md text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-crimson/16 text-crimson-light border border-crimson/24 shadow-[inset_0_0_16px_rgba(220,38,38,0.1)]'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          {/* User Info & Actions */}
          <div className="flex items-center gap-3">
            {/* Breathing Element Badge */}
            <div
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold transition-all"
              style={{
                background: `${elementMeta.color}18`,
                border: `1px solid ${elementMeta.color}40`,
                color: elementMeta.color,
                boxShadow: `0 0 10px ${elementMeta.color}20`,
              }}
              title={`${element} Breathing`}
            >
              <ElementIcon className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">{element}</span>
            </div>

            <div className="hidden sm:flex items-center gap-3 text-right">
              <div>
                <p className="text-xs text-text-primary font-bold">{profile?.display_name || 'Recruit'}</p>
                <p className="text-[10px] text-text-muted uppercase tracking-wider">{rankInfo.current.rank}</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 text-xs font-bold kanji-display text-text-primary">
                {rankInfo.current.kanji}
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="hidden md:flex items-center justify-center w-9 h-9 rounded-md bg-white/5 hover:bg-red-500/10 text-text-muted hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
              title="Leave the Corps (Sign Out)"
              id="sign-out"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* Mobile toggle */}
            <button
              className="md:hidden p-2 rounded-md text-text-secondary hover:text-text-primary hover:bg-white/10"
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-30 pt-16 bg-void/95 backdrop-blur-xl md:hidden animate-fade-in flex flex-col">
          {/* Mobile User Card */}
          <div className="p-4 border-b border-white/10 flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center border border-white/20 text-lg font-bold kanji-display text-text-primary">
              {rankInfo.current.kanji}
            </div>
            <div>
              <p className="text-sm text-text-primary font-bold">{profile?.display_name || 'Recruit'}</p>
              <p className="text-xs text-text-muted uppercase tracking-wider">Rank: {rankInfo.current.rank}</p>
            </div>
            {/* Element badge on mobile */}
            <div
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold"
              style={{
                background: `${elementMeta.color}18`,
                border: `1px solid ${elementMeta.color}40`,
                color: elementMeta.color,
              }}
            >
              <ElementIcon className="w-3.5 h-3.5" />
              {element}
            </div>
          </div>

          <nav className="flex-1 px-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={closeMenu}
                  className={`flex items-center gap-3 px-4 py-4 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-crimson/15 text-crimson-light border border-crimson/20'
                      : 'text-text-secondary bg-white/5 border border-white/10'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </NavLink>
              );
            })}
          </nav>

          <div className="p-4 mt-auto mb-4">
            <button
              onClick={() => { closeMenu(); handleSignOut(); }}
              className="w-full flex items-center justify-center gap-2 py-4 rounded-lg bg-red-500/10 text-red-400 font-semibold border border-red-500/20"
            >
              <LogOut className="w-5 h-5" />
              Leave the Corps
            </button>
          </div>
        </div>
      )}
    </>
  );
}
