import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { PasswordField } from "../../components/PasswordField";
import type { ConfirmPasswordViewProps } from "./types";

export function ConfirmPasswordView({
  password,
  isConfirmEnabled,
  hasMismatch,
  onPasswordChange,
  onConfirm,
  labels,
  keyboardHeight = 0,
}: ConfirmPasswordViewProps): React.JSX.Element {
  return (
    <Box
      lx={{ flex: 1, paddingHorizontal: "s16", gap: "s24" }}
      style={{ paddingBottom: keyboardHeight + 16 }}
    >
      <PasswordField
        value={password}
        onChangeText={onPasswordChange}
        labels={labels}
        helperText={hasMismatch ? labels.mismatchError : labels.minLengthHelper}
        hasError={hasMismatch}
        autoFocus
        onSubmitEditing={onConfirm}
        testID="app-lock-confirm-password-field"
      />
      <Box lx={{ flex: 1 }} />
      <Button
        appearance="base"
        disabled={!isConfirmEnabled}
        onPress={onConfirm}
        testID="app-lock-confirm-password-confirm"
      >
        {labels.confirmLabel}
      </Button>
    </Box>
  );
}
