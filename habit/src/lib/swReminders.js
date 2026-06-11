const REMINDER_CHECK_INTERVAL_MS = 60_000;
let reminderInterval = null;

async function getRegistration() {
  if (!('serviceWorker' in navigator)) return null;
  return navigator.serviceWorker.ready;
}

function postToSw(message) {
  return getRegistration().then((registration) => {
    registration?.active?.postMessage(message);
  });
}

export async function armServiceWorkerReminders(enabled) {
  const registration = await getRegistration();
  if (!registration?.active) return false;

  await postToSw({ type: 'SET_REMINDERS_ENABLED', enabled });

  if (enabled) {
    await postToSw({ type: 'CHECK_REMINDERS' });

    if ('periodicSync' in registration) {
      try {
        await registration.periodicSync.register('reminder-check', {
          minInterval: 60 * 60 * 1000,
        });
      } catch {
        // Permission or browser support may block periodic sync.
      }
    }

    if ('sync' in registration) {
      try {
        await registration.sync.register('reminder-sync');
      } catch {
        // Background sync unavailable in this browser.
      }
    }

    startForegroundSwChecks();
  } else {
    stopForegroundSwChecks();
  }

  return true;
}

function startForegroundSwChecks() {
  if (reminderInterval) return;

  const tick = () => postToSw({ type: 'CHECK_REMINDERS' });
  tick();
  reminderInterval = setInterval(tick, REMINDER_CHECK_INTERVAL_MS);

  document.addEventListener('visibilitychange', tick);
}

function stopForegroundSwChecks() {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }
}

export function registerReminderSyncOnLoad() {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready.then((registration) => {
    if ('sync' in registration) {
      registration.sync.register('reminder-sync').catch(() => {});
    }
  });
}
