export type DeactivatePasswordOutcome = "deactivated" | "wrongPassword" | "failed";

export type DeactivatePasswordViewModel = Readonly<{
  password: string;
  isConfirmEnabled: boolean;
  hasWrongPassword: boolean;
  isSubmitting: boolean;
  onPasswordChange: (password: string) => void;
  onConfirm: () => Promise<void>;
}>;

export type UseDeactivatePasswordViewModelOptions = Readonly<{
  onDeactivate: (password: string) => Promise<DeactivatePasswordOutcome>;
}>;

export type DeactivatePasswordViewProps = DeactivatePasswordViewModel &
  Readonly<{
    hasFailed?: boolean;
    keyboardHeight?: number;
  }>;
