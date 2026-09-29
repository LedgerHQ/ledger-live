import {
  useConfirmPasswordViewModel,
  usePasswordDraft,
  type ConfirmPasswordViewModel,
} from "@features/flow-app-lock";
import { useNavigation, useRoute } from "@react-navigation/native";
import { track } from "@shared/analytics";
import { useCallback, useState } from "react";
import { updateIdentify } from "~/analytics";
import { usePasswordSetup } from "../../hooks/usePasswordSetup";
import type { PasswordAddFlowNavigatorProps } from "../../types";

type ConfirmPasswordScreenViewModel = ConfirmPasswordViewModel &
  Readonly<{ hasSaveFailed: boolean }>;

function useConfirmPasswordScreenViewModel(): ConfirmPasswordScreenViewModel {
  const navigation = useNavigation<PasswordAddFlowNavigatorProps["navigation"]>();
  const { params } = useRoute<PasswordAddFlowNavigatorProps["route"]>();
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

      track("encryption_activated", { type: "password", source: params.source });
      updateIdentify();
      draft.clear();
      // The parent, not this stack: goBack() here would land on the enter-password step.
      navigation.getParent()?.goBack();
    },
    [draft, navigation, params.source, savePassword],
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
