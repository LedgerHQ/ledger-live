import { SetupPasswordView, type SetupPasswordLabels } from "@features/flow-app-lock";
import React, { useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";
import useSetupPasswordScreenViewModel from "./useSetupPasswordScreenViewModel";

export function SetupPasswordScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const keyboardInset = useKeyboardInset();
  const viewModel = useSetupPasswordScreenViewModel();

  const labels = useMemo<SetupPasswordLabels>(
    () => ({
      fieldLabel: t("appLock.field.label"),
      revealPassword: t("appLock.field.reveal"),
      hidePassword: t("appLock.field.hide"),
      minLengthHelper: t("appLock.field.minLength"),
      continueLabel: t("appLock.setupPassword.cta"),
    }),
    [t],
  );

  return <SetupPasswordView {...viewModel} labels={labels} keyboardHeight={keyboardInset} />;
}
