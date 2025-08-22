import { useCallback, useRef, useState } from "react";
import { AppState, Platform, Vibration } from "react-native";
import type { Privacy } from "~/reducers/types";
import * as Keychain from "react-native-keychain";
import { PasswordIncorrectError } from "@ledgerhq/errors";
import { VIBRATION_PATTERN_ERROR } from "~/utils/constants";

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

interface UseAuthSubmitProps {
  password: string;
  unlock: () => void;
  setPasswordError: (error: Error | null) => void;
  setPassword: (password: string) => void;
}

export const useAuthSubmit = ({
  password,
  unlock,
  setPasswordError,
  setPassword,
}: UseAuthSubmitProps) => {
  const submitId = useRef(0);

  const submit = useCallback(async () => {
    const id = ++submitId.current;
    if (!password) return;

    try {
      const options =
        Platform.OS === "ios"
          ? {}
          : {
              accessControl: Keychain.ACCESS_CONTROL.APPLICATION_PASSWORD,
              rules: Keychain.SECURITY_RULES.NONE,
            };

      const credentials = await Keychain.getGenericPassword(options);
      if (id !== submitId.current) return;

      if (credentials && credentials.password === password) {
        unlock();
      } else if (credentials) {
        Vibration.vibrate(VIBRATION_PATTERN_ERROR);
        setPasswordError(new PasswordIncorrectError());
        setPassword("");
      } else {
        console.warn("no credentials stored");
      }
    } catch (err) {
      if (id !== submitId.current) return;
      console.warn("could not load credentials");
      setPasswordError(err as Error);
      setPassword("");
    }
  }, [password, unlock, setPasswordError, setPassword]);

  return { submit };
};
