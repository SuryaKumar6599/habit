// src/lib/greetings.js
// Dynamic greeting generator — driven by time of day + streak count

const MORNING = [
  { streak: 0,   lines: [
    "Dawn breaks. Demons do not sleep.",
    "The sun rises. Your sword rests. Begin.",
    "Another day. Another chance to become stronger.",
  ]},
  { streak: 7,   lines: [
    "Seven dawns of discipline. The Hashira have noticed.",
    "A week of blood and will. Keep going, Slayer.",
    "Seven days. Your sword remembers.",
  ]},
  { streak: 14,  lines: [
    "Fourteen mornings. The crow is proud.",
    "Two weeks without retreat. Remarkable.",
    "Your consistency is becoming your weapon.",
  ]},
  { streak: 30,  lines: [
    "Thirty sunrises. You are no longer a recruit.",
    "A month of discipline. The demons fear this.",
    "The Corps has noticed your dedication.",
  ]},
  { streak: 100, lines: [
    "One hundred dawns. You have become the storm.",
    "The Hashira speak your name now.",
    "Legends are forged in mornings exactly like this.",
  ]},
];

const AFTERNOON = [
  { streak: 0,   lines: [
    "The midday sun exposes the idle.",
    "Afternoon already. Have you trained?",
    "The demons grow stronger while you wait.",
  ]},
  { streak: 7,   lines: [
    "Seven days strong. Keep the afternoon productive.",
    "The sun is high. So is your streak.",
  ]},
  { streak: 30,  lines: [
    "Thirty days. Even your afternoons are disciplined now.",
    "A month in. The village grows safer with each session.",
  ]},
];

const EVENING = [
  { streak: 0,   lines: [
    "The night belongs to demons. Do not let them in.",
    "Dusk. The scroll is still unsealed.",
    "Evening arrives. Your habits await.",
  ]},
  { streak: 7,   lines: [
    "Seven evenings. The crow rests easier because of you.",
    "The day ends soon. You have not failed it yet.",
  ]},
  { streak: 30,  lines: [
    "Thirty evenings of discipline. Extraordinary.",
    "The village is calm tonight. Because of your training.",
  ]},
];

const getBucket = (pool, streak) => {
  // Find the highest threshold the streak meets
  const sorted = [...pool].sort((a, b) => b.streak - a.streak);
  const bucket = sorted.find(b => streak >= b.streak) ?? pool[0];
  return bucket.lines[Math.floor(Math.random() * bucket.lines.length)];
};

export const getGreeting = (profile) => {
  const hour = new Date().getHours();
  const streak = profile?.current_streak ?? 0;

  if (hour >= 5 && hour < 12)  return getBucket(MORNING,   streak);
  if (hour >= 12 && hour < 18) return getBucket(AFTERNOON, streak);
  return getBucket(EVENING, streak);
};

export const getTimeOfDay = () => {
  const h = new Date().getHours();
  if (h >= 5  && h < 8)  return 'dawn';
  if (h >= 8  && h < 17) return 'day';
  if (h >= 17 && h < 20) return 'dusk';
  return 'night';
};
