import type { DeviceStatus } from "@ledgerhq/device-management-kit";
import type { OsUpdatesProgress } from "@ledgerhq/live-dmk-shared";

export type OrchestratorRunPhase = "idle" | "resolving" | "running" | "stopped" | "error";

export type ProgressHistoryEntry = {
  id: number;
  time: string;
  step: string;
  stateType: string;
};

export type OsUpdatesOrchestratorDebugScreenViewModel = {
  dmkReady: boolean;
  deviceId: string | null;
  sessionId: string | null;
  deviceStatus: DeviceStatus | null;
  hasBackup: boolean;
  canStart: boolean;
  canStop: boolean;
  isBusy: boolean;
  phase: OrchestratorRunPhase;
  progress: OsUpdatesProgress | null;
  history: ProgressHistoryEntry[];
  errorMessage: string | null;
  onSeedBackup: () => void;
  onRemoveBackup: () => void;
  onStart: () => void;
  onStop: () => void;
};
