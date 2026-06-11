import { useEffect, useState, useRef } from 'react';
import { Heart, Mail, X, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../stores/authStore';
import useHabitStore from '../stores/habitStore';
import useGrowthStore from '../stores/growthStore';
import useCrowStore from '../stores/crowStore';
import { generateCrowMessage } from '../lib/ollamaClient';

// Lines keyed by relationship tier
const LINES = {
  devoted: [
    "Master! I flew ten miles to tell you the cherry blossoms bloomed!",
    "CAW! Every habit you complete makes my wings stronger!",
    "I would follow you into the Infinity Castle itself, Master.",
    "The Hashira speak your name. I told them everything.",
  ],
  happy: [
    "CAW! New bounties await! Do your best!",
    "Another demon falls! The village rests easier tonight.",
    "Your sword glows brighter with every form you execute.",
    "CAW! I brought you a scroll. It is very important. It says: train.",
  ],
  neutral: [
    "...the scroll remains unsealed.",
    "I have been waiting here. It is fine. I am fine.",
    "Training exists. Demons also exist. A coincidence? Unlikely.",
    "The village is quiet. Not in a good way.",
  ],
  sad: [
    "I perch here, waiting. The village grows quieter.",
    "...I miss when you trained every day.",
    "The forge is cold. I am cold. Everything is cold.",
    "Master... have you forgotten the way of the blade?",
  ],
  despairing: [
    "...",
    "I no longer caw. There is nothing to announce.",
  ],
};

// Growth-aware crow summons — injected based on live metrics
const getGrowthSummons = (growthData) => {
  const msgs = [];
  const { consistencyPercent, currentRank, nextRank, progressToNextRank, corruptionIndex, swordTier, daysTrained } = growthData;

  if (nextRank && progressToNextRank >= 80)
    msgs.push(`CAW! You are ${100 - progressToNextRank}% away from ${nextRank.rank}. Do not stop now!`);
  if (nextRank && progressToNextRank < 20)
    msgs.push(`The path to ${nextRank.rank} is long. But so was the path to where you stand now.`);
  if (corruptionIndex > 50)
    msgs.push(`CAW! Corruption spreading. ${corruptionIndex}% corruption detected. Train. Now. Please.`);
  if (corruptionIndex === 0)
    msgs.push(`The village is clean. Demons have not dared approach. ${currentRank.rank} is worthy.`);
  if (consistencyPercent >= 90)
    msgs.push(`Training Efficiency: ${consistencyPercent}%. The Hashira have been informed. They are impressed.`);
  if (consistencyPercent < 50 && daysTrained > 7)
    msgs.push(`Only ${consistencyPercent}% efficiency. I have seen worse. I have not forgotten those slayers either.`);
  if (swordTier === 'Elite Nichirin' || swordTier === 'Breathing Resonance')
    msgs.push(`Your blade resonates. I can feel the breathing from here. ${swordTier} achieved.`);
  if (daysTrained === 7)  msgs.push(`One week of training complete. The Corps has noticed your commitment.`);
  if (daysTrained === 30) msgs.push(`A full month of training. Many give up here. You have not. CAW.`);
  if (daysTrained === 90) msgs.push(`Three months. Your growth multiplier is ${growthData.growthMultiplier}×. Do you feel it?`);

  return msgs;
};

const INTERVENTION_LINES = [
  "You have been staring at me for ten minutes. I am a crow. I cannot complete your habits.",
  "CAW. CAW. CAAAW. That is the sound of time leaving.",
  "Master... the scroll is still sealed. Are you scrolling something else?",
  "I have counted seventeen sighs since you opened the app. Train instead.",
  "The demons grow stronger while you stare at me. Coincidence? I think not.",
];

const TIER_COLORS = {
  devoted:    { stroke: '#ffffff', glow: 'rgba(255,255,255,0.4)',  eye: '#ffffff', text: 'text-white',  border: 'border-white/60'  },
  happy:      { stroke: '#22c55e', glow: 'rgba(34,197,94,0.3)',   eye: '#22c55e', text: 'text-green-400',  border: 'border-green-500/40'  },
  neutral:    { stroke: '#5c5a6e', glow: 'rgba(92,90,110,0.2)',   eye: '#fff',    text: 'text-slate-400',  border: 'border-slate-600/40'  },
  sad:        { stroke: '#3b82f6', glow: 'rgba(59,130,246,0.2)',  eye: '#93c5fd', text: 'text-blue-400',   border: 'border-blue-600/30'   },
  despairing: { stroke: '#dc2626', glow: 'rgba(220,38,38,0.2)',   eye: '#fca5a5', text: 'text-red-500',    border: 'border-red-800/40'    },
};

function getTier(relationship) {
  if (relationship >= 80) return 'devoted';
  if (relationship >= 60) return 'happy';
  if (relationship >= 40) return 'neutral';
  if (relationship >= 20) return 'sad';
  return 'despairing';
}

function pickLine(tier, seenRef) {
  const pool = LINES[tier];
  const idx = seenRef.current % pool.length;
  seenRef.current += 1;
  return pool[idx];
}

// Full SVG crow with emotional states
function CrowSVG({ tier, isIntervening, showHeart }) {
  const tc = TIER_COLORS[tier] || TIER_COLORS.neutral;
  // Despairing crow turns its back
  const flip = tier === 'despairing' ? 'scaleX(-1)' : 'scaleX(1)';
  // Devoted crow gets a halo glow
  const halo = tier === 'devoted';

  const eyeColor = isIntervening ? '#f97316' : tc.eye;
  const bodyAnimation = tier === 'devoted' || tier === 'happy'
    ? 'animate-bounce'
    : tier === 'despairing'
    ? 'animate-pulse'
    : '';

  return (
    <div
      className={`relative flex-shrink-0 ${bodyAnimation}`}
      style={{ transform: flip, transition: 'transform 0.5s ease' }}
    >
      {halo && (
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `radial-gradient(circle, ${tc.glow} 0%, transparent 70%)`,
            transform: 'scale(1.8)',
            animation: 'pulse-glow 2s ease-in-out infinite',
          }}
        />
      )}
      {showHeart && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 animate-xp-pop pointer-events-none z-10">
          <Heart className="w-5 h-5 text-pink-400 fill-pink-400" />
        </div>
      )}

      <svg
        viewBox="0 0 120 120"
        width="72"
        height="72"
        style={{ filter: `drop-shadow(0 0 12px ${tc.glow})` }}
      >
        {/* Body */}
        <ellipse cx="60" cy="75" rx="30" ry="23" fill="#0d0818" />
        {/* Wings */}
        <path d="M30 68 Q12 54 18 36 Q34 56 50 63Z" fill="#0a0614" />
        <path d="M90 68 Q108 54 102 36 Q86 56 70 63Z" fill="#0a0614" />
        {/* Head */}
        <ellipse cx="60" cy="44" rx="20" ry="17" fill="#0d0818" />
        {/* Eyes — color shifts by tier */}
        <circle cx="53" cy="41" r="5" fill="#fff" />
        <circle cx="67" cy="41" r="5" fill="#fff" />
        <circle cx="54.2" cy="41" r="3.2" fill={eyeColor} />
        <circle cx="68.2" cy="41" r="3.2" fill={eyeColor} />
        <circle cx="54.8" cy="40.2" r="1" fill="#fff" />
        <circle cx="68.8" cy="40.2" r="1" fill="#fff" />
        {/* Beak */}
        <path d="M56 52 L60 59 L64 52Z" fill="#d4d4d8" />
        {/* Talons */}
        <line x1="48" y1="97" x2="42" y2="110" stroke="#0d0818" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="60" y1="98" x2="60" y2="112" stroke="#0d0818" strokeWidth="3.5" strokeLinecap="round" />
        <line x1="72" y1="97" x2="78" y2="110" stroke="#0d0818" strokeWidth="3.5" strokeLinecap="round" />
        {/* Devotion accent — glowing chest patch */}
        {tier === 'devoted' && (
          <ellipse cx="60" cy="78" rx="10" ry="8" fill={tc.stroke} opacity="0.15" />
        )}
      </svg>
    </div>
  );
}

const MESSAGE_TYPE_STYLES = {
  notice: 'text-text-secondary',
  warning: 'text-orange-400',
  milestone: 'text-amber-300',
  mission: 'text-green-400',
  demon: 'text-red-400',
};

export default function KasugaiCrow() {
  const { profile, user } = useAuthStore();
  const { todaysLogs, sessionOpenedAt, interventionFired, markInterventionFired } = useHabitStore();
  const { messages, fetchMessages, markAsRead, markAllRead, getUnreadCount } = useCrowStore();

  const relationship = profile?.crow_relationship ?? 50;
  const tier = getTier(relationship);
  const tc = TIER_COLORS[tier] || TIER_COLORS.neutral;
  const seenRef = useRef(0);
  const growthData = useGrowthStore();

  // Pick initial message — prefer growth summons when available
  const getInitialMessage = () => {
    const summons = getGrowthSummons(growthData);
    if (summons.length > 0) return summons[0];
    return pickLine(tier, { current: 0 });
  };

  const [message, setMessage] = useState(getInitialMessage);
  const [isIntervening, setIsIntervening] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const [ripple, setRipple] = useState(false);
  const [inboxOpen, setInboxOpen] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const unreadCount = getUnreadCount();

  useEffect(() => {
    if (user) fetchMessages(user.id);
  }, [user, fetchMessages]);

  useEffect(() => {
    seenRef.current = 0;
    const fetchAI = async () => {
      setIsThinking(true);
      const aiMsg = await generateCrowMessage(growthData, relationship);
      if (aiMsg) {
        setMessage(aiMsg);
      } else {
        setMessage(pickLine(tier, seenRef));
      }
      setIsThinking(false);
    };
    fetchAI();
  }, [tier]); // Re-fetch when tier changes

  // Procrastination detector
  useEffect(() => {
    if (!sessionOpenedAt || interventionFired) return;
    const msRemaining = 10 * 60 * 1000 - (Date.now() - sessionOpenedAt);
    if (msRemaining <= 0) return;

    const timer = setTimeout(() => {
      const currentLogs = useHabitStore.getState().todaysLogs;
      if (currentLogs.length === 0) {
        const line = INTERVENTION_LINES[Math.floor(Math.random() * INTERVENTION_LINES.length)];
        setMessage(line);
        setIsIntervening(true);
        markInterventionFired();
        setTimeout(() => setIsIntervening(false), 12000);
      }
    }, msRemaining);

    return () => clearTimeout(timer);
  }, [sessionOpenedAt, interventionFired, markInterventionFired]);

  // Heart + ripple pop on new habit complete — pick a growth summon if possible
  const prevLogsLen = useRef(todaysLogs.length);
  useEffect(() => {
    if (todaysLogs.length > prevLogsLen.current) {
      setShowHeart(true);
      setRipple(true);
      setTimeout(() => setShowHeart(false), 1200);
      setTimeout(() => setRipple(false), 700);
      
      const fetchNewMessage = async () => {
        setIsThinking(true);
        const aiMsg = await generateCrowMessage(growthData, relationship);
        if (aiMsg) {
          setMessage(aiMsg);
        } else {
          const summons = getGrowthSummons(growthData);
          const newMsg = summons.length > 0
            ? summons[Math.floor(Math.random() * summons.length)]
            : pickLine(tier, seenRef);
          setMessage(newMsg);
        }
        setIsThinking(false);
      };
      fetchNewMessage();
    }
    prevLogsLen.current = todaysLogs.length;
  }, [todaysLogs.length, tier, growthData, relationship]);

  const tierLabel = {
    devoted: 'Bond: Devoted',
    happy: 'Bond: Loyal',
    neutral: 'Bond: Neutral',
    sad: 'Bond: Distant',
    despairing: 'Bond: Broken',
  }[tier];

  return (
    <div
      className={`glass-card p-4 flex items-start gap-4 border ${tc.border} mb-4 relative overflow-hidden`}
      style={{ background: 'rgba(13,8,24,0.82)' }}
    >
      {/* Ambient glow background */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-1000"
        style={{
          background: `radial-gradient(circle at 20% 50%, ${tc.glow}, transparent 70%)`,
          opacity: 0.4,
        }}
      />

      {/* Ripple burst on completion */}
      {ripple && (
        <div
          className="absolute left-8 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full border-2 pointer-events-none"
          style={{
            borderColor: tc.stroke,
            animation: 'ripple-burst 0.6s ease-out forwards',
          }}
        />
      )}

      {/* SVG Crow */}
      <div className="relative z-10 flex-shrink-0">
        <CrowSVG tier={tier} isIntervening={isIntervening} showHeart={showHeart} />
      </div>

      {/* Text Content */}
      <div className="flex-1 min-w-0 relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-xs text-text-muted font-bold uppercase tracking-widest">Kasugai Crow</p>
          <button
            type="button"
            onClick={() => setInboxOpen((open) => !open)}
            className="ml-auto relative p-1.5 rounded-md hover:bg-white/10 transition-colors"
            aria-label="Open crow inbox"
            title="Crow scrolls"
          >
            <Mail className="w-4 h-4 text-text-secondary" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-crimson text-[9px] font-bold text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {/* Relationship meter */}
          <div className="flex items-center gap-1">
            <Heart className={`w-3 h-3 ${tc.text}`} />
            <div className="w-16 h-1.5 rounded-full bg-white/5 overflow-hidden border border-white/10">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${relationship}%`,
                  background: tc.stroke,
                  boxShadow: `0 0 6px ${tc.stroke}`,
                }}
              />
            </div>
            <span className="text-[10px] text-text-muted">{relationship}</span>
          </div>
        </div>

        <div className="relative min-h-[3rem]">
          <AnimatePresence mode="wait">
            {isThinking ? (
              <motion.p
                key="thinking"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className="text-sm italic font-serif text-text-muted absolute inset-0"
              >
                The crow is pondering...
              </motion.p>
            ) : (
              <motion.p
                key={message}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
                className={`text-sm italic font-serif ${
                  isIntervening ? 'text-white' : 'text-text-primary'
                } absolute inset-0 line-clamp-3`}
              >
                "{message}"
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <p className={`text-[10px] mt-1.5 font-bold uppercase tracking-wider ${tc.text}`}>
          {tierLabel}
        </p>

        {inboxOpen && (
          <div className="mt-3 border-t border-white/10 pt-3 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Crow Scrolls
              </p>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => user && markAllRead(user.id)}
                    className="p-1 rounded hover:bg-white/10 text-text-muted"
                    title="Mark all read"
                  >
                    <CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setInboxOpen(false)}
                  className="p-1 rounded hover:bg-white/10 text-text-muted"
                  aria-label="Close inbox"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {messages.length === 0 ? (
              <p className="text-xs text-text-muted italic">No scrolls yet. CAW!</p>
            ) : (
              <ul className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {messages.map((scroll) => (
                  <li key={scroll.id}>
                    <button
                      type="button"
                      onClick={() => markAsRead(scroll.id)}
                      className={`w-full text-left rounded-md px-3 py-2 border transition-colors ${
                        scroll.is_read
                          ? 'bg-white/3 border-white/5'
                          : 'bg-white/8 border-white/15 hover:bg-white/10'
                      }`}
                    >
                      <p className={`text-xs font-bold ${MESSAGE_TYPE_STYLES[scroll.type] || 'text-text-primary'}`}>
                        {!scroll.is_read && (
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-crimson mr-1.5 align-middle" />
                        )}
                        {scroll.title}
                      </p>
                      <p className="text-[11px] text-text-secondary mt-0.5 line-clamp-2">
                        {scroll.content}
                      </p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
