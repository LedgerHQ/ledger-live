import { useCallback, useMemo } from "react";
import type { GeneralSettingsValues, SettingsPort } from "@features/flow-settings";
import {
  isSecurityUpdate,
  type SecuritySettingsPort,
  type SecuritySettingsValues,
  type SecurityUpdate,
} from "@features/flow-settings-security";
import { useGeneralSettingsAdapter, type GeneralSettingUpdate } from "./sections/general";
import { useSecuritySettingsAdapter } from "./sections/security";

type DesktopSettingsUpdate = GeneralSettingUpdate | SecurityUpdate;

/** The port of Ledger Wallet Desktop: the values and changes of every section, and their actions. */
export type DesktopSettingsPort = SettingsPort<
  GeneralSettingsValues & SecuritySettingsValues,
  DesktopSettingsUpdate
> &
  Pick<SecuritySettingsPort, "requestAppLock" | "openMevProtectionInfo">;

/**
 * Builds the settings port of Ledger Wallet Desktop from the legacy settings store. Each section
 * has its own adapter that reads its values and runs the side effects the legacy Settings screens
 * run today. This merges them and sends each change to the adapter of its section.
 */
export function useDesktopSettingsPort(): DesktopSettingsPort {
  const general = useGeneralSettingsAdapter();
  const security = useSecuritySettingsAdapter();

  const values = useMemo(
    () => ({ ...general.values, ...security.values }),
    [general.values, security.values],
  );

  const setValue = useCallback(
    (update: DesktopSettingsUpdate) => {
      if (isSecurityUpdate(update)) {
        security.setValue(update);
      } else {
        general.setValue(update);
      }
    },
    [general, security],
  );

  const { requestAppLock, openMevProtectionInfo } = security;

  return useMemo(
    () => ({ values, setValue, requestAppLock, openMevProtectionInfo }),
    [values, setValue, requestAppLock, openMevProtectionInfo],
  );
}
