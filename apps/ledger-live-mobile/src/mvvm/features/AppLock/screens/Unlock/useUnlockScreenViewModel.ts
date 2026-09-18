import {
  useUnlockViewModel,
  type UnlockOutcome,
  type UnlockViewModel,
} from "@features/flow-app-lock";
import {
  checkPassword,
  selectBiometricsEnabled,
  selectHasPassword,
  unlockApp,
} from "@features/platform-app-lock";
import { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { useBiometricUnlock } from "../../hooks/useBiometricUnlock";
import { useIsAppActive } from "../../hooks/useIsAppActive";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";

type UnlockScreenViewModel = UnlockViewModel &
  Readonly<{
    hasFailed: boolean;
    hasPassword: boolean;
    isForgotPasswordOpen: boolean;
    onForgotPasswordClose: () => void;
    isAwaitingBiometrics: boolean;
    isAppActive: boolean;
    keyboardHeight: number;
  }>;

function useUnlockScreenViewModel(): UnlockScreenViewModel {
  const dispatch = useDispatch();
  const hasPassword = useSelector(selectHasPassword);
  const biometricsEnabled = useSelector(selectBiometricsEnabled);
  const { runBiometricUnlock } = useBiometricUnlock();
  const isAppActive = useIsAppActive();
  const keyboardHeight = useKeyboardInset();
  const [hasFailed, setHasFailed] = useState(false);
  const [isAwaitingBiometrics, setIsAwaitingBiometrics] = useState(biometricsEnabled);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const isPromptingRef = useRef(false);

  // Asked for before the screen draws a field: biometrics first, the password as the fallback.
  useEffect(() => {
    if (!isAwaitingBiometrics || !isAppActive || isPromptingRef.current) {
      return;
    }

    isPromptingRef.current = true;

    void runBiometricUnlock().then(unlocked => {
      isPromptingRef.current = false;

      if (!unlocked) {
        setIsAwaitingBiometrics(false);
      }
    });
  }, [isAppActive, isAwaitingBiometrics, runBiometricUnlock]);

  const onRetryBiometrics = useCallback(() => {
    setIsAwaitingBiometrics(true);
  }, []);

  const onForgotPassword = useCallback(() => {
    setIsForgotPasswordOpen(true);
  }, []);

  const onForgotPasswordClose = useCallback(() => {
    setIsForgotPasswordOpen(false);
  }, []);

  const onVerify = useCallback(
    async (password: string): Promise<UnlockOutcome> => {
      setHasFailed(false);

      try {
        // `notSet` means unreadable, and must not unlock the lock the hydration just imposed.
        if ((await checkPassword(password)).status !== "correct") {
          return "incorrect";
        }

        dispatch(unlockApp());
        return "unlocked";
      } catch {
        setHasFailed(true);
        return "failed";
      }
    },
    [dispatch],
  );

  return {
    ...useUnlockViewModel({
      onVerify,
      canRetryBiometrics: biometricsEnabled,
      onRetryBiometrics,
      onForgotPassword,
    }),
    hasFailed,
    hasPassword,
    isForgotPasswordOpen,
    onForgotPasswordClose,
    isAwaitingBiometrics,
    isAppActive,
    keyboardHeight,
  };
}

export default useUnlockScreenViewModel;
