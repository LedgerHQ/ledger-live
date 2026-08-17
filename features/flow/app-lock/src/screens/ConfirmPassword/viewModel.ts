import { useCallback, useState } from "react";
import { usePasswordDraft } from "../../state/passwordDraft";
import type { ConfirmPasswordViewModel, UseConfirmPasswordViewModelOptions } from "./types";

export function useConfirmPasswordViewModel({
  onConfirmed,
}: UseConfirmPasswordViewModelOptions): ConfirmPasswordViewModel {
  const draft = usePasswordDraft();
  const [password, setPassword] = useState("");
  const [hasMismatch, setHasMismatch] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const onPasswordChange = useCallback((next: string) => {
    setPassword(next);
    setHasMismatch(false);
  }, []);

  const onConfirm = useCallback(async () => {
    const chosen = draft.read();

    if (chosen === null || password !== chosen) {
      setHasMismatch(true);
      return;
    }

    setIsSaving(true);

    try {
      await onConfirmed(chosen);
    } finally {
      setIsSaving(false);
    }
  }, [draft, onConfirmed, password]);

  return {
    password,
    isConfirmEnabled: password.length > 0 && !isSaving,
    hasMismatch,
    isSaving,
    onPasswordChange,
    onConfirm,
  };
}
