import {
  useConfirmPasswordViewModel,
  usePasswordDraft,
  type ConfirmPasswordViewModel,
} from "@features/flow-app-lock";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { useTranslation } from "~/context/Locale";
import { usePasswordSetup } from "../../hooks/usePasswordSetup";
import type { PasswordAddFlowNavigatorProps } from "../../types";

type ConfirmPasswordScreenViewModel = ConfirmPasswordViewModel & Readonly<{ errorText?: string }>;

function useConfirmPasswordScreenViewModel(): ConfirmPasswordScreenViewModel {
  const { t } = useTranslation();
  const navigation = useNavigation<PasswordAddFlowNavigatorProps["navigation"]>();
  const draft = usePasswordDraft();
  const { savePassword } = usePasswordSetup();
  const [errorText, setErrorText] = useState<string | undefined>(undefined);

  const onConfirmed = useCallback(
    async (password: string) => {
      setErrorText(undefined);

      try {
        await savePassword(password);
      } catch {
        setErrorText(t("appLock.confirmPassword.saveFailed"));
        return;
      }

      draft.clear();
      // The parent, not this stack: goBack() here would land on the enter-password step.
      navigation.getParent()?.goBack();
    },
    [draft, navigation, savePassword, t],
  );

  const { onPasswordChange, ...viewModel } = useConfirmPasswordViewModel({ onConfirmed });

  // A mismatch returns before onConfirmed, so typing is what clears a previous save failure.
  const onFieldChange = useCallback(
    (next: string) => {
      setErrorText(undefined);
      onPasswordChange(next);
    },
    [onPasswordChange],
  );

  return { ...viewModel, onPasswordChange: onFieldChange, errorText };
}

export default useConfirmPasswordScreenViewModel;
