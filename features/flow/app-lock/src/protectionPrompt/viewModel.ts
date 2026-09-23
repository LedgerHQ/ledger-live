import { useCallback, useRef, useState } from "react";
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
  const [isConfirming, setIsConfirming] = useState(false);
  // The system prompt leaves the app pressable, and two presses in one render both read the state.
  const isConfirmingRef = useRef(false);

  const onConfirm = useCallback(async () => {
    if (!isBiometricsAvailable) {
      onCreatePassword();
      return;
    }

    if (isConfirmingRef.current) {
      return;
    }

    isConfirmingRef.current = true;
    setIsConfirming(true);

    try {
      await onEnableBiometrics();
    } finally {
      isConfirmingRef.current = false;
      setIsConfirming(false);
    }
  }, [isBiometricsAvailable, onCreatePassword, onEnableBiometrics]);

  return {
    isOpen,
    variant,
    biometricsKind: biometrics?.status === "available" ? biometrics.kind : undefined,
    isConfirming,
    onConfirm,
    onClose: onDismiss,
  };
}
