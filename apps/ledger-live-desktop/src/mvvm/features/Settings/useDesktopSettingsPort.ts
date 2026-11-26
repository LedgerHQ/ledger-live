import { useCallback, useMemo } from "react";
import type { SettingsPort } from "@features/flow-settings";
import {
  isRegionUpdate,
  type GeneralSettingsPort,
  type GeneralSettingsValues,
  type GeneralSettingUpdate,
  type RegionSettingsValues,
  type RegionUpdate,
} from "@features/flow-settings-general";
import {
  isSecurityUpdate,
  type SecuritySettingsPort,
  type SecuritySettingsValues,
  type SecurityUpdate,
} from "@features/flow-settings-security";
import { useGeneralSettingsAdapter } from "./sections/general/useGeneralSettingsAdapter";
import { useRegionSettingsAdapter } from "./sections/general/useRegionSettingsAdapter";
import { useSecuritySettingsAdapter } from "./sections/security";

type DesktopSettingsUpdate = GeneralSettingUpdate | RegionUpdate | SecurityUpdate;

/** The port of Ledger Wallet Desktop: the values and changes of every section, and their actions. */
export type DesktopSettingsPort = SettingsPort<
  GeneralSettingsValues & RegionSettingsValues & SecuritySettingsValues,
  DesktopSettingsUpdate
> &
  Pick<GeneralSettingsPort, "languages" | "currencies" | "ledgerSync"> &
  Pick<SecuritySettingsPort, "requestAppLock">;

/**
 * Builds the settings port of Ledger Wallet Desktop from the legacy settings store. Each section
 * has its own adapter that reads its values and runs the side effects the legacy Settings screens
 * run today. This merges them and sends each change to the adapter of its section.
 */
export function useDesktopSettingsPort(): DesktopSettingsPort {
  const general = useGeneralSettingsAdapter();
  const region = useRegionSettingsAdapter();
  const security = useSecuritySettingsAdapter();

  const values = useMemo(
    () => ({ ...general.values, ...region.values, ...security.values }),
    [general.values, region.values, security.values],
  );

  const setValue = useCallback(
    (update: DesktopSettingsUpdate) => {
      if (isSecurityUpdate(update)) {
        security.setValue(update);
      } else if (isRegionUpdate(update)) {
        region.setValue(update);
      } else {
        general.setValue(update);
      }
    },
    [general, region, security],
  );

  const { languages, currencies, ledgerSync } = general;
  const { requestAppLock } = security;

  return useMemo(
    () => ({ values, setValue, languages, currencies, ledgerSync, requestAppLock }),
    [values, setValue, languages, currencies, ledgerSync, requestAppLock],
  );
}
