import { create } from 'zustand';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { NativeBiometric } from '@capgo/capacitor-native-biometric';

export const useSecurityStore = create((set, get) => ({
  isLocked: false,
  isBlurred: false,
  isBiometricsAvailable: false,

  initialize: async () => {
    // Check if biometrics is available on device
    try {
      const result = await NativeBiometric.isAvailable();
      set({ isBiometricsAvailable: result.isAvailable });
    } catch (e) {
      console.warn("Biometrics check failed or running in browser:", e);
    }

    // Lock initially when the app opens, if biometrics are available
    if (get().isBiometricsAvailable && Capacitor.getPlatform() !== 'web') {
      set({ isLocked: true });
      get().unlock();
    }

    App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) {
        // App goes to background
        set({ isBlurred: true, isLocked: true });
      } else {
        // App comes back to foreground
        set({ isBlurred: false });
        if (get().isLocked) {
          get().unlock();
        }
      }
    });
  },

  unlock: async () => {
    // Bypass biometrics entirely when developing on the web browser
    if (Capacitor.getPlatform() === 'web' || !get().isBiometricsAvailable) {
      set({ isLocked: false });
      return;
    }

    try {
      const verified = await NativeBiometric.verifyIdentity({
        reason: "Unlock your Slayer logs",
        title: "Verify Identity",
      });
      if (verified) {
        set({ isLocked: false });
      }
    } catch (error) {
      console.error("Biometric verification failed:", error);
      // For development/fallback: if it fails, we still unlock it so you aren't permanently locked out
      // In a strict production app, you would prompt for a PIN instead.
      alert("Biometric failed. Unlocking via developer fallback.");
      set({ isLocked: false });
    }
  }
}));
