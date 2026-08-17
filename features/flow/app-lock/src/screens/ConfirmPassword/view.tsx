import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import React from "react";
import { PasswordField } from "../../components/PasswordField";
import type { ConfirmPasswordViewProps } from "./types";

export function ConfirmPasswordView({
  password,
  isConfirmEnabled,
  hasMismatch,
  isSaving,
  onPasswordChange,
  onConfirm,
  hasSaveFailed = false,
  keyboardHeight = 0,
}: ConfirmPasswordViewProps): React.JSX.Element {
  const { t } = useTranslation();

  let helperText = t("appLock.field.minLength");
  if (hasSaveFailed) {
    helperText = t("appLock.confirmPassword.saveFailed");
  } else if (hasMismatch) {
    helperText = t("appLock.confirmPassword.mismatch");
  }

  return (
    <Box
      lx={{ flex: 1, paddingHorizontal: "s16", gap: "s24" }}
      style={{ paddingBottom: keyboardHeight + 16 }}
    >
      <PasswordField
        value={password}
        onChangeText={onPasswordChange}
        helperText={helperText}
        hasError={hasMismatch || hasSaveFailed}
        autoFocus
        onSubmitEditing={onConfirm}
        testID="app-lock-confirm-password-field"
      />
      <Box lx={{ flex: 1 }} />
      <Button
        appearance="base"
        disabled={!isConfirmEnabled}
        loading={isSaving}
        onPress={onConfirm}
        testID="app-lock-confirm-password-confirm"
      >
        {t("appLock.confirmPassword.cta")}
      </Button>
    </Box>
  );
}
