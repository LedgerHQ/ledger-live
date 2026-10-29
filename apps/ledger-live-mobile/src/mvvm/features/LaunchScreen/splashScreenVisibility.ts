import { useSyncExternalStore } from "react";
import * as SplashScreen from "expo-splash-screen";

let splashScreenHidden = false;
const listeners = new Set<() => void>();

/**
 * Hides the native splash screen and lets `useIsSplashScreenHidden` users know.
 */
export function hideSplashScreen() {
  SplashScreen.hide();
  if (splashScreenHidden) return;
  splashScreenHidden = true;
  listeners.forEach(listener => listener());
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
