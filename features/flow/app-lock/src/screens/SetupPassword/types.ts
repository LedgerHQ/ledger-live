import type { PasswordFieldLabels } from "../../components/PasswordField";

export type SetupPasswordLabels = PasswordFieldLabels &
  Readonly<{
    minLengthHelper: string;
    continueLabel: string;
  }>;

export type SetupPasswordViewModel = Readonly<{
  password: string;
  isContinueEnabled: boolean;
  onPasswordChange: (password: string) => void;
  onContinue: () => void;
}>;

export type UseSetupPasswordViewModelOptions = Readonly<{
  onValid: () => void;
}>;

export type SetupPasswordViewProps = SetupPasswordViewModel &
  Readonly<{ labels: SetupPasswordLabels; keyboardHeight?: number }>;
