import { useCallback, useRef, useState } from "react";
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
  // Guards the submit itself, not just the CTA: the field keeps its return key while verifying.
  const isVerifyingRef = useRef(false);
  const passwordRef = useRef("");

  const onPasswordChange = useCallback((next: string) => {
    passwordRef.current = next;
    setPassword(next);
    setHasWrongPassword(false);
  }, []);

  const onUnlock = useCallback(async () => {
    if (password.length === 0 || isVerifyingRef.current) {
      return;
    }

    isVerifyingRef.current = true;
    setIsVerifying(true);

    const submitted = password;

    try {
      // A stale refusal would blame the user for a value they never submitted.
      if ((await onVerify(submitted)) === "incorrect" && passwordRef.current === submitted) {
        setHasWrongPassword(true);
        passwordRef.current = "";
        setPassword("");
      }
    } finally {
      isVerifyingRef.current = false;
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
