import { Box, Button } from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { PasswordField } from "../../components/PasswordField";
import type { SetupPasswordViewProps } from "./types";

export function SetupPasswordView({
  password,
  isContinueEnabled,
  onPasswordChange,
  onContinue,
  labels,
  keyboardHeight = 0,
}: SetupPasswordViewProps): React.JSX.Element {
  return (
    <Box
      lx={{ flex: 1, paddingHorizontal: "s16", gap: "s24" }}
      style={{ paddingBottom: keyboardHeight + 16 }}
    >
      <PasswordField
        value={password}
        onChangeText={onPasswordChange}
        labels={labels}
        helperText={labels.minLengthHelper}
        autoFocus
        onSubmitEditing={onContinue}
        testID="app-lock-setup-password-field"
      />
      <Box lx={{ flex: 1 }} />
      <Button
        appearance="base"
        disabled={!isContinueEnabled}
        onPress={onContinue}
        testID="app-lock-setup-password-continue"
      >
        {labels.continueLabel}
      </Button>
    </Box>
  );
}
