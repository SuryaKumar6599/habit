import { useState } from 'react';
import useHabitStore, { BREATHING_ELEMENTS } from '../stores/habitStore';
import { useAuthStore } from '../stores/authStore';
import { X, Plus, Sparkles } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

export default function AddTechniqueModal({ isOpen, onClose }) {
  const [formName, setFormName] = useState('');
  const [description, setDescription] = useState('');
  const [breathingElement, setBreathingElement] = useState('Water');
  const [frequency, setFrequency] = useState('daily');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { addTechnique } = useHabitStore();
  const { user } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formName.trim() || !user) return;

    setErrorMsg('');
    setSubmitting(true);
    const result = await addTechnique(user.id, {
      formName: formName.trim(),
      description: description.trim(),
      breathingElement,
      frequency,
    });

    setSubmitting(false);
    if (!result.error) {
      setFormName('');
      setDescription('');
      setBreathingElement('Water');
      setFrequency('daily');
      onClose();
    } else {
      setErrorMsg(result.error);
    }
  };

  if (!isOpen) return null;

  const selectedElement = BREATHING_ELEMENTS[breathingElement];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      style={{ background: 'rgba(5,5,8,0.8)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="glass-card w-full max-w-lg p-6 md:p-8 animate-slide-up relative overflow-hidden"
      >
        {/* Background accent */}
        <div
          className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-10 pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${selectedElement.color}, transparent 70%)`,
            transition: 'all 0.5s ease',
          }}
        />

        {/* Header */}
        <div className="flex items-center justify-between mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: `${selectedElement.color}15`,
                border: `1px solid ${selectedElement.color}30`,
              }}
            >
              <Plus className="w-5 h-5" style={{ color: selectedElement.color }} />
            </div>
            <div>
              <h2 className="text-lg font-heading font-bold text-text-primary">New Breathing Form</h2>
              <p className="text-xs text-text-muted">Add a technique to your training regimen</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-text-muted hover:text-text-primary transition-all"
            id="close-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-semibold relative z-10">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          {/* Form Name */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Technique Name
            </label>
            <input
              type="text"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g., Morning Meditation, Sprint Training"
              className="input-field"
              required
              id="technique-name"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What does this technique involve?"
              rows={2}
              className="input-field resize-none"
              id="technique-description"
            />
          </div>

          {/* Breathing Element Selector */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2.5">
              Breathing Style
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
              {Object.entries(BREATHING_ELEMENTS).map(([key, element]) => {
                const IconComponent = LucideIcons[element.icon];
                const isSelected = breathingElement === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setBreathingElement(key)}
                    className="flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all"
                    style={{
                      background: isSelected ? `${element.color}20` : 'rgba(255,255,255,0.03)',
                      border: `1.5px solid ${isSelected ? `${element.color}60` : 'rgba(255,255,255,0.06)'}`,
                      boxShadow: isSelected ? `0 0 12px ${element.color}20` : 'none',
                    }}
                    id={`element-${key.toLowerCase()}`}
                  >
                    {IconComponent && (
                      <IconComponent
                        className="w-4.5 h-4.5"
                        style={{ color: isSelected ? element.color : '#5c5a6e' }}
                        strokeWidth={2}
                      />
                    )}
                    <span
                      className="text-[10px] font-semibold tracking-wide"
                      style={{ color: isSelected ? element.color : '#5c5a6e' }}
                    >
                      {key}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase tracking-widest mb-2">
              Training Frequency
            </label>
            <div className="flex gap-3">
              {['daily', 'weekly'].map((freq) => (
                <button
                  key={freq}
                  type="button"
                  onClick={() => setFrequency(freq)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-heading font-semibold capitalize transition-all"
                  style={{
                    background: frequency === freq ? 'rgba(220,38,38,0.15)' : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${frequency === freq ? 'rgba(220,38,38,0.4)' : 'rgba(255,255,255,0.06)'}`,
                    color: frequency === freq ? '#fca5a5' : '#5c5a6e',
                  }}
                  id={`freq-${freq}`}
                >
                  {freq}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !formName.trim()}
            className="btn-primary w-full flex items-center justify-center gap-2 text-sm mt-2 disabled:opacity-40 disabled:cursor-not-allowed"
            id="submit-technique"
          >
            {submitting ? (
              <div
                className="w-5 h-5 border-2 rounded-full border-white/30 border-t-white"
                style={{ animation: 'spin 0.8s linear infinite' }}
              />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Register Breathing Form
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
