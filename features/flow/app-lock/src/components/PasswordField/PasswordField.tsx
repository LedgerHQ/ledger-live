import { PASSWORD_MAX_LENGTH } from "@features/platform-app-lock";
import { TextInput } from "@ledgerhq/lumen-ui-rnative";
import { Eye, EyeCross } from "@ledgerhq/lumen-ui-rnative/symbols";
import React, { useCallback, useState } from "react";
import { Pressable } from "react-native";
import type { PasswordFieldProps } from "./types";

export function PasswordField({
  value,
  onChangeText,
  labels,
  helperText,
  hasError = false,
  autoFocus = false,
  onSubmitEditing,
  testID,
}: PasswordFieldProps): React.JSX.Element {
  const [isRevealed, setIsRevealed] = useState(false);
  const toggleReveal = useCallback(() => setIsRevealed(revealed => !revealed), []);
  const RevealIcon = isRevealed ? EyeCross : Eye;

  return (
    <TextInput
      label={labels.fieldLabel}
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
      suffix={
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRevealed ? labels.hidePassword : labels.revealPassword}
          onPress={toggleReveal}
          testID={testID ? `${testID}-reveal` : undefined}
        >
          <RevealIcon size={20} />
        </Pressable>
      }
    />
  );
}
