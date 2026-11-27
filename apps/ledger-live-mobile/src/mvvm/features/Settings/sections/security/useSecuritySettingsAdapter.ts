import { useCallback, useMemo } from "react";
import {
  applySecurityUpdate,
  type SecuritySettingsPort,
  type SecuritySettingsValues,
  type SecuritySideEffects,
  type SecurityUpdate,
} from "@features/flow-settings-security";
import { setDiscreetMode, setMevProtection } from "~/actions/settings";
import { useDispatch, useSelector } from "~/context/hooks";
import { discreetModeSelector, mevProtectionSelector } from "~/reducers/settings";
import type { AppLockAdapter } from "./types";

/** Mobile has no auto-lock setting, and no row shows this value. */
const NO_AUTO_LOCK = -1;

/**
 * The Security section's part of the settings port: hide balance and MEV protection from the
 * legacy store, and the App lock of the active version.
 */
export function useSecuritySettingsAdapter(appLock: AppLockAdapter): SecuritySettingsPort {
  const dispatch = useDispatch();
  const hideBalance = useSelector(discreetModeSelector);
  const mevProtection = useSelector(mevProtectionSelector);

  const { passwordSet, biometricKind, biometricsEnabled, biometricsRequirePassword } = appLock;
  const { requestAppLock, setBiometricsEnabled } = appLock;

  const values = useMemo<SecuritySettingsValues>(
    () => ({
      hideBalance,
      mevProtection,
      passwordSet,
      autoLockTimeout: NO_AUTO_LOCK,
      biometricKind,
      biometricsEnabled,
      biometricsRequirePassword,
    }),
    [
      hideBalance,
      mevProtection,
      passwordSet,
      biometricKind,
      biometricsEnabled,
      biometricsRequirePassword,
    ],
  );

  const effects = useMemo<SecuritySideEffects>(
    () => ({
      setHideBalance: value => dispatch(setDiscreetMode(value)),
      setMevProtection: value => dispatch(setMevProtection(value)),
      setAutoLockTimeout: () => undefined,
      setBiometricsEnabled,
    }),
    [dispatch, setBiometricsEnabled],
  );

  const setValue = useCallback(
    (update: SecurityUpdate) => applySecurityUpdate(effects, update),
    [effects],
  );

  return useMemo(() => ({ values, setValue, requestAppLock }), [values, setValue, requestAppLock]);
}
