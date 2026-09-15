export type PasswordFieldProps = Readonly<{
  value: string;
  onChangeText: (value: string) => void;
  helperText?: string;
  hasError?: boolean;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
  testID?: string;
}>;
