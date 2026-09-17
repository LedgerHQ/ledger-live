export type ConfirmPasswordViewModel = Readonly<{
  password: string;
  isConfirmEnabled: boolean;
  hasMismatch: boolean;
  isSaving: boolean;
  onPasswordChange: (password: string) => void;
  onConfirm: () => Promise<void>;
}>;

export type UseConfirmPasswordViewModelOptions = Readonly<{
  onConfirmed: (password: string) => void | Promise<void>;
}>;

export type ConfirmPasswordViewProps = ConfirmPasswordViewModel &
  Readonly<{
    hasSaveFailed?: boolean;
    keyboardHeight?: number;
  }>;
