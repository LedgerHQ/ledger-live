import { useCallback, useState } from "react";
import { AppState, Platform } from "react-native";

import * as Keychain from "react-native-keychain";
import type { Privacy } from "~/reducers/types";

interface UsePrivacyInitializationProps {
  privacy: Privacy | null | undefined;
  setPrivacy: (_: Privacy) => void;
}

// If privacy has never been set, set to the correct values
export function usePrivacyInitialization({ privacy, setPrivacy }: UsePrivacyInitializationProps) {
  return useCallback(async () => {
    if (!privacy) {
      const biometricsType = await Keychain.getSupportedBiometryType();
      setPrivacy({
        hasPassword: false,
        biometricsType,
        biometricsEnabled: false,
      });
    }
  }, [privacy, setPrivacy]);
}

interface UseAppStateHandlerProps {
  isPasswordLockBlocked: boolean;
  lock: () => void;
}

export function useAppStateHandler({ isPasswordLockBlocked, lock }: UseAppStateHandlerProps) {
  const [appState, setAppState] = useState<string>(AppState.currentState || "");
  const timeRef = useRef<number>(0);

  // The state lifecycle differs between iOS and Android. This is to prevent FaceId from triggering an inactive state and looping.
  const isBackgrounded = (state: string) => {
    const isAppInBackground =
      Platform.OS === "ios" ? state === "background" : state.match(/inactive|background/);
    return isAppInBackground;
  };

  // If the app reopened from the background, lock the app
  const handleAppStateChange = useCallback(
    (nextAppState: string) => {
      const wasBackgrounded = isBackgrounded(appState);
      const isNowActive = nextAppState === "active";

      if (nextAppState === "background") {
        timeRef.current = Date.now();
      }

      if (Platform.OS === "android") {
        // Android: only lock non-transient state change (>500ms)
        // Reduces false-positive app locks, but does not eliminate them
        // Ticket to revisit state change management: https://ledgerhq.atlassian.net/browse/LIVE-20822
        if (
          wasBackgrounded &&
          isNowActive &&
          Date.now() - timeRef.current > 500 &&
          !isPasswordLockBlocked
        ) {
          lock();
        }
      } else {
        // iOS: use the original logic as it's more stable
        if (wasBackgrounded && isNowActive && !isPasswordLockBlocked) {
          lock();
        }
      }
      setAppState(nextAppState);
    },
    [appState, isPasswordLockBlocked, lock],
  );

  return { handleAppStateChange };
}
