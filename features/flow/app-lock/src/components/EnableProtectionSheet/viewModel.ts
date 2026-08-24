import { useCallback, useEffect } from "react";
import type {
  EnableProtectionSheetViewModel,
  EnableProtectionVariant,
  UseEnableProtectionSheetViewModelOptions,
} from "./types";

export function useEnableProtectionSheetViewModel({
  isRequested,
  isProtected,
  biometrics,
  onEnableBiometrics,
  onCreatePassword,
  onProceed,
  onDismiss,
}: UseEnableProtectionSheetViewModelOptions): EnableProtectionSheetViewModel {
  const variant: EnableProtectionVariant =
    biometrics.status === "available" ? "biometrics" : "password";

  const isOpen = isRequested && !isProtected;

  useEffect(() => {
    if (isRequested && isProtected) {
      onProceed();
    }
  }, [isProtected, isRequested, onProceed]);

  const onConfirm = useCallback(() => {
    if (variant === "biometrics") {
      onEnableBiometrics();
      return;
    }

    onCreatePassword();
  }, [onCreatePassword, onEnableBiometrics, variant]);

  return { isOpen, variant, onConfirm, onClose: onDismiss };
}
