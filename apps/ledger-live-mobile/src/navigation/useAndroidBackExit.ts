import { useEffect } from "react";
import { BackHandler, Platform } from "react-native";
import { navigationRef } from "../rootnavigation";

/**
 * If the user reaches the root screen
 * (nothing left in the RN stack) and spams the hardware back button, React Navigation
 * returns `false`, Android takes over, and the rapid activity lifecycle transitions
 * are reported as a crash. This hook intercepts that case and exits cleanly instead.
 */
export function useAndroidBackExit(isNavigationReady: boolean) {
  useEffect(() => {
    if (!isNavigationReady || Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (!navigationRef.current?.canGoBack()) {
        BackHandler.exitApp();
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isNavigationReady]);
}
