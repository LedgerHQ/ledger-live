import { useCallback, useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";
import { ReduceTransparencyModule } from "~/native-modules/ReduceTransparencyModule";

/**
 * Returns whether the user has Reduce Transparency enabled (iOS), from our native module.
 * When true, avoid blur effects and use gradient so the top bar does not render blank.
 * On Android this always returns false. Uses UIAccessibility.isReduceTransparencyEnabled on iOS.
 */
export function useReduceTransparencyEnabled(): boolean {
  const [enabled, setEnabled] = useState(true);
  const mountedRef = useRef(true);

  const fetchValue = useCallback(() => {
    if (Platform.OS !== "ios") {
      if (mountedRef.current) setEnabled(false);
      return;
    }
    // When module is missing (e.g. not linked), assume reduce transparency on so we use gradient.
    if (ReduceTransparencyModule == null) {
      if (mountedRef.current) setEnabled(true);
      return;
    }
    ReduceTransparencyModule.getReduceTransparencyEnabled()
      .then((value: unknown) => {
        if (mountedRef.current) {
          // Bridge may pass boolean or number (0/1); treat as enabled when true or 1.
          setEnabled(value === true || value === 1);
        }
      })
      .catch(() => {
        if (mountedRef.current) {
          setEnabled(true);
        }
      });
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    fetchValue();

    if (Platform.OS !== "ios") {
      return () => {
        mountedRef.current = false;
      };
    }

    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (nextState === "active" && mountedRef.current) {
        fetchValue();
      }
    });

    return () => {
      mountedRef.current = false;
      subscription.remove();
    };
  }, [fetchValue]);

  return enabled;
}
