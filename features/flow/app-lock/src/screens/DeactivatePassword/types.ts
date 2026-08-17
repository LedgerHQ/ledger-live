import type { PasswordFieldLabels } from "../../components/PasswordField";

export type DeactivatePasswordLabels = PasswordFieldLabels &
  Readonly<{
    wrongPasswordError: string;
    confirmLabel: string;
  }>;

export type DeactivatePasswordOutcome = "deactivated" | "wrongPassword" | "failed";

export type DeactivatePasswordViewModel = Readonly<{
  password: string;
  isConfirmEnabled: boolean;
  hasWrongPassword: boolean;
  isSubmitting: boolean;
  onPasswordChange: (password: string) => void;
  onConfirm: () => void;
}>;

export type UseDeactivatePasswordViewModelOptions = Readonly<{
  onDeactivate: (password: string) => Promise<DeactivatePasswordOutcome>;
}>;

export type DeactivatePasswordViewProps = DeactivatePasswordViewModel &
  Readonly<{
    labels: DeactivatePasswordLabels;
    errorText?: string;
  }>;
