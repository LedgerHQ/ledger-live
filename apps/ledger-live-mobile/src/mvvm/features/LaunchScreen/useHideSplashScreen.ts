import { useEffect } from "react";
import { hideSplashScreen } from "./splashScreenVisibility";

/**
 * Hides the native splash screen for a screen that replaces the app, such as a blocked screen.
 * `SplashScreenHandle` lives inside the app and only hides it once navigation is ready.
 */
export function useHideSplashScreen(shouldHide: boolean) {
  useEffect(() => {
    if (shouldHide) hideSplashScreen();
  }, [shouldHide]);
}
