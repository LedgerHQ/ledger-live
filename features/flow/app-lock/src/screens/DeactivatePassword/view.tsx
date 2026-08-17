import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { PasswordField } from "../../components/PasswordField";
import type { DeactivatePasswordViewProps } from "./types";

export function DeactivatePasswordView({
  password,
  isConfirmEnabled,
  hasWrongPassword,
  onPasswordChange,
  onConfirm,
  labels,
  errorText,
}: DeactivatePasswordViewProps): React.JSX.Element {
  const helperText = errorText ?? (hasWrongPassword ? labels.wrongPasswordError : undefined);

  return (
    <Box lx={{ flex: 1, paddingHorizontal: "s16", gap: "s24" }}>
      <PasswordField
        value={password}
        onChangeText={onPasswordChange}
        labels={labels}
        helperText={helperText}
        hasError={hasWrongPassword || errorText !== undefined}
        onSubmitEditing={onConfirm}
        testID="app-lock-deactivate-password-field"
      />
      <Button
        appearance="base"
        disabled={!isConfirmEnabled}
        onPress={onConfirm}
        testID="app-lock-deactivate-password-confirm"
      >
        {labels.confirmLabel}
      </Button>
    </Box>
  );
}
