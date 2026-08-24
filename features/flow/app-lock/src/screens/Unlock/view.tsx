import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import React, { useEffect, useRef } from "react";
import { Keyboard, Pressable, StyleSheet, type TextInput } from "react-native";
import { PasswordField } from "../../components/PasswordField";
import { shouldFocusPasswordField } from "./focus";
import { isShowingSplash } from "./splash";
import type { UnlockViewProps } from "./types";

const splashStyle = StyleSheet.create({ fill: { flex: 1 } }).fill;

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
  isCovered = false,
  hasPassword = true,
  isAwaitingBiometrics = false,
  isAppActive = true,
  topInset = 0,
  bottomInset = 0,
  keyboardHeight = 0,
}: UnlockViewProps): React.JSX.Element {
  const fieldRef = useRef<TextInput | null>(null);
  const canFocusField = shouldFocusPasswordField({
    hasPassword,
    isAwaitingBiometrics,
    isCovered,
    isAppActive,
  });

  useEffect(() => {
    if (canFocusField) {
      fieldRef.current?.focus();
    }
  }, [canFocusField]);

  // Without this the field keeps focus after the keyboard goes, drawn as if still being typed into.
  useEffect(() => {
    const hidden = Keyboard.addListener("keyboardDidHide", () => fieldRef.current?.blur());

    return () => hidden.remove();
  }, []);

  const helperText = errorText ?? (hasWrongPassword ? labels.wrongPasswordError : undefined);

  if (isShowingSplash({ hasPassword, isAwaitingBiometrics })) {
    return (
      <Pressable
        onPress={isAwaitingBiometrics ? undefined : onRetryBiometrics}
        style={splashStyle}
        testID="app-lock-unlock-screen"
      >
        <Box
          lx={{
            flex: 1,
            backgroundColor: "canvas",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {logo}
        </Box>
      </Pressable>
    );
  }

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

      {hasPassword ? (
        <PasswordField
          inputRef={fieldRef}
          value={password}
          onChangeText={onPasswordChange}
          labels={labels}
          helperText={helperText}
          hasError={hasWrongPassword || errorText !== undefined}
          autoFocus={!isCovered}
          canReveal={false}
          onSubmitEditing={onUnlock}
          onBiometrics={canRetryBiometrics ? onRetryBiometrics : undefined}
          testID="app-lock-unlock-field"
        />
      ) : null}

      <Box lx={{ flex: 1 }} />

      {onForgotPassword && hasPassword ? (
        <Pressable
          accessibilityRole="button"
          onPress={onForgotPassword}
          testID="app-lock-unlock-forgot-password"
        >
          <Text
            typography="body2SemiBold"
            lx={{ color: "muted", textAlign: "center", textDecorationLine: "underline" }}
          >
            {labels.forgotPassword}
          </Text>
        </Pressable>
      ) : null}

      {hasPassword ? (
        <Button
          appearance="base"
          disabled={!isUnlockEnabled}
          loading={isVerifying}
          onPress={onUnlock}
          testID="app-lock-unlock-submit"
        >
          {labels.unlockLabel}
        </Button>
      ) : null}
    </Box>
  );
}
