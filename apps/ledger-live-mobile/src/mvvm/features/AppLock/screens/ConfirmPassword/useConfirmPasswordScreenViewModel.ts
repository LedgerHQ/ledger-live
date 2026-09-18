import {
  useConfirmPasswordViewModel,
  usePasswordDraft,
  type ConfirmPasswordViewModel,
} from "@features/flow-app-lock";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { usePasswordSetup } from "../../hooks/usePasswordSetup";
import type { PasswordAddFlowNavigatorProps } from "../../types";

type ConfirmPasswordScreenViewModel = ConfirmPasswordViewModel &
  Readonly<{ hasSaveFailed: boolean }>;

function useConfirmPasswordScreenViewModel(): ConfirmPasswordScreenViewModel {
  const navigation = useNavigation<PasswordAddFlowNavigatorProps["navigation"]>();
  const draft = usePasswordDraft();
  const { savePassword } = usePasswordSetup();
  const [hasSaveFailed, setHasSaveFailed] = useState(false);

  const onConfirmed = useCallback(
    async (password: string) => {
      setHasSaveFailed(false);

      try {
        await savePassword(password);
      } catch {
        setHasSaveFailed(true);
        return;
      }

      draft.clear();
      // The parent, not this stack: goBack() here would land on the enter-password step.
      navigation.getParent()?.goBack();
    },
    [draft, navigation, savePassword],
  );

  const { onPasswordChange, ...viewModel } = useConfirmPasswordViewModel({ onConfirmed });

  // A mismatch returns before onConfirmed, so typing is what clears a previous save failure.
  const onFieldChange = useCallback(
    (next: string) => {
      setHasSaveFailed(false);
      onPasswordChange(next);
    },
    [onPasswordChange],
  );

  return { ...viewModel, onPasswordChange: onFieldChange, hasSaveFailed };
}

export default useConfirmPasswordScreenViewModel;
