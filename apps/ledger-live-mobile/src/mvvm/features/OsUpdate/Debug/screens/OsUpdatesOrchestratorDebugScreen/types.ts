import type { DeviceStatus } from "@ledgerhq/device-management-kit";
import type { OsUpdatesProgress } from "@ledgerhq/live-dmk-shared";

export type OrchestratorRunPhase = "idle" | "resolving" | "running" | "stopped" | "error";

export type ProgressHistoryEntry = {
  id: number;
  time: string;
  step: string;
  stateType: string;
};

export type DebugDiscoveredDevice = {
  id: string;
  name: string;
  transport: string;
};

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
  progress: OsUpdatesProgress | null;
  history: ProgressHistoryEntry[];
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
  onStop: () => void;
};
