import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
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
  labels,
  errorText,
  keyboardHeight = 0,
}: ConfirmPasswordViewProps): React.JSX.Element {
  const helperText = errorText ?? (hasMismatch ? labels.mismatchError : labels.minLengthHelper);

  return (
    <Box
      lx={{ flex: 1, paddingHorizontal: "s16", gap: "s24" }}
      style={{ paddingBottom: keyboardHeight + 16 }}
    >
      <PasswordField
        value={password}
        onChangeText={onPasswordChange}
        labels={labels}
        helperText={helperText}
        hasError={hasMismatch || errorText !== undefined}
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
        {labels.confirmLabel}
      </Button>
    </Box>
  );
}
