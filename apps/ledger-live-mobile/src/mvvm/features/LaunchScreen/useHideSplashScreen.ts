import { useEffect } from "react";
import * as SplashScreen from "expo-splash-screen";

/**
 * Hides the native splash screen for a screen that replaces the app, such as a blocked screen.
 * `SplashScreenHandle` lives inside the app and only hides it once navigation is ready.
 */
export function useHideSplashScreen(shouldHide: boolean) {
  useEffect(() => {
    if (shouldHide) SplashScreen.hide();
  }, [shouldHide]);
}
