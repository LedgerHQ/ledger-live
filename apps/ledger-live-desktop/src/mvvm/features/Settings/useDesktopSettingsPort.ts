import { useCallback, useMemo } from "react";
import type { SettingsPort } from "@features/flow-settings";
import {
  isAssetManagementUpdate,
  type AssetManagementSettingsPort,
  type AssetManagementSettingsValues,
  type AssetManagementUpdate,
} from "@features/flow-settings-asset-management";
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
import { useAssetManagementSettingsAdapter } from "./sections/assetManagement/useAssetManagementSettingsAdapter";
import { useGeneralSettingsAdapter } from "./sections/general/useGeneralSettingsAdapter";
import { useRegionSettingsAdapter } from "./sections/general/useRegionSettingsAdapter";
import { useSecuritySettingsAdapter } from "./sections/security";

type DesktopSettingsUpdate =
  | GeneralSettingUpdate
  | RegionUpdate
  | AssetManagementUpdate
  | SecurityUpdate;

/** The port of Ledger Wallet Desktop: the values and changes of every section, and their actions. */
export type DesktopSettingsPort = SettingsPort<
  GeneralSettingsValues &
    RegionSettingsValues &
    AssetManagementSettingsValues &
    SecuritySettingsValues,
  DesktopSettingsUpdate
> &
  Pick<GeneralSettingsPort, "languages" | "currencies" | "ledgerSync"> &
  Pick<AssetManagementSettingsPort, "hiddenTokens" | "showToken" | "onHiddenTokensClosed"> &
  Pick<SecuritySettingsPort, "requestAppLock">;

/**
 * Builds the settings port of Ledger Wallet Desktop from the legacy settings store. Each section
 * has its own adapter that reads its values and runs the side effects the legacy Settings screens
 * run today. This merges them and sends each change to the adapter of its section.
 */
export function useDesktopSettingsPort(): DesktopSettingsPort {
  const general = useGeneralSettingsAdapter();
  const region = useRegionSettingsAdapter();
  const assetManagement = useAssetManagementSettingsAdapter();
  const security = useSecuritySettingsAdapter();

  const values = useMemo(
    () => ({
      ...general.values,
      ...region.values,
      ...assetManagement.values,
      ...security.values,
    }),
    [general.values, region.values, assetManagement.values, security.values],
  );

  const setValue = useCallback(
    (update: DesktopSettingsUpdate) => {
      if (isSecurityUpdate(update)) {
        security.setValue(update);
      } else if (isAssetManagementUpdate(update)) {
        assetManagement.setValue(update);
      } else if (isRegionUpdate(update)) {
        region.setValue(update);
      } else {
        general.setValue(update);
      }
    },
    [general, region, assetManagement, security],
  );

  const { languages, currencies, ledgerSync } = general;
  const { hiddenTokens, showToken, onHiddenTokensClosed } = assetManagement;
  const { requestAppLock } = security;

  return useMemo(
    () => ({
      values,
      setValue,
      languages,
      currencies,
      ledgerSync,
      hiddenTokens,
      showToken,
      onHiddenTokensClosed,
      requestAppLock,
    }),
    [
      values,
      setValue,
      languages,
      currencies,
      ledgerSync,
      hiddenTokens,
      showToken,
      onHiddenTokensClosed,
      requestAppLock,
    ],
  );
}
