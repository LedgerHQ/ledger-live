import manager from "@ledgerhq/live-common/manager/index";
import type { InstalledItem } from "@ledgerhq/live-common/apps/types";
import type { DeviceModelId } from "@ledgerhq/devices";
import type { DeviceInfo } from "@ledgerhq/types-live";

export const getFirmwareUpdateAppsToReinstall = (
  installed: readonly InstalledItem[],
  deviceInfo: Readonly<DeviceInfo>,
  deviceModelId: DeviceModelId,
) => installed.length > 0 && manager.firmwareUpdateWillUninstallApps(deviceInfo, deviceModelId);
