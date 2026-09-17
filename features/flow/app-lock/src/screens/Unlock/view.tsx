import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import React, { useEffect, useRef } from "react";
import { Keyboard, Pressable, type TextInput } from "react-native";
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
  hasFailed = false,
  isAppActive = true,
  logo,
  topInset = 0,
  bottomInset = 0,
  keyboardHeight = 0,
}: UnlockViewProps): React.JSX.Element {
  const { t } = useTranslation();
  const fieldRef = useRef<TextInput | null>(null);

  // The lock mounts while the app is backgrounded or still starting, where focus cannot raise a
  // keyboard: the field draws as focused and nothing opens. So it is asked for again once active.
  useEffect(() => {
    if (isAppActive) {
      fieldRef.current?.focus();
    }
  }, [isAppActive]);

  // Without this the field keeps focus after the keyboard goes, drawn as if still being typed into.
  useEffect(() => {
    const hidden = Keyboard.addListener("keyboardDidHide", () => fieldRef.current?.blur());

    return () => hidden.remove();
  }, []);

  let helperText: string | undefined;
  if (hasFailed) {
    helperText = t("appLock.unlock.failed");
  } else if (hasWrongPassword) {
    helperText = t("appLock.unlock.wrongPassword");
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
      <Box lx={{ alignItems: "center", paddingTop: "s112", paddingBottom: "s16" }}>{logo}</Box>

      <PasswordField
        inputRef={fieldRef}
        value={password}
        onChangeText={onPasswordChange}
        helperText={helperText}
        hasError={hasWrongPassword || hasFailed}
        canReveal={false}
        autoFocus
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
            {t("appLock.unlock.forgotPassword")}
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
        {t("appLock.unlock.cta")}
      </Button>
    </Box>
  );
}
