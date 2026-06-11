/// <reference lib="webworker" />
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
self.skipWaiting();
clientsClaim();

const DB_NAME = 'kasugai-crow-reminders';
const DB_VERSION = 1;

const REMINDERS = [
  {
    id: 'morning',
    hour: 8,
    minute: 0,
    title: 'Kasugai Crow',
    body: 'CAW! Daily bounties await at the Training Grounds. Do not keep the Corps waiting.',
  },
  {
    id: 'evening',
    hour: 18,
    minute: 0,
    title: 'Kasugai Crow',
    body: 'CAW! Night approaches. Complete your forms before demons grow bolder.',
  },
];

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta');
      }
    };
  });
}

async function idbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly');
    const request = tx.objectStore('meta').get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function idbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite');
    tx.objectStore('meta').put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function todayKey() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function checkAndFireReminders() {
  const enabled = await idbGet('notifications_enabled');
  if (!enabled) return;

  const now = new Date();
  const dateKey = todayKey();
  const fired = (await idbGet('fired')) || {};

  for (const reminder of REMINDERS) {
    const fireKey = `${dateKey}-${reminder.id}`;
    if (fired[fireKey]) continue;
    if (now.getHours() !== reminder.hour || now.getMinutes() !== reminder.minute) continue;

    await self.registration.showNotification(reminder.title, {
      body: reminder.body,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: `kasugai-${reminder.id}`,
      data: { url: '/' },
    });

    fired[fireKey] = true;
  }

  await idbSet('fired', fired);
}

self.addEventListener('message', (event) => {
  const { type, enabled } = event.data || {};

  if (type === 'SET_REMINDERS_ENABLED') {
    idbSet('notifications_enabled', enabled);
  }

  if (type === 'CHECK_REMINDERS') {
    checkAndFireReminders();
  }
});

self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'reminder-check') {
    event.waitUntil(checkAndFireReminders());
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'reminder-sync') {
    event.waitUntil(checkAndFireReminders());
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      const existing = windowClients.find((client) => 'focus' in client);
      if (existing) {
        existing.focus();
        return undefined;
      }
      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(checkAndFireReminders());
});
