import type React from "react";
import type { PasswordFieldLabels } from "../../components/PasswordField";

export type UnlockLabels = PasswordFieldLabels &
  Readonly<{
    wrongPasswordError: string;
    forgotPassword: string;
    unlockLabel: string;
  }>;

export type UnlockOutcome = "unlocked" | "incorrect" | "failed";

export type UnlockViewModel = Readonly<{
  password: string;
  isUnlockEnabled: boolean;
  hasWrongPassword: boolean;
  isVerifying: boolean;
  canRetryBiometrics: boolean;
  onPasswordChange: (password: string) => void;
  onUnlock: () => void;
  onRetryBiometrics: () => void;
  onForgotPassword?: () => void;
}>;

export type UseUnlockViewModelOptions = Readonly<{
  onVerify: (password: string) => Promise<UnlockOutcome>;
  canRetryBiometrics: boolean;
  onRetryBiometrics: () => void;
  onForgotPassword?: () => void;
}>;

export type UnlockViewProps = UnlockViewModel &
  Readonly<{
    labels: UnlockLabels;
    errorText?: string;
    logo?: React.ReactNode;
    topInset?: number;
    bottomInset?: number;
    keyboardHeight?: number;
  }>;
