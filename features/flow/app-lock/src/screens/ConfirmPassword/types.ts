import type { PasswordFieldLabels } from "../../components/PasswordField";

export type ConfirmPasswordLabels = PasswordFieldLabels &
  Readonly<{
    minLengthHelper: string;
    mismatchError: string;
    confirmLabel: string;
  }>;

export type ConfirmPasswordViewModel = Readonly<{
  password: string;
  isConfirmEnabled: boolean;
  hasMismatch: boolean;
  isSaving: boolean;
  onPasswordChange: (password: string) => void;
  onConfirm: () => void;
}>;

export type UseConfirmPasswordViewModelOptions = Readonly<{
  onConfirmed: (password: string) => void | Promise<void>;
}>;

export type ConfirmPasswordViewProps = ConfirmPasswordViewModel &
  Readonly<{
    labels: ConfirmPasswordLabels;
    errorText?: string;
    keyboardHeight?: number;
  }>;
