import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import React from "react";
import { PasswordField } from "../../components/PasswordField";
import type { DeactivatePasswordViewProps } from "./types";

export function DeactivatePasswordView({
  password,
  isConfirmEnabled,
  hasWrongPassword,
  isSubmitting,
  onPasswordChange,
  onConfirm,
  hasFailed = false,
  keyboardHeight = 0,
}: DeactivatePasswordViewProps): React.JSX.Element {
  const { t } = useTranslation();

  let helperText: string | undefined;
  if (hasFailed) {
    helperText = t("appLock.deactivatePassword.failed");
  } else if (hasWrongPassword) {
    helperText = t("appLock.deactivatePassword.wrongPassword");
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
        hasError={hasWrongPassword || hasFailed}
        autoFocus
        onSubmitEditing={onConfirm}
        testID="app-lock-deactivate-password-field"
      />
      <Box lx={{ flex: 1 }} />
      <Button
        appearance="base"
        disabled={!isConfirmEnabled}
        loading={isSubmitting}
        onPress={onConfirm}
        testID="app-lock-deactivate-password-confirm"
      >
        {t("appLock.deactivatePassword.cta")}
      </Button>
    </Box>
  );
}
