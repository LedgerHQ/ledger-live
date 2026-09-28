import { useCallback } from "react";
import type {
  ProtectionPromptViewModel,
  ProtectionPromptVariant,
  UseProtectionPromptViewModelOptions,
} from "./types";

export function useProtectionPromptViewModel({
  isRequested,
  isProtected,
  biometrics,
  onEnableBiometrics,
  onCreatePassword,
  onDismiss,
}: UseProtectionPromptViewModelOptions): ProtectionPromptViewModel {
  const isBiometricsAvailable = biometrics?.status === "available";
  const variant: ProtectionPromptVariant = isBiometricsAvailable ? "biometrics" : "password";
  const isOpen = isRequested && !isProtected && biometrics !== undefined;

  const onConfirm = useCallback(() => {
    if (isBiometricsAvailable) {
      onEnableBiometrics();
      return;
    }

    onCreatePassword();
  }, [isBiometricsAvailable, onCreatePassword, onEnableBiometrics]);

  return {
    isOpen,
    variant,
    biometricsKind: biometrics?.status === "available" ? biometrics.kind : undefined,
    onConfirm,
    onClose: onDismiss,
  };
}
