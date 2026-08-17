export type PasswordFieldLabels = Readonly<{
  fieldLabel: string;
  revealPassword: string;
  hidePassword: string;
}>;

export type PasswordFieldProps = Readonly<{
  value: string;
  onChangeText: (value: string) => void;
  labels: PasswordFieldLabels;
  helperText?: string;
  hasError?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  testID?: string;
}>;
