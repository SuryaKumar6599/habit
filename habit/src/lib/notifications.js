import { Capacitor } from '@capacitor/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { armServiceWorkerReminders, registerReminderSyncOnLoad } from './swReminders';

const MORNING_ID = 1001;
const EVENING_ID = 1002;
const PERMISSION_KEY = 'notifications_enabled';

const REMINDERS = [
  {
    id: MORNING_ID,
    hour: 8,
    minute: 0,
    title: 'Kasugai Crow',
    body: 'CAW! Daily bounties await at the Training Grounds. Do not keep the Corps waiting.',
  },
  {
    id: EVENING_ID,
    hour: 18,
    minute: 0,
    title: 'Kasugai Crow',
    body: 'CAW! Night approaches. Complete your forms before demons grow bolder.',
  },
];

const isNative = () => Capacitor.getPlatform() !== 'web';

export function notificationsEnabled() {
  return localStorage.getItem(PERMISSION_KEY) === 'true';
}

export async function requestNotificationPermission() {
  if (isNative()) {
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') {
      localStorage.setItem(PERMISSION_KEY, 'true');
      return true;
    }

    const result = await LocalNotifications.requestPermissions();
    const granted = result.display === 'granted';
    localStorage.setItem(PERMISSION_KEY, granted ? 'true' : 'false');
    return granted;
  }

  if (!('Notification' in window)) return false;

  const permission = Notification.permission === 'granted'
    ? 'granted'
    : await Notification.requestPermission();

  const granted = permission === 'granted';
  localStorage.setItem(PERMISSION_KEY, granted ? 'true' : 'false');
  return granted;
}

async function scheduleNativeReminders() {
  await LocalNotifications.cancel({ notifications: REMINDERS.map((r) => ({ id: r.id })) });

  const notifications = REMINDERS.map((reminder) => {
    const at = nextOccurrence(reminder.hour, reminder.minute);
    return {
      id: reminder.id,
      title: reminder.title,
      body: reminder.body,
      schedule: { at, repeats: true, every: 'day' },
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#dc2626',
    };
  });

  await LocalNotifications.schedule({ notifications });
}

function nextOccurrence(hour, minute) {
  const at = new Date();
  at.setHours(hour, minute, 0, 0);
  if (at.getTime() <= Date.now()) {
    at.setDate(at.getDate() + 1);
  }
  return at;
}

let webReminderInterval = null;
const firedWebReminders = new Set();

function startWebReminderLoop() {
  if (webReminderInterval) return;

  const check = () => {
    if (!notificationsEnabled()) return;

    const now = new Date();
    const key = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

    REMINDERS.forEach((reminder) => {
      const fireKey = `${key}-${reminder.id}`;
      if (firedWebReminders.has(fireKey)) return;
      if (now.getHours() !== reminder.hour || now.getMinutes() !== 0) return;
      if (Notification.permission !== 'granted') return;

      new Notification(reminder.title, { body: reminder.body, icon: '/favicon.svg' });
      firedWebReminders.add(fireKey);
    });
  };

  check();
  webReminderInterval = setInterval(check, 60_000);
}

async function scheduleWebReminders() {
  await armServiceWorkerReminders(true);
  startWebReminderLoop();
}

export async function enableNotifications() {
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  if (isNative()) {
    await scheduleNativeReminders();
  } else {
    await scheduleWebReminders();
    if (Notification.permission === 'granted') {
      new Notification('Kasugai Crow', {
        body: 'CAW! Reminders armed for morning bounties and evening streak checks.',
        icon: '/favicon.svg',
      });
    }
  }

  return true;
}

export async function disableNotifications() {
  localStorage.setItem(PERMISSION_KEY, 'false');

  if (isNative()) {
    await LocalNotifications.cancel({ notifications: REMINDERS.map((r) => ({ id: r.id })) });
  } else {
    await armServiceWorkerReminders(false);
  }

  if (webReminderInterval) {
    clearInterval(webReminderInterval);
    webReminderInterval = null;
  }

  firedWebReminders.clear();
}

export function initializeNotifications() {
  registerReminderSyncOnLoad();

  if (notificationsEnabled()) {
    if (isNative()) {
      scheduleNativeReminders().catch(() => {});
    } else {
      scheduleWebReminders().catch(() => {});
    }
  }
}
