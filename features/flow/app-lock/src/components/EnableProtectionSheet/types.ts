import type { BiometricsAvailability } from "@features/platform-app-lock";

export type EnableProtectionVariant = "biometrics" | "password";

export type EnableProtectionSheetLabels = Readonly<{
  biometricsTitle: string;
  biometricsDescription: string;
  biometricsCta: string;
  passwordTitle: string;
  passwordDescription: string;
  passwordCta: string;
}>;

export type EnableProtectionSheetViewModel = Readonly<{
  isOpen: boolean;
  variant: EnableProtectionVariant;
  onConfirm: () => void;
  onClose: () => void;
}>;

export type UseEnableProtectionSheetViewModelOptions = Readonly<{
  isRequested: boolean;
  isProtected: boolean;
  biometrics: BiometricsAvailability;
  onEnableBiometrics: () => void;
  onCreatePassword: () => void;
  onProceed: () => void;
  onDismiss: () => void;
}>;

export type EnableProtectionSheetProps = EnableProtectionSheetViewModel &
  Readonly<{ labels: EnableProtectionSheetLabels }>;
