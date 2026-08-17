import { useCallback, useState } from "react";
import type { DeactivatePasswordViewModel, UseDeactivatePasswordViewModelOptions } from "./types";

export function useDeactivatePasswordViewModel({
  onDeactivate,
}: UseDeactivatePasswordViewModelOptions): DeactivatePasswordViewModel {
  const [password, setPassword] = useState("");
  const [hasWrongPassword, setHasWrongPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onPasswordChange = useCallback((next: string) => {
    setPassword(next);
    setHasWrongPassword(false);
  }, []);

  const onConfirm = useCallback(async () => {
    if (password.length === 0) {
      return;
    }

    setIsSubmitting(true);

    try {
      const outcome = await onDeactivate(password);

      if (outcome === "wrongPassword") {
        setHasWrongPassword(true);
        setPassword("");
      }
    } finally {
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
