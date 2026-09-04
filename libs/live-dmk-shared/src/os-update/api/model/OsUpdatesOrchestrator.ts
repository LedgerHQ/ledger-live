import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { OsUpdate } from "@ledgerhq/dmk-ledger-wallet";
import type { DeviceBackupStorage } from "./DeviceBackupStorage";
import type { OsUpdatesProgress } from "./OsUpdatesProgress";

export type OsUpdatesOrchestratorUseCaseInput = {
  dmk: DeviceManagementKit;
  connectedDevice: ConnectedDevice;
  osUpdates: OsUpdate[];
  storage: DeviceBackupStorage;
  onStop: () => void;
  unlockTimeout?: number;
};

export type OsUpdatesOrchestrator = {
  start: () => void;
  stop: () => void;
  subscribe: (listener: (progress: OsUpdatesProgress) => void) => { unsubscribe: () => void };
};
