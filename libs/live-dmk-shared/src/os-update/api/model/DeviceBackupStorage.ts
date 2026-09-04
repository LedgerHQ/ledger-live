import type { DeviceId } from "@ledgerhq/device-management-kit";
import type { Backup } from "@ledgerhq/dmk-ledger-wallet";

export type DeviceBackupStorage = {
  getBackup(deviceId: DeviceId): Promise<Backup | undefined>;
};
