import {
  Check,
  CloudFog,
  Droplets,
  Feather,
  Flame,
  Gem,
  Heart,
  Moon,
  Mountain,
  Snowflake,
  Sparkles,
  Swords,
  Waves,
  Wind,
  Zap,
} from 'lucide-react';
import { BREATHING_ELEMENTS } from '../stores/habitStore';

const TECHNIQUES = {
  Water: {
    title: 'Water Surface Slash',
    className: 'breathing-effect--water',
    Icon: Droplets,
    motifs: ['wave', 'wave', 'spray', 'orbit'],
  },
  Flame: {
    title: 'Rising Scorching Sun',
    className: 'breathing-effect--flame',
    Icon: Flame,
    motifs: ['fireRing', 'ember', 'ember', 'slash'],
  },
  Thunder: {
    title: 'Thunderclap And Flash',
    className: 'breathing-effect--thunder',
    Icon: Zap,
    motifs: ['bolt', 'bolt', 'fracture', 'speedline'],
  },
  Wind: {
    title: 'Dust Whirlwind Cutter',
    className: 'breathing-effect--wind',
    Icon: Wind,
    motifs: ['gale', 'gale', 'leaf', 'speedline'],
  },
  Stone: {
    title: 'Bedrock Resonance',
    className: 'breathing-effect--stone',
    Icon: Mountain,
    motifs: ['shockwave', 'boulder', 'boulder', 'fracture'],
  },
  Mist: {
    title: 'Obscuring Cloud Drift',
    className: 'breathing-effect--mist',
    Icon: CloudFog,
    motifs: ['fog', 'fog', 'ghostSlash', 'orbit'],
  },
  Frost: {
    title: 'Crystal Rime Bloom',
    className: 'breathing-effect--frost',
    Icon: Snowflake,
    motifs: ['crystal', 'crystal', 'snow', 'slash'],
  },
  Love: {
    title: 'Heartstring Bloom',
    className: 'breathing-effect--love',
    Icon: Heart,
    motifs: ['ribbon', 'petal', 'petal', 'orbit'],
  },
  Serpent: {
    title: 'Coiling Fang',
    className: 'breathing-effect--serpent',
    Icon: Waves,
    motifs: ['serpent', 'serpent', 'fang', 'slash'],
  },
  Insect: {
    title: 'Butterfly Venom Pierce',
    className: 'breathing-effect--insect',
    Icon: Sparkles,
    motifs: ['butterfly', 'butterfly', 'poison', 'needle'],
  },
  Prosperity: {
    title: 'Golden Fortune Current',
    className: 'breathing-effect--prosperity',
    Icon: Gem,
    motifs: ['coin', 'coin', 'leaf', 'radiance'],
  },
  Moon: {
    title: 'Crescent Moon Dance',
    className: 'breathing-effect--moon',
    Icon: Moon,
    motifs: ['crescent', 'crescent', 'ghostSlash', 'orbit'],
  },
  Sun: {
    title: 'Solar Halo Waltz',
    className: 'breathing-effect--sun',
    Icon: Flame,
    motifs: ['sunArc', 'fireRing', 'radiance', 'slash'],
  },
};

function FlyingCrow({ color }) {
  return (
    <div className="breathing-crow" style={{ '--effect-color': color }}>
      <Feather className="breathing-crow__feather breathing-crow__feather--one" />
      <Feather className="breathing-crow__feather breathing-crow__feather--two" />
      <svg viewBox="0 0 120 90" className="breathing-crow__body" aria-hidden="true">
        <path d="M16 48 C32 20, 50 18, 63 42 C78 19, 100 24, 113 48 C90 39, 77 44, 65 57 C50 44, 36 39, 16 48Z" fill="#070711" />
        <ellipse cx="60" cy="55" rx="22" ry="17" fill="#11111f" />
        <circle cx="71" cy="42" r="10" fill="#11111f" />
        <path d="M78 42 L94 38 L80 48Z" fill="var(--effect-color)" />
        <circle cx="73" cy="39" r="2" fill="#f8fafc" />
      </svg>
    </div>
  );
}

function Motif({ type, index }) {
  return <span className={`breathing-motif breathing-motif--${type} breathing-motif--${index}`} aria-hidden="true" />;
}

function ImpactMarks() {
  return (
    <div className="breathing-impact" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export default function BreathingEffect({ effect }) {
  if (!effect) return null;

  const element = BREATHING_ELEMENTS[effect.element] || BREATHING_ELEMENTS.Water;
  const technique = TECHNIQUES[effect.element] || TECHNIQUES.Water;
  const Icon = technique.Icon || Swords;

  return (
    <div
      className={`breathing-effect ${technique.className}`}
      style={{
        '--effect-color': element.color,
        '--effect-glow': `${element.color}66`,
        '--effect-soft': `${element.color}22`,
      }}
      aria-live="polite"
    >
      <div className="breathing-effect__flash" />
      <div className="breathing-effect__vignette" />
      <div className="breathing-effect__field">
        <ImpactMarks />
        <div className="breathing-effect__ring breathing-effect__ring--outer" />
        <div className="breathing-effect__ring breathing-effect__ring--inner" />
        <div className="breathing-effect__core-glow" />
        {technique.motifs.map((motif, index) => (
          <Motif key={`${motif}-${index}`} type={motif} index={index + 1} />
        ))}
        <div className="breathing-effect__slash breathing-effect__slash--one" />
        <div className="breathing-effect__slash breathing-effect__slash--two" />
        <div className="breathing-effect__slash breathing-effect__slash--three" />
        <FlyingCrow color={element.color} />

        <div className="breathing-effect__seal">
          <Icon className="breathing-effect__icon" />
          <div>
            <p className="breathing-effect__eyebrow">{effect.element} Breathing</p>
            <h2 className="breathing-effect__title">{technique.title}</h2>
            <p className="breathing-effect__caption">
              <Check className="w-4 h-4" />
              {effect.techniqueName}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
