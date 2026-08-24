import { isPasswordLongEnough } from "@features/platform-app-lock";
import { useCallback, useState } from "react";
import { usePasswordDraft } from "../../state/passwordDraft";
import type { SetupPasswordViewModel, UseSetupPasswordViewModelOptions } from "./types";

export function useSetupPasswordViewModel({
  onValid,
}: UseSetupPasswordViewModelOptions): SetupPasswordViewModel {
  const draft = usePasswordDraft();
  const [password, setPassword] = useState("");

  const isContinueEnabled = isPasswordLongEnough(password);

  const onContinue = useCallback(() => {
    if (!isPasswordLongEnough(password)) {
      return;
    }

    draft.write(password);
    onValid();
  }, [draft, onValid, password]);

  return {
    password,
    isContinueEnabled,
    onPasswordChange: setPassword,
    onContinue,
  };
}
