import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { DeviceBackup } from "@domain/entity-device-os-update";

export type DeviceBackupStorage = {
  getBackup(deviceModelId: DeviceModelId): Promise<DeviceBackup | undefined>;
  saveBackup(deviceModelId: DeviceModelId, backup: DeviceBackup): Promise<void>;
  removeBackup(deviceModelId: DeviceModelId): Promise<void>;
};
