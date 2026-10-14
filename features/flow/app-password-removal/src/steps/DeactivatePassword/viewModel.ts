import { useCallback, useRef, useState } from "react";
import type { DeactivatePasswordViewModel, UseDeactivatePasswordViewModelOptions } from "./types";

export function useDeactivatePasswordViewModel({
  onDeactivate,
}: UseDeactivatePasswordViewModelOptions): DeactivatePasswordViewModel {
  const [password, setPassword] = useState("");
  const [hasWrongPassword, setHasWrongPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Guards the submit itself, not just the CTA: the field keeps its return key while submitting.
  const isSubmittingRef = useRef(false);

  const onPasswordChange = useCallback((next: string) => {
    setPassword(next);
    setHasWrongPassword(false);
  }, []);

  const onConfirm = useCallback(async () => {
    if (password.length === 0 || isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const outcome = await onDeactivate(password);

      if (outcome === "wrongPassword") {
        setHasWrongPassword(true);
        setPassword("");
      }
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }, [onDeactivate, password]);

  return {
    password,
    isConfirmEnabled: password.length > 0 && !isSubmitting,
    hasWrongPassword,
    isSubmitting,
    onPasswordChange,
    onConfirm,
  };
}
