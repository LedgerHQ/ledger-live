import { PASSWORD_MAX_LENGTH } from "@features/platform-app-lock";
import { useTranslation } from "@shared/i18n";
import { TextInput } from "@ledgerhq/lumen-ui-rnative";
import { Eye, EyeCross } from "@ledgerhq/lumen-ui-rnative/symbols";
import React, { useCallback, useState } from "react";
import { Pressable } from "react-native";
import { biometricsSymbol } from "./internals/biometricsSymbol";
import type { PasswordFieldProps } from "./types";

export function PasswordField({
  value,
  onChangeText,
  helperText,
  hasError = false,
  autoFocus = false,
  canReveal = true,
  inputRef,
  onSubmitEditing,
  onBiometrics,
  biometricsKind,
  testID,
}: PasswordFieldProps): React.JSX.Element {
  const { t } = useTranslation();
  const [isRevealed, setIsRevealed] = useState(false);
  const toggleReveal = useCallback(() => setIsRevealed(revealed => !revealed), []);
  const RevealIcon = isRevealed ? EyeCross : Eye;
  const BiometricsIcon = biometricsSymbol(biometricsKind);

  let suffix: React.ReactNode;
  if (onBiometrics) {
    suffix = (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t("appLock.unlock.retryBiometrics")}
        onPress={onBiometrics}
        testID={testID ? `${testID}-biometrics` : undefined}
      >
        <BiometricsIcon size={20} />
      </Pressable>
    );
  } else if (canReveal) {
    suffix = (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t(isRevealed ? "appLock.field.hide" : "appLock.field.reveal")}
        onPress={toggleReveal}
        testID={testID ? `${testID}-reveal` : undefined}
      >
        <RevealIcon size={20} />
      </Pressable>
    );
  }

  return (
    <TextInput
      ref={inputRef}
      label={t("appLock.field.label")}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!isRevealed}
      autoCapitalize="none"
      autoCorrect={false}
      autoComplete="off"
      spellCheck={false}
      maxLength={PASSWORD_MAX_LENGTH}
      helperText={helperText}
      status={hasError ? "error" : undefined}
      hideClearButton
      autoFocus={autoFocus}
      onSubmitEditing={onSubmitEditing}
      testID={testID}
      suffix={suffix}
    />
  );
}
