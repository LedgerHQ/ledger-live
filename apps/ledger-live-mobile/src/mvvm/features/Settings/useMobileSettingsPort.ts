import { useCallback, useMemo } from "react";
import type { SettingsPort } from "@features/flow-settings";
import type {
  GeneralSettingsPort,
  GeneralSettingsValues,
  GeneralSettingUpdate,
} from "@features/flow-settings-general";
import {
  isSecurityUpdate,
  type SecuritySettingsPort,
  type SecuritySettingsValues,
  type SecurityUpdate,
} from "@features/flow-settings-security";
import { useGeneralSettingsAdapter } from "./sections/general/useGeneralSettingsAdapter";
import { useSecuritySettingsAdapter } from "./sections/security/useSecuritySettingsAdapter";
import type { AppLockAdapter } from "./sections/security/types";

type MobileSettingsUpdate = GeneralSettingUpdate | SecurityUpdate;

/** The port of Ledger Wallet Mobile: the values and changes of every section, and their actions. */
export type MobileSettingsPort = SettingsPort<
  GeneralSettingsValues & SecuritySettingsValues,
  MobileSettingsUpdate
> &
  Pick<GeneralSettingsPort, "languages" | "currencies" | "ledgerSync"> &
  Pick<SecuritySettingsPort, "requestAppLock">;

/**
 * Builds the settings port of Ledger Wallet Mobile from the legacy settings store. Each section
 * has its own adapter that reads its values and runs the side effects the legacy Settings screens
 * run today. This merges them and sends each change to the adapter of its section. The App lock
 * comes from the caller, which knows which version of it is active.
 */
export function useMobileSettingsPort(appLock: AppLockAdapter): MobileSettingsPort {
  const general = useGeneralSettingsAdapter();
  const security = useSecuritySettingsAdapter(appLock);

  const values = useMemo(
    () => ({ ...general.values, ...security.values }),
    [general.values, security.values],
  );

  const setValue = useCallback(
    (update: MobileSettingsUpdate) => {
      if (isSecurityUpdate(update)) {
        security.setValue(update);
      } else {
        general.setValue(update);
      }
    },
    [general, security],
  );

  const { languages, currencies, ledgerSync } = general;
  const { requestAppLock } = security;

  return useMemo(
    () => ({ values, setValue, languages, currencies, ledgerSync, requestAppLock }),
    [values, setValue, languages, currencies, ledgerSync, requestAppLock],
  );
}
