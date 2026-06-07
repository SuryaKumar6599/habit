// src/lib/worldState.js
// Client-side world state + demon computation — no extra DB calls

const DEMON_NAMES = [
  'Gyutaro','Daki','Nakime','Hantengu','Gyokko',
  'Doma','Akaza','Kokushibo','Muzan','Kaigaku',
  'Rui','Enmu','Susamaru','Yahaba',
];

const hashName = (str) => {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return h % DEMON_NAMES.length;
};

/**
 * Computes which habits have spawned demons (3+ consecutive missed days).
 * Input:
 *   techniques — array of breathing_technique rows
 *   allLogs    — array of slayer_log rows (last 30 days)
 * Output:
 *   array of demon objects
 */
export const computeActiveDemons = (techniques, allLogs) => {
  const demons = [];

  techniques.forEach((t) => {
    let missedStreak = 0;
    // Walk backwards from yesterday (today is still in progress)
    for (let i = 1; i <= 21; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const done = allLogs.some(
        (l) => l.technique_id === t.id && l.executed_at === dateStr
      );
      if (!done) missedStreak++;
      else break;
    }

    if (missedStreak >= 3) {
      demons.push({
        techniqueId: t.id,
        techniqueName: t.form_name,
        name: DEMON_NAMES[hashName(t.form_name)],
        missedDays: missedStreak,
        tier: missedStreak >= 14 ? 'Upper Moon'
            : missedStreak >= 7  ? 'Lower Moon Senior'
            : 'Lower Moon',
        isBoss: missedStreak >= 21,
        corruption: Math.min((missedStreak - 2) * 10, 100),
      });
    }
  });

  return demons;
};

/**
 * Derives village world state from profile + demons.
 */
export const getWorldState = (profile, activeDemons) => {
  const sword = profile?.sword_durability ?? 100;
  const demonCount = activeDemons.length;

  if (demonCount === 0 && sword >= 80)  return 'thriving';
  if (demonCount <= 1 && sword >= 50)   return 'stable';
  if (demonCount <= 2 && sword >= 30)   return 'tense';
  if (demonCount <= 4)                   return 'threatened';
  return 'corrupted';
};

/**
 * Applies the user's breathing element as CSS variables on :root.
 */
const ELEMENT_THEMES = {
  Water:   { primary: '#3b82f6', glow: '#60a5fa' },
  Flame:   { primary: '#f97316', glow: '#fb923c' },
  Thunder: { primary: '#eab308', glow: '#facc15' },
  Mist:    { primary: '#06b6d4', glow: '#22d3ee' },
  Wind:    { primary: '#22c55e', glow: '#4ade80' },
  Love:    { primary: '#ec4899', glow: '#f472b6' },
  Stone:   { primary: '#78716c', glow: '#a8a29e' },
  Serpent: { primary: '#6366f1', glow: '#818cf8' },
  Insect:  { primary: '#8b5cf6', glow: '#a78bfa' },
  Moon:    { primary: '#3b5998', glow: '#5b7bc2' },
  Sun:     { primary: '#fbbf24', glow: '#fcd34d' },
};

export const applyElementTheme = (element) => {
  const t = ELEMENT_THEMES[element] ?? ELEMENT_THEMES.Water;
  const root = document.documentElement;
  root.style.setProperty('--user-primary', t.primary);
  root.style.setProperty('--user-glow', t.glow);
};
