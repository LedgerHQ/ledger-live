import { useCallback, useState } from "react";
import type { UnlockViewModel, UseUnlockViewModelOptions } from "./types";

export function useUnlockViewModel({
  onVerify,
  canRetryBiometrics,
  onRetryBiometrics,
  onForgotPassword,
}: UseUnlockViewModelOptions): UnlockViewModel {
  const [password, setPassword] = useState("");
  const [hasWrongPassword, setHasWrongPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const onPasswordChange = useCallback((next: string) => {
    setPassword(next);
    setHasWrongPassword(false);
  }, []);

  const onUnlock = useCallback(async () => {
    if (password.length === 0) {
      return;
    }

    setIsVerifying(true);

    try {
      if ((await onVerify(password)) === "incorrect") {
        setHasWrongPassword(true);
        setPassword("");
      }
    } finally {
      setIsVerifying(false);
    }
  }, [onVerify, password]);

  return {
    password,
    isUnlockEnabled: password.length > 0 && !isVerifying,
    hasWrongPassword,
    isVerifying,
    canRetryBiometrics,
    onPasswordChange,
    onUnlock,
    onRetryBiometrics,
    onForgotPassword,
  };
}
