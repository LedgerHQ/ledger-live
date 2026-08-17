import { useCallback, useState } from "react";
import { usePasswordDraft } from "../../state/passwordDraft";
import type { ConfirmPasswordViewModel, UseConfirmPasswordViewModelOptions } from "./types";

export function useConfirmPasswordViewModel({
  onConfirmed,
}: UseConfirmPasswordViewModelOptions): ConfirmPasswordViewModel {
  const draft = usePasswordDraft();
  const [password, setPassword] = useState("");
  const [hasMismatch, setHasMismatch] = useState(false);

  const onPasswordChange = useCallback((next: string) => {
    setPassword(next);
    setHasMismatch(false);
  }, []);

  const onConfirm = useCallback(() => {
    const chosen = draft.read();

    if (chosen === null || password !== chosen) {
      setHasMismatch(true);
      return;
    }

    onConfirmed(chosen);
  }, [draft, onConfirmed, password]);

  return {
    password,
    isConfirmEnabled: password.length > 0,
    hasMismatch,
    onPasswordChange,
    onConfirm,
  };
}
