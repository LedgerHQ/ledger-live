import { type ConnectedDevice, type DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { Backup } from "@ledgerhq/dmk-ledger-wallet";
import type { CreateBackupState } from "../../api/model/CreateBackupState";
import type { DeviceBackupStorage } from "../../api/model/DeviceBackupStorage";
import type { OsUpdatesOrchestratorStateMachineActorRef } from "../orchestrator/types";
import type { DeviceSituationEvent } from "../shared/types";

export type CreateBackupStateMachineInput = {
  dmk: DeviceManagementKit;
  connectedDevice: ConnectedDevice;
  storage: DeviceBackupStorage;
  parentRef: OsUpdatesOrchestratorStateMachineActorRef;
  unlockTimeout?: number;
};

export type CreateBackupStateMachineContext = CreateBackupStateMachineInput & {
  lastSentState: CreateBackupState | null;
  lastAction: CreateBackupStateMachineLastAction | null;
  existingBackup: Backup | undefined;
  backup: Backup | null;
  error: unknown;
  send: (params: CreateBackupStateMachineEvent) => void;
};

export enum CreateBackupStateMachineEventType {
  CANCEL = "CANCEL",
  RETRY = "RETRY",
  USE_EXISTING_BACKUP = "USE_EXISTING_BACKUP",
  CREATE_NEW_BACKUP = "CREATE_NEW_BACKUP",
}

export type CreateBackupStateMachineEvent =
  | {
      type: CreateBackupStateMachineEventType.CANCEL;
    }
  | {
      type: CreateBackupStateMachineEventType.RETRY;
    }
  | {
      type: CreateBackupStateMachineEventType.USE_EXISTING_BACKUP;
    }
  | {
      type: CreateBackupStateMachineEventType.CREATE_NEW_BACKUP;
    }
  | DeviceSituationEvent;

export enum CreateBackupStateMachineLastAction {
  CreateBackup = "createBackup",
}
