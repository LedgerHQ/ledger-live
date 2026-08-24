import type React from "react";
import type { TextInput } from "react-native";

export type PasswordFieldLabels = Readonly<{
  fieldLabel: string;
  revealPassword: string;
  hidePassword: string;
  useBiometrics?: string;
}>;

export type PasswordFieldProps = Readonly<{
  inputRef?: React.Ref<TextInput>;
  value: string;
  onChangeText: (value: string) => void;
  labels: PasswordFieldLabels;
  helperText?: string;
  hasError?: boolean;
  autoFocus?: boolean;
  canReveal?: boolean;
  onSubmitEditing?: () => void;
  onBiometrics?: () => void;
  testID?: string;
}>;
