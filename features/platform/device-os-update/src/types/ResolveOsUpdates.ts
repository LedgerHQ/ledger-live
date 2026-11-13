import type { DeviceManagementKit, DeviceModelId } from "@ledgerhq/device-management-kit";
import type { OsUpdate } from "@domain/entity-device-os-update";
import type { DeviceBackupStorage } from "./DeviceBackupStorage";

export type ResolveOsUpdatesInput = Readonly<{
  dmk: DeviceManagementKit;
  backupStorage: DeviceBackupStorage;
  modelId: DeviceModelId;
  wired: boolean;
  osVersion: string;
  isBootloader: boolean;
}>;

export type ResolvedOsUpdates = Readonly<{
  osUpdates: OsUpdate[];
  hasBackup: boolean;
}>;
