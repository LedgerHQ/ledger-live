import { useCallback, useEffect, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import Config from "react-native-config";
import { ReduceTransparencyModule } from "~/native-modules/ReduceTransparencyModule";

const isIOS = Platform.OS === "ios";

/**
 * Returns whether the user has Reduce Transparency enabled (iOS), from our native module.
 * When true, avoid blur effects and use gradient so the top bar does not render blank.
 * On Android this always returns false. Uses UIAccessibility.isReduceTransparencyEnabled on iOS.
 *
 * In Detox E2E test builds (DETOX=1 in .env.mock), always returns true to prevent
 * ProgressiveBlurView from rendering — the blur animation conflicts with DetoxSync and
 * causes an NSInvalidArgumentException crash (-[NSNull __detox_sync_untrackAnimation]).
 */
export function useReduceTransparencyEnabled(): boolean {
  const [enabled, setEnabled] = useState(isIOS); // Android: false; iOS: true until we fetch

  const fetchValue = useCallback(async () => {
    if (!isIOS) return;
    // In Detox E2E builds, keep blur permanently disabled to avoid DetoxSync animation crashes.
    if (Config.DETOX) return;
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
