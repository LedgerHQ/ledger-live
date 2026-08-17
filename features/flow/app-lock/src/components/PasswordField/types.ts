import type React from "react";
import type { TextInput } from "react-native";

export type PasswordFieldProps = Readonly<{
  inputRef?: React.Ref<TextInput>;
  value: string;
  onChangeText: (value: string) => void;
  helperText?: string;
  hasError?: boolean;
  autoFocus?: boolean;
  canReveal?: boolean;
  onSubmitEditing?: () => void;
  onBiometrics?: () => void;
  testID?: string;
}>;
