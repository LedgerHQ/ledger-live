import {
  DeactivatePasswordView,
  useDeactivatePasswordViewModel,
  type DeactivatePasswordLabels,
  type DeactivatePasswordOutcome,
} from "@features/flow-app-lock";
import { useNavigation } from "@react-navigation/native";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "~/context/Locale";
import { usePasswordDeactivation } from "../../hooks/usePasswordDeactivation";
import type { PasswordModifyFlowNavigatorProps } from "../../types";

export function DeactivatePasswordScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const navigation = useNavigation<PasswordModifyFlowNavigatorProps["navigation"]>();
  const { deactivatePassword } = usePasswordDeactivation();
  const [failure, setFailure] = useState<string | undefined>(undefined);

  const labels = useMemo<DeactivatePasswordLabels>(
    () => ({
      fieldLabel: t("appLock.field.label"),
      revealPassword: t("appLock.field.reveal"),
      hidePassword: t("appLock.field.hide"),
      wrongPasswordError: t("appLock.deactivatePassword.wrongPassword"),
      confirmLabel: t("appLock.deactivatePassword.cta"),
    }),
    [t],
  );

  const onDeactivate = useCallback(
    async (password: string): Promise<DeactivatePasswordOutcome> => {
      setFailure(undefined);

      try {
        if (!(await deactivatePassword(password))) {
          return "wrongPassword";
        }
      } catch {
        setFailure(t("appLock.deactivatePassword.failed"));
        return "failed";
      }

      navigation.getParent()?.goBack();
      return "deactivated";
    },
    [deactivatePassword, navigation, t],
  );

  const viewModel = useDeactivatePasswordViewModel({ onDeactivate });

  return <DeactivatePasswordView {...viewModel} labels={labels} errorText={failure} />;
}
