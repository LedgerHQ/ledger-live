import { useRef, useEffect, useCallback } from "react";
import { AppState, AppStateStatus } from "react-native";
import { useQueuedDrawerContext } from "LLM/components/QueuedDrawer/QueuedDrawersContext";

/**
 * Automatically closes all open drawers when the app receives a deeplink
 * after returning from background, preventing UI conflicts during navigation.
 *
 * @returns A callback to invoke when a deeplink is received
 */
export function useDeeplinkDrawerCleanup() {
  const { closeAllDrawers } = useQueuedDrawerContext();
  const cameFromBackgroundRef = useRef(false);
  const previousAppStateRef = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextAppState: AppStateStatus) => {
      const wasActive = previousAppStateRef.current === "active";
      const isGoingToBackground = nextAppState.match(/inactive|background/);

      // Track when app transitions to background
      if (wasActive && isGoingToBackground) {
        cameFromBackgroundRef.current = true;
      }

      // Reset flag after app returns to foreground
      // Delay allows deeplink navigation to occur first
      if (nextAppState === "active" && cameFromBackgroundRef.current) {
        setTimeout(() => {
          cameFromBackgroundRef.current = false;
        }, 250);
      }

      previousAppStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const onDeeplinkReceived = useCallback(() => {
    if (cameFromBackgroundRef.current) {
      closeAllDrawers();
    }
  }, [closeAllDrawers]);

  return onDeeplinkReceived;
}
