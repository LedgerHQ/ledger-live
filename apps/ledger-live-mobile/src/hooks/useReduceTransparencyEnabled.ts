import { useCallback, useEffect, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { ReduceTransparencyModule } from "~/native-modules/ReduceTransparencyModule";

const isIOS = Platform.OS === "ios";

/**
 * Returns whether the user has Reduce Transparency enabled (iOS), from our native module.
 * When true, avoid blur effects and use gradient so the top bar does not render blank.
 * On Android this always returns false. Uses UIAccessibility.isReduceTransparencyEnabled on iOS.
 */
export function useReduceTransparencyEnabled(): boolean {
  const [enabled, setEnabled] = useState(isIOS); // Android: false; iOS: true until we fetch

  const fetchValue = useCallback(async () => {
    if (!isIOS) return;
    // When module is missing (e.g. not linked), assume reduce transparency on so we use gradient.
    if (ReduceTransparencyModule == null) {
      setEnabled(true);
      return;
    }
    try {
      const value: unknown = await ReduceTransparencyModule.getReduceTransparencyEnabled();
      // Bridge may pass boolean or number (0/1); treat as enabled when true or 1.
      setEnabled(value === true || value === 1);
    } catch {
      setEnabled(true);
    }
  }, []);

  useEffect(() => {
    if (!isIOS) return;

    fetchValue();

    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active") {
        fetchValue();
      }
    });

    return () => subscription.remove();
  }, [fetchValue]);

  return enabled;
}
