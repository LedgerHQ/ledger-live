import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { OsUpdate } from "@domain/entity-device-os-update";
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

/** A running orchestrator, as `OsUpdatesOrchestratorUseCase.execute()` returns it. */
export type OsUpdatesOrchestratorRun = {
  start: () => void;
  stop: () => void;
  subscribe: (listener: (progress: OsUpdatesProgress) => void) => { unsubscribe: () => void };
};
