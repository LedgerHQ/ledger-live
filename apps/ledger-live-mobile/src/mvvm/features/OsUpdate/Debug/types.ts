import type { DeviceStatus } from "@ledgerhq/device-management-kit";
import type { OsUpdatesOrchestratorUseCaseInput } from "@ledgerhq/live-dmk-shared";

export type OrchestratorRunPhase =
  | "idle"
  | "resolving"
  | "reviewing"
  | "running"
  | "stopped"
  | "error";

/** The last OS version the device will target, shown before the user starts the update. */
export type WhatsNew = {
  version: string;
  notes: string | null;
};

export type DebugDiscoveredDevice = {
  id: string;
  name: string;
  transport: string;
};

/** What the generic orchestrator component needs while a run is in progress. */
export type OrchestratorRun = Pick<
  OsUpdatesOrchestratorUseCaseInput,
  "dmk" | "connectedDevice" | "osUpdates" | "storage" | "onStop"
>;

export type OsUpdatesOrchestratorDebugScreenViewModel = {
  dmkReady: boolean;
  deviceId: string | null;
  sessionId: string | null;
  deviceStatus: DeviceStatus | null;
  isScanning: boolean;
  discoveredDevices: DebugDiscoveredDevice[];
  connectingDeviceId: string | null;
  canDisconnect: boolean;
  connectionErrorMessage: string | null;
  hasBackup: boolean;
  backupAge: string | null;
  isSeedBackupSheetOpen: boolean;
  canStart: boolean;
  canStop: boolean;
  isBusy: boolean;
  phase: OrchestratorRunPhase;
  orchestratorRun: OrchestratorRun | null;
  whatsNew: WhatsNew | null;
  errorMessage: string | null;
  onToggleScan: () => void;
  onConnectDevice: (deviceId: string) => void;
  onDisconnect: () => void;
  onSeedBackup: () => void;
  onCloseSeedBackupSheet: () => void;
  onSeedValidBackup: () => void;
  onSeedExpiredBackup: () => void;
  onRemoveBackup: () => void;
  onStart: () => void;
  onConfirmStart: () => void;
  onStop: () => void;
};
