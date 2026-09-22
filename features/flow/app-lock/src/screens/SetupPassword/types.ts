export type SetupPasswordViewModel = Readonly<{
  password: string;
  isContinueEnabled: boolean;
  onPasswordChange: (password: string) => void;
  onContinue: () => void;
}>;

export type UseSetupPasswordViewModelOptions = Readonly<{
  onValid: () => void;
}>;

export type SetupPasswordViewProps = SetupPasswordViewModel & Readonly<{ keyboardHeight?: number }>;
