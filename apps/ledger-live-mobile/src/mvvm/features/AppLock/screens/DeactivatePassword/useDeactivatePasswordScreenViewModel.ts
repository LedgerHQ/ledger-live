import {
  useDeactivatePasswordViewModel,
  type DeactivatePasswordOutcome,
  type DeactivatePasswordViewModel,
} from "@features/flow-app-lock";
import { useNavigation } from "@react-navigation/native";
import { useCallback, useState } from "react";
import { usePasswordDeactivation } from "../../hooks/usePasswordDeactivation";
import type { PasswordModifyFlowNavigatorProps } from "../../types";

type DeactivatePasswordScreenViewModel = DeactivatePasswordViewModel &
  Readonly<{ hasFailed: boolean }>;

function useDeactivatePasswordScreenViewModel(): DeactivatePasswordScreenViewModel {
  const navigation = useNavigation<PasswordModifyFlowNavigatorProps["navigation"]>();
  const { deactivatePassword } = usePasswordDeactivation();
  const [hasFailed, setHasFailed] = useState(false);

  const onDeactivate = useCallback(
    async (password: string): Promise<DeactivatePasswordOutcome> => {
      setHasFailed(false);

      try {
        if (!(await deactivatePassword(password))) {
          return "wrongPassword";
        }
      } catch {
        setHasFailed(true);
        return "failed";
      }

      // The parent, not this stack: goBack() here would land on the same step.
      navigation.getParent()?.goBack();
      return "deactivated";
    },
    [deactivatePassword, navigation],
  );

  const { onPasswordChange, ...viewModel } = useDeactivatePasswordViewModel({ onDeactivate });

  // A wrong password returns before onDeactivate, so typing is what clears a previous failure.
  const onFieldChange = useCallback(
    (next: string) => {
      setHasFailed(false);
      onPasswordChange(next);
    },
    [onPasswordChange],
  );

  return { ...viewModel, onPasswordChange: onFieldChange, hasFailed };
}

export default useDeactivatePasswordScreenViewModel;
