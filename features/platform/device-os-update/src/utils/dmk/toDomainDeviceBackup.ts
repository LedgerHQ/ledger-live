import type { Backup as DmkBackup } from "@ledgerhq/dmk-ledger-wallet";
import type { DeviceBackup } from "@domain/entity-device-os-update";

/** The backup the DMK created, as the backup storage keeps it. */
export function toDomainDeviceBackup(backup: DmkBackup): DeviceBackup {
  return {
    languageId: backup.languageId,
    installedApps: backup.installedApps.map(({ appName, data }) => ({ appName, data })),
    clsHexImage: backup.clsHexImage,
    createdAt: backup.createdAt,
  };
}
