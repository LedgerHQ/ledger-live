import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import React from "react";
import { Pressable } from "react-native";
import { PasswordField } from "../../components/PasswordField";
import type { UnlockViewProps } from "./types";

export function UnlockView({
  password,
  isUnlockEnabled,
  hasWrongPassword,
  isVerifying,
  canRetryBiometrics,
  onPasswordChange,
  onUnlock,
  onRetryBiometrics,
  onForgotPassword,
  labels,
  errorText,
  logo,
  topInset = 0,
  bottomInset = 0,
  keyboardHeight = 0,
}: UnlockViewProps): React.JSX.Element {
  const helperText = errorText ?? (hasWrongPassword ? labels.wrongPasswordError : undefined);

  return (
    <Box
      lx={{ flex: 1, backgroundColor: "canvas", paddingHorizontal: "s16", gap: "s24" }}
      style={{
        paddingTop: topInset,
        paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : Math.max(bottomInset, 16),
      }}
      testID="app-lock-unlock-screen"
    >
      {/* Figma 9525-48215: 40 between the mark and the field, 16 here plus the column's own 24. */}
      <Box lx={{ alignItems: "center", paddingTop: "s112", paddingBottom: "s16" }}>{logo}</Box>

      <PasswordField
        value={password}
        onChangeText={onPasswordChange}
        labels={labels}
        helperText={helperText}
        hasError={hasWrongPassword || errorText !== undefined}
        canReveal={false}
        onSubmitEditing={onUnlock}
        onBiometrics={canRetryBiometrics ? onRetryBiometrics : undefined}
        testID="app-lock-unlock-field"
      />

      <Box lx={{ flex: 1 }} />

      {onForgotPassword ? (
        <Pressable
          accessibilityRole="button"
          onPress={onForgotPassword}
          testID="app-lock-unlock-forgot-password"
        >
          <Text lx={{ textAlign: "center", textDecorationLine: "underline" }}>
            {labels.forgotPassword}
          </Text>
        </Pressable>
      ) : null}

      <Button
        appearance="base"
        disabled={!isUnlockEnabled}
        loading={isVerifying}
        onPress={onUnlock}
        testID="app-lock-unlock-submit"
      >
        {labels.unlockLabel}
      </Button>
    </Box>
  );
}
