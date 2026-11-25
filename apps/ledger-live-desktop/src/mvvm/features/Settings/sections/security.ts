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
import { urls } from "~/config/urls";
import { openModal } from "~/renderer/actions/modals";
import { setAutoLockTimeout, setDiscreetMode, setMevProtection } from "~/renderer/actions/settings";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { openURL } from "~/renderer/linking";
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
  const mevProtectionUrl = useLocalizedUrl(urls.mevProtection);

  const values = useMemo<SecuritySettingsValues>(
    () => ({ hideBalance, mevProtection, passwordSet, autoLockTimeout, biometricKind: null }),
    [hideBalance, mevProtection, passwordSet, autoLockTimeout],
  );

  const effects = useMemo<SecuritySideEffects>(
    () => ({
      setHideBalance: value => dispatch(setDiscreetMode(value)),
      setMevProtection: value => dispatch(setMevProtection(value)),
      setAutoLockTimeout: timeout => dispatch(setAutoLockTimeout(timeout)),
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

  const openMevProtectionInfo = useCallback(() => openURL(mevProtectionUrl), [mevProtectionUrl]);

  return useMemo(
    () => ({ values, setValue, requestAppLock, openMevProtectionInfo }),
    [values, setValue, requestAppLock, openMevProtectionInfo],
  );
}
