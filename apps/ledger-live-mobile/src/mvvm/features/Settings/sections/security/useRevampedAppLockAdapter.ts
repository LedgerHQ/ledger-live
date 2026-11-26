import { useMemo } from "react";
import useAppLockBiometricsRowViewModel from "LLM/features/AppLock/components/BiometricsRow/useAppLockBiometricsRowViewModel";
import useAppLockPasswordRowViewModel from "LLM/features/AppLock/components/PasswordRow/useAppLockPasswordRowViewModel";
import { toBiometricKind } from "./biometricKind";
import { useAppLockRequest } from "./useAppLockRequest";
import type { AppLockAdapter, ProtectionRefusals } from "./types";

/**
 * The App lock of the revamped scheme (`lwmPasswordRevamp`, or any stored protection). It runs the
 * same view models as the revamped Settings rows, so tracking, the card refusal and the password
 * flows stay the ones of today. Biometrics does not need a password here.
 */
export function useRevampedAppLockAdapter(): Readonly<{
  appLock: AppLockAdapter;
  refusals: ProtectionRefusals;
}> {
  const password = useAppLockPasswordRowViewModel();
  const biometrics = useAppLockBiometricsRowViewModel();

  const { hasPassword, onValueChange: onPasswordChange } = password;
  const { availability, isEnabled, onValueChange: onBiometricsChange } = biometrics;
  const availableKind = availability?.status === "available" ? availability.kind : undefined;
  const biometricKind = toBiometricKind(availableKind);

  const requestAppLock = useAppLockRequest(onPasswordChange);

  const appLock = useMemo<AppLockAdapter>(
    () => ({
      passwordSet: hasPassword,
      biometricKind,
      biometricsEnabled: isEnabled,
      biometricsRequirePassword: false,
      requestAppLock,
      setBiometricsEnabled: onBiometricsChange,
    }),
    [hasPassword, biometricKind, isEnabled, requestAppLock, onBiometricsChange],
  );

  const refusals = useMemo<ProtectionRefusals>(
    () => ({
      password: { isOpen: password.isRefusing, onClose: password.onRefusalClose },
      biometrics: {
        isOpen: biometrics.isRefusing,
        onClose: biometrics.onRefusalClose,
        kind: availableKind,
      },
    }),
    [
      password.isRefusing,
      password.onRefusalClose,
      biometrics.isRefusing,
      biometrics.onRefusalClose,
      availableKind,
    ],
  );

  return { appLock, refusals };
}
