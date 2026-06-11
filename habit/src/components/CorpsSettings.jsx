import { useState } from 'react';
import { Bell, BellOff, Shield, Smartphone } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import {
  enableNotifications,
  disableNotifications,
  notificationsEnabled,
} from '../lib/notifications';

export default function CorpsSettings() {
  const [enabled, setEnabled] = useState(notificationsEnabled());
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const platform = Capacitor.getPlatform();
  const isNative = platform !== 'web';

  const handleToggle = async () => {
    setBusy(true);
    setMessage(null);

    if (enabled) {
      await disableNotifications();
      setEnabled(false);
      setMessage('Crow reminders disarmed.');
    } else {
      const ok = await enableNotifications();
      setEnabled(ok);
      setMessage(ok
        ? 'Crow reminders armed for 8am bounties and 6pm streak checks.'
        : 'Permission denied. Enable notifications in system settings.');
    }

    setBusy(false);
    setTimeout(() => setMessage(null), 4000);
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Shield className="w-5 h-5 text-purple-400" />
        <h3 className="text-base font-heading font-bold text-text-primary">Corps Settings</h3>
      </div>

      <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
        <div className="w-9 h-9 rounded-lg bg-purple-500/15 flex items-center justify-center shrink-0">
          {enabled ? <Bell className="w-4 h-4 text-purple-400" /> : <BellOff className="w-4 h-4 text-text-muted" />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary">Kasugai Crow Reminders</p>
          <p className="text-xs text-text-muted mt-0.5">
            Morning bounty alert (8:00) and evening streak warning (18:00).
            {isNative ? ' Uses native notifications.' : ' Uses PWA service worker when installed.'}
          </p>
          <div className="flex items-center gap-2 mt-2 text-[10px] text-text-muted uppercase tracking-wider">
            <Smartphone className="w-3 h-3" />
            Platform: {platform}
          </div>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={busy}
          className={`shrink-0 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
            enabled
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              : 'bg-white/10 text-text-secondary border border-white/15 hover:bg-white/15'
          }`}
        >
          {busy ? '...' : enabled ? 'On' : 'Off'}
        </button>
      </div>

      {message && (
        <p className="mt-2 text-xs text-text-secondary text-center">{message}</p>
      )}
    </div>
  );
}
