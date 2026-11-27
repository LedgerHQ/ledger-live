import { useMemo } from "react";
import { useLegacyBiometricsRow } from "LLM/features/AppLock/hooks/useLegacyBiometricsRow";
import { useLegacyPasswordToggle } from "LLM/features/AppLock/hooks/useLegacyPasswordToggle";
import { toBiometricKind } from "./biometricKind";
import type { AppLockAdapter } from "./types";
import { useAppLockRequest } from "./useAppLockRequest";

/**
 * The App lock of the legacy scheme (flag off, nothing stored). It runs the hooks of the legacy
 * Settings rows: the password and biometrics live in the `privacy` setting, biometrics waits for a
 * password, and the password flows are the legacy ones.
 */
export function useLegacyAppLockAdapter(): AppLockAdapter {
  const { isOn: passwordSet, onValueChange: onPasswordChange } = useLegacyPasswordToggle();
  const {
    privacy,
    biometricsEnabled,
    onValueChange: onBiometricsChange,
  } = useLegacyBiometricsRow();

  const biometricKind = toBiometricKind(privacy?.biometricsType);

  const requestAppLock = useAppLockRequest(onPasswordChange);

  return useMemo(
    () => ({
      passwordSet,
      biometricKind,
      biometricsEnabled: Boolean(biometricsEnabled),
      biometricsRequirePassword: true,
      requestAppLock,
      setBiometricsEnabled: onBiometricsChange,
    }),
    [passwordSet, biometricKind, biometricsEnabled, requestAppLock, onBiometricsChange],
  );
}
