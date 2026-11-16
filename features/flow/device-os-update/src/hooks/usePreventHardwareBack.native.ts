import { useEffect } from "react";
import { BackHandler } from "react-native";

/** Swallows the Android back button while `active`: the OS update cannot be left halfway. */
export function usePreventHardwareBack(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => true);
    return () => subscription.remove();
  }, [active]);
}
