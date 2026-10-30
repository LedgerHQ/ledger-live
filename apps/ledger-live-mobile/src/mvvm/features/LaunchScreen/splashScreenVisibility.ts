import { useSyncExternalStore } from "react";
import * as SplashScreen from "expo-splash-screen";

// The splash screen's fade-out, set in index.js.
export const SPLASH_SCREEN_FADE_MS = 250;
// The fade starts on the frame after `SplashScreen.hide()`.
const FADE_START_MARGIN_MS = 100;

let hideRequested = false;
let splashScreenHidden = false;
const listeners = new Set<() => void>();

/**
 * Hides the native splash screen and lets `useIsSplashScreenHidden` users know once it has faded
 * out: `SplashScreen.hide()` only starts the fade and nothing reports its end.
 */
export function hideSplashScreen() {
  SplashScreen.hide();
  if (hideRequested) return;
  hideRequested = true;
  setTimeout(() => {
    splashScreenHidden = true;
    listeners.forEach(listener => listener());
  }, SPLASH_SCREEN_FADE_MS + FADE_START_MARGIN_MS);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useIsSplashScreenHidden() {
  return useSyncExternalStore(subscribe, () => splashScreenHidden);
}
