import {
  useConfirmPasswordViewModel,
  usePasswordDraft,
  type ConfirmPasswordViewModel,
} from "@features/flow-app-lock";
import { useNavigation } from "@react-navigation/native";
import { useCallback } from "react";
import type { PasswordAddFlowNavigatorProps } from "../../types";

function useConfirmPasswordScreenViewModel(): ConfirmPasswordViewModel {
  const navigation = useNavigation<PasswordAddFlowNavigatorProps["navigation"]>();
  const draft = usePasswordDraft();

  const onConfirmed = useCallback(() => {
    draft.clear();
    // The parent, not this stack: goBack() here would land on the enter-password step.
    navigation.getParent()?.goBack();
  }, [draft, navigation]);

  return useConfirmPasswordViewModel({ onConfirmed });
}

export default useConfirmPasswordScreenViewModel;
