import { Box, Button, Text } from "@ledgerhq/lumen-ui-rnative";
import { useTranslation } from "@shared/i18n";
import React, { useEffect, useRef } from "react";
import { Keyboard, Pressable, StyleSheet, View, type TextInput } from "react-native";
import { PasswordField } from "../../components/PasswordField";
import { shouldFocusPasswordField } from "./internals/focus";
import { isOfferingBiometricsRetry, isShowingSplash } from "./splash";
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
  hasPassword = true,
  isAwaitingBiometrics = false,
  isForgotPasswordOpen = false,
  isAppActive = true,
  biometricsKind,
  logo,
  topInset = 0,
  bottomInset = 0,
  keyboardHeight = 0,
}: UnlockViewProps): React.JSX.Element {
  const { t } = useTranslation();
  const fieldRef = useRef<TextInput | null>(null);

  const canFocusField = shouldFocusPasswordField({
    hasPassword,
    isAwaitingBiometrics,
    isForgotPasswordOpen,
    isAppActive,
  });

  useEffect(() => {
    if (canFocusField) {
      fieldRef.current?.focus();
    } else {
      fieldRef.current?.blur();
      Keyboard.dismiss();
    }
  }, [canFocusField]);

  // Without this the field keeps focus after the keyboard goes, drawn as if still being typed into.
  useEffect(() => {
    const hidden = Keyboard.addListener("keyboardDidHide", () => fieldRef.current?.blur());

    return () => hidden.remove();
  }, []);

  // Takes over from the splash with the mark where the splash had it, so the handover is invisible.
  if (isShowingSplash({ hasPassword, isAwaitingBiometrics })) {
    return (
      <Box
        lx={{
          flex: 1,
          backgroundColor: "canvas",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: "s16",
        }}
        testID="app-lock-unlock-screen"
      >
        <View style={styles.retrySlot} />
        {logo}
        <View style={[styles.retrySlot, styles.retrySlotContent]}>
          {isOfferingBiometricsRetry({ canRetryBiometrics, isAwaitingBiometrics }) ? (
            <Button
              appearance="gray"
              size="lg"
              onPress={onRetryBiometrics}
              testID="app-lock-unlock-retry-biometrics"
            >
              {t("appLock.unlock.unlockCta")}
            </Button>
          ) : null}
        </View>
      </Box>
    );
  }

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
        biometricsKind={biometricsKind}
        testID="app-lock-unlock-field"
      />

      <Box lx={{ flex: 1 }} />

      {onForgotPassword ? (
        <Pressable
          accessibilityRole="button"
          onPress={onForgotPassword}
          testID="app-lock-unlock-forgot-password"
        >
          <Text
            typography="body2SemiBold"
            numberOfLines={1}
            ellipsizeMode="tail"
            lx={{ color: "muted", textAlign: "center", textDecorationLine: "underline" }}
          >
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

// Reserved on both sides of the mark, so it holds its place whether the button is there or not:
// 64 above the button, which is 56 tall at this size.
const RETRY_SLOT_HEIGHT = 120;

const styles = StyleSheet.create({
  retrySlot: { height: RETRY_SLOT_HEIGHT },
  retrySlotContent: { alignItems: "center", justifyContent: "flex-end" },
});
