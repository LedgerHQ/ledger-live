import {
  useUnlockViewModel,
  type UnlockOutcome,
  type UnlockViewModel,
} from "@features/flow-app-lock";
import { checkPassword, selectBiometricsEnabled, unlockApp } from "@features/platform-app-lock";
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { useBiometricUnlock } from "../../hooks/useBiometricUnlock";
import { useIsAppActive } from "../../hooks/useIsAppActive";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";

type UnlockScreenViewModel = UnlockViewModel &
  Readonly<{
    hasFailed: boolean;
    isAppActive: boolean;
    keyboardHeight: number;
  }>;

function useUnlockScreenViewModel(): UnlockScreenViewModel {
  const dispatch = useDispatch();
  const biometricsEnabled = useSelector(selectBiometricsEnabled);
  const { runBiometricUnlock } = useBiometricUnlock();
  const isAppActive = useIsAppActive();
  const keyboardHeight = useKeyboardInset();
  const [hasFailed, setHasFailed] = useState(false);

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
      onRetryBiometrics: runBiometricUnlock,
    }),
    hasFailed,
    isAppActive,
    keyboardHeight,
  };
}

export default useUnlockScreenViewModel;
