import { useEffect } from "react";
import { BackHandler } from "react-native";

/**
 * gorhom sheets don't capture the Android back, which would reach the live app's webview behind
 * the sheet. The press is consumed even without `onBack`, so a locked sheet ignores it.
 */
export function useAndroidBack(isActive: boolean, onBack: (() => void) | undefined) {
  useEffect(() => {
    if (!isActive) return;

    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      onBack?.();
      return true;
    });

    return () => subscription.remove();
  }, [isActive, onBack]);
}
