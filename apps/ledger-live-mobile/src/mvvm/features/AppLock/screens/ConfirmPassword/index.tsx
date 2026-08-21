import { ConfirmPasswordView, type ConfirmPasswordLabels } from "@features/flow-app-lock";
import React, { useMemo } from "react";
import { useTranslation } from "~/context/Locale";
import { useKeyboardInset } from "../../hooks/useKeyboardInset";
import useConfirmPasswordScreenViewModel from "./useConfirmPasswordScreenViewModel";

export function ConfirmPasswordScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const keyboardInset = useKeyboardInset();
  const viewModel = useConfirmPasswordScreenViewModel();

  const labels = useMemo<ConfirmPasswordLabels>(
    () => ({
      fieldLabel: t("appLock.field.label"),
      revealPassword: t("appLock.field.reveal"),
      hidePassword: t("appLock.field.hide"),
      minLengthHelper: t("appLock.field.minLength"),
      mismatchError: t("appLock.confirmPassword.mismatch"),
      confirmLabel: t("appLock.confirmPassword.cta"),
    }),
    [t],
  );

  return <ConfirmPasswordView {...viewModel} labels={labels} keyboardHeight={keyboardInset} />;
}
