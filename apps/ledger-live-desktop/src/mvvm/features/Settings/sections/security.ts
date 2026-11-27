import { useCallback, useMemo } from "react";
import {
  applySecurityUpdate,
  type AppLockAction,
  type SecuritySettingsPort,
  type SecuritySettingsValues,
  type SecuritySideEffects,
  type SecurityUpdate,
} from "@features/flow-settings-security";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import { setAutoLockTimeout, setDiscreetMode, setMevProtection } from "~/renderer/actions/settings";
import { hasPasswordSelector } from "~/renderer/reducers/application";
import {
  autoLockTimeoutSelector,
  discreetModeSelector,
  mevProtectionSelector,
} from "~/renderer/reducers/settings";

/**
 * The Security section's part of the settings port: its values from the legacy store, its
 * changes as the legacy dispatches, and the existing password modals for the App lock.
 */
export function useSecuritySettingsAdapter(): SecuritySettingsPort {
  const dispatch = useDispatch();
  const hideBalance = useSelector(discreetModeSelector);
  const mevProtection = useSelector(mevProtectionSelector);
  const passwordSet = useSelector(hasPasswordSelector);
  const autoLockTimeout = useSelector(autoLockTimeoutSelector);

  const values = useMemo<SecuritySettingsValues>(
    () => ({
      hideBalance,
      mevProtection,
      passwordSet,
      autoLockTimeout,
      biometricKind: null,
      biometricsEnabled: false,
      biometricsRequirePassword: false,
    }),
    [hideBalance, mevProtection, passwordSet, autoLockTimeout],
  );

  const effects = useMemo<SecuritySideEffects>(
    () => ({
      setHideBalance: value => dispatch(setDiscreetMode(value)),
      setMevProtection: value => dispatch(setMevProtection(value)),
      setAutoLockTimeout: timeout => dispatch(setAutoLockTimeout(timeout)),
      // Desktop has no biometrics row: the section never sends this change.
      setBiometricsEnabled: () => undefined,
    }),
    [dispatch],
  );

  const setValue = useCallback(
    (update: SecurityUpdate) => applySecurityUpdate(effects, update),
    [effects],
  );

  const requestAppLock = useCallback(
    (action: AppLockAction) =>
      dispatch(
        openModal(action === "remove" ? "MODAL_DISABLE_PASSWORD" : "MODAL_PASSWORD", undefined),
      ),
    [dispatch],
  );

  return useMemo(() => ({ values, setValue, requestAppLock }), [values, setValue, requestAppLock]);
}
