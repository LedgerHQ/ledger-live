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

  // The state lifecycle differs between iOS and Android. This is to prevent FaceId from triggering an inactive state and looping.
  const isBackgrounded = (state: string) => {
    const isAppInBackground =
      Platform.OS === "ios" ? state === "background" : state.match(/inactive|background/);
    return isAppInBackground;
  };

  // If the app reopened from the background, lock the app
  const handleAppStateChange = useCallback(
    (nextAppState: string) => {
      // do not lock if triggered by a deep link flow
      if (isBackgrounded(appState) && nextAppState === "active" && !isPasswordLockBlocked) {
        lock();
      }
      setAppState(nextAppState);
    },
    [appState, isPasswordLockBlocked, lock],
  );

  return { handleAppStateChange };
}

interface UseAuthStateProps {
  privacy: Privacy | null | undefined;
  closeAllDrawers: () => void;
}

// as we needs to be resilient to reboots (not showing unlock again after a reboot)
// we need to store this global variable to know if we need to isLocked initially
let wasUnlocked = false;

export function useAuthState({ privacy, closeAllDrawers }: UseAuthStateProps) {
  const mounted = useRef<boolean>(false);

  const [isLocked, setIsLocked] = useState<boolean>(!!privacy?.hasPassword && !wasUnlocked);
  const [biometricsError, setBiometricsError] = useState<Error | null | undefined>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [skipLockCount, setSkipLockCount] = useState<number>(0);

  // lock the app
  const lock = useCallback(() => {
    if (!privacy?.hasPassword || skipLockCount) return;
    wasUnlocked = false;
    closeAllDrawers();

    if (mounted.current) {
      setIsLocked(true);
      setBiometricsError(null);
    }
  }, [privacy, skipLockCount, closeAllDrawers]);

  // unlock the app
  const unlock = useCallback(() => {
    wasUnlocked = true;

    if (mounted.current) {
      setIsLocked(false);
      setBiometricsError(null);
    }
  }, []);

  return {
    isLocked,
    biometricsError,
    authModalOpen,
    mounted,
    setIsLocked,
    setBiometricsError,
    setAuthModalOpen,
    setSkipLockCount,
    lock,
    unlock,
  };
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
