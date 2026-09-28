import {
  type ConnectedDevice,
  type DeviceManagementKit,
  type GetOsVersionResponse,
} from "@ledgerhq/device-management-kit";
import type { OsUpdate } from "@ledgerhq/dmk-ledger-wallet";
import type { DeviceBackupStorage } from "../../api/model/DeviceBackupStorage";
import type { PreChecksState } from "../../api/model/PreChecksState";
import type { OsUpdatesOrchestratorStateMachineActorRef } from "../orchestrator/types";
import type { DeviceSituationEvent } from "../shared/types";

export enum PreChecksNextAction {
  CreateBackup = "createBackup",
  PerformOsUpdates = "performOsUpdates",
  RestoreBackup = "restoreBackup",
  Completed = "completed",
}

export type PreChecksStateMachineInput = {
  dmk: DeviceManagementKit;
  connectedDevice: ConnectedDevice;
  osUpdates: OsUpdate[];
  storage: DeviceBackupStorage;
  parentRef: OsUpdatesOrchestratorStateMachineActorRef;
  unlockTimeout?: number;
};

export type PreChecksStateMachineContext = PreChecksStateMachineInput & {
  lastSentState: PreChecksState | null;
  lastAction: PreChecksStateMachineLastAction | null;
  batteryPercentage: number;
  osVersion: GetOsVersionResponse | null;
  error: unknown;
  nextAction: PreChecksNextAction | null;
  send: (params: PreChecksStateMachineEvent) => void;
};

export enum PreChecksStateMachineEventType {
  CANCEL = "CANCEL",
}

export type PreChecksStateMachineEvent =
  | {
      type: PreChecksStateMachineEventType.CANCEL;
    }
  | DeviceSituationEvent;

export type PreChecksStateMachineOutput = PreChecksNextAction;

export enum PreChecksStateMachineLastAction {
  WaitForAppAndVersion = "waitForAppAndVersion",
  GetBatteryStatus = "getBatteryStatus",
}

export type BatteryStatus = {
  percentage: number;
  isCharging: boolean;
};
