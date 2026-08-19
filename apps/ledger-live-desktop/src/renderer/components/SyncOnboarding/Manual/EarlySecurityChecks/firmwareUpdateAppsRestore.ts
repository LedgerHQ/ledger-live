import type { InstalledItem } from "@ledgerhq/live-common/apps/types";
import type { DeviceInfo } from "@ledgerhq/types-live";

export type InstalledAppsResolution =
  | { type: "ready"; installed: readonly InstalledItem[] }
  | { type: "needsListing" };

type FirmwareUpdateListingDeviceInfo = Pick<DeviceInfo, "onboarded" | "isRecoveryMode">;

function canListInstalledAppsForFirmwareUpdate(
  deviceInfo?: FirmwareUpdateListingDeviceInfo | null,
): boolean {
  if (!deviceInfo) return true;
  return Boolean(deviceInfo.onboarded || deviceInfo.isRecoveryMode);
}

export function resolveInstalledAppsForFirmwareUpdate(
  cachedInstalled: readonly InstalledItem[],
  listedInstalled: readonly InstalledItem[] | undefined,
  deviceInfo?: FirmwareUpdateListingDeviceInfo | null,
): InstalledAppsResolution {
  if (!canListInstalledAppsForFirmwareUpdate(deviceInfo)) {
    return { type: "ready", installed: [] };
  }
  if (cachedInstalled.length > 0) {
    return { type: "ready", installed: cachedInstalled };
  }
  if (listedInstalled !== undefined) {
    return { type: "ready", installed: listedInstalled };
  }
  return { type: "needsListing" };
}

export type ListedAppsListingEffectAction =
  | { type: "noop" }
  | { type: "openWithCached"; installed: readonly InstalledItem[] }
  | { type: "openWithListed"; installed: readonly InstalledItem[] };

export function resolveListedAppsListingEffect(
  shouldListInstalledApps: boolean,
  listError: unknown,
  cachedInstalled: readonly InstalledItem[],
  listedInstalled: readonly InstalledItem[] | undefined,
): ListedAppsListingEffectAction {
  if (!shouldListInstalledApps) return { type: "noop" };
  if (listError) {
    return { type: "openWithCached", installed: cachedInstalled };
  }
  if (listedInstalled === undefined) return { type: "noop" };
  return { type: "openWithListed", installed: listedInstalled };
}

export type FirmwareUpdateCloseAction =
  | { type: "restoreApps"; apps: readonly string[] }
  | { type: "restartChecks" };

export function resolveFirmwareUpdateCloseAction(
  firmwareUpdateCompleted: boolean,
  withAppsToReinstall: boolean,
  installed: readonly InstalledItem[],
): FirmwareUpdateCloseAction {
  const apps = installed.map(({ name }) => name);
  if (firmwareUpdateCompleted && withAppsToReinstall && apps.length > 0) {
    return { type: "restoreApps", apps };
  }
  return { type: "restartChecks" };
}

export type AppsRestoreTrigger =
  | { type: "startRestore"; apps: string[] }
  | { type: "restartChecks" };

export function resolveAppsRestoreTrigger(appsToRestore: readonly string[]): AppsRestoreTrigger {
  if (appsToRestore.length > 0) {
    return { type: "startRestore", apps: [...appsToRestore] };
  }
  return { type: "restartChecks" };
}
