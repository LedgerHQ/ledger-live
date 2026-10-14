import type { DeviceModelId } from "@ledgerhq/device-management-kit";
import type { Backup } from "@ledgerhq/dmk-ledger-wallet";

export type DeviceBackupStorage = {
  getBackup(deviceModelId: DeviceModelId): Promise<Backup | undefined>;
  saveBackup(deviceModelId: DeviceModelId, backup: Backup): Promise<void>;
  removeBackup(deviceModelId: DeviceModelId): Promise<void>;
};
