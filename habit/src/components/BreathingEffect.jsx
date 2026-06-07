import { Check, Feather, Swords } from 'lucide-react';
import { BREATHING_ELEMENTS } from '../stores/habitStore';

const EFFECT_COPY = {
  Water: 'Flowing Cut',
  Flame: 'Blazing Form',
  Thunder: 'Thunderclap',
  Wind: 'Spiral Gale',
  Stone: 'Earth Breaker',
  Mist: 'Veiled Step',
  Love: 'Heart Bloom',
  Serpent: 'Coiling Fang',
  Insect: 'Venom Pierce',
  Moon: 'Crescent Dance',
  Sun: 'Sun Halo',
};

const ELEMENT_CLASS = {
  Water: 'breathing-effect--water',
  Flame: 'breathing-effect--flame',
  Thunder: 'breathing-effect--thunder',
  Wind: 'breathing-effect--wind',
  Stone: 'breathing-effect--stone',
  Mist: 'breathing-effect--mist',
  Love: 'breathing-effect--love',
  Serpent: 'breathing-effect--serpent',
  Insect: 'breathing-effect--insect',
  Moon: 'breathing-effect--moon',
  Sun: 'breathing-effect--sun',
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

export default function BreathingEffect({ effect }) {
  if (!effect) return null;

  const element = BREATHING_ELEMENTS[effect.element] || BREATHING_ELEMENTS.Water;
  const effectClass = ELEMENT_CLASS[effect.element] || ELEMENT_CLASS.Water;
  const label = EFFECT_COPY[effect.element] || 'Total Concentration';

  return (
    <div
      className={`breathing-effect ${effectClass}`}
      style={{
        '--effect-color': element.color,
        '--effect-glow': `${element.color}55`,
      }}
      aria-live="polite"
    >
      <div className="breathing-effect__field">
        <div className="breathing-effect__ring breathing-effect__ring--outer" />
        <div className="breathing-effect__ring breathing-effect__ring--inner" />
        <div className="breathing-effect__swirl breathing-effect__swirl--one" />
        <div className="breathing-effect__swirl breathing-effect__swirl--two" />
        <div className="breathing-effect__swirl breathing-effect__swirl--three" />
        <div className="breathing-effect__slash breathing-effect__slash--one" />
        <div className="breathing-effect__slash breathing-effect__slash--two" />
        <div className="breathing-effect__slash breathing-effect__slash--three" />
        <FlyingCrow color={element.color} />

        <div className="breathing-effect__seal">
          <Swords className="breathing-effect__icon" />
          <div>
            <p className="breathing-effect__eyebrow">{effect.element} Breathing</p>
            <h2 className="breathing-effect__title">{label}</h2>
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
