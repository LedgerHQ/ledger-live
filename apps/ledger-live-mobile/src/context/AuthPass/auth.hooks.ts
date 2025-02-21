import { useCallback, useRef, useState } from "react";
import { AppState, Platform, Vibration } from "react-native";
import type { Privacy } from "~/reducers/types";
import * as Keychain from "react-native-keychain";
import { PasswordIncorrectError } from "@ledgerhq/errors";
import { VIBRATION_PATTERN_ERROR } from "~/utils/constants";

interface usePrivacyInitializationProps {
  privacy: Privacy | null | undefined;
  setPrivacy: (_: Privacy) => void;
}

export function usePrivacyInitialization({ privacy, setPrivacy }: usePrivacyInitializationProps) {
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

interface useAppStateHandlerProps {
  isPasswordLockBlocked: boolean;
  lock: () => void;
}

export function useAppStateHandler({ isPasswordLockBlocked, lock }: useAppStateHandlerProps) {
  const [appState, setAppState] = useState<string>(AppState.currentState || "");

  const isBackgrounded = (state: string) => {
    const isAppInBackground =
      Platform.OS === "ios" ? state === "background" : state.match(/inactive|background/);
    return isAppInBackground;
  };

  const handleAppStateChange = useCallback(
    (nextAppState: string) => {
      if (isBackgrounded(appState) && nextAppState === "active" && !isPasswordLockBlocked) {
        lock();
      }
      setAppState(nextAppState);
    },
    [appState, isPasswordLockBlocked, lock],
  );

  return { handleAppStateChange };
}

interface useAuthStateProps {
  privacy: Privacy | null | undefined;
  closeAllDrawers: () => void;
}

export function useAuthState({ privacy, closeAllDrawers }: useAuthStateProps) {
  const wasUnlocked = useRef<boolean>(false);
  const mounted = useRef<boolean>(false);

  const [isLocked, setIsLocked] = useState<boolean>(!!privacy?.hasPassword && !wasUnlocked.current);
  const [biometricsError, setBiometricsError] = useState<Error | null | undefined>(null);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [skipLockCount, setSkipLockCount] = useState<number>(0);

  const lock = useCallback(() => {
    if (!privacy?.hasPassword || skipLockCount) return;
    wasUnlocked.current = false;
    closeAllDrawers();

    if (mounted.current) {
      setIsLocked(true);
      setBiometricsError(null);
    }
  }, [privacy, skipLockCount, closeAllDrawers]);

  const unlock = useCallback(() => {
    wasUnlocked.current = true;

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
        console.error("no credentials stored");
      }
    } catch (err) {
      if (id !== submitId.current) return;
      console.error("could not load credentials");
      setPasswordError(err as Error);
      setPassword("");
    }
  }, [password, unlock, setPasswordError, setPassword]);

  return { submit };
};
