import type { BiometricsAvailability, BiometricsKind } from "@features/platform-app-lock";

export type ProtectionPromptVariant = "biometrics" | "password";

export type ProtectionPromptViewModel = Readonly<{
  isOpen: boolean;
  variant: ProtectionPromptVariant;
  biometricsKind?: BiometricsKind;
  onConfirm: () => void;
  onClose: () => void;
}>;

export type UseProtectionPromptViewModelOptions = Readonly<{
  isRequested: boolean;
  isProtected: boolean;
  biometrics: BiometricsAvailability | undefined;
  onEnableBiometrics: () => void;
  onCreatePassword: () => void;
  onDismiss: () => void;
}>;
