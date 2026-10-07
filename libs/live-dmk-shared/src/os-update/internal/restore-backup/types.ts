import type { ConnectedDevice, DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { Backup, RestoreBackupDAOutput } from "@ledgerhq/dmk-ledger-wallet";
import type { StateMachine, StateSchema } from "xstate";
import type { DeviceBackupStorage } from "../../api/model/DeviceBackupStorage";
import type { RestoreBackupState } from "../../api/model/RestoreBackupState";
import type { OsUpdatesOrchestratorStateMachineActorRef } from "../orchestrator/types";
import type { DeviceSituationEvent } from "../shared/types";

export type RestoreBackupStateMachineInput = {
  dmk: DeviceManagementKit;
  connectedDevice: ConnectedDevice;
  storage: DeviceBackupStorage;
  /**
   * The orchestrator when this step runs on its own, the apply-updates machine when it is the tail
   * of an update: the latter reads the same reports and scales them into its own progress bar.
   */
  parentRef: OsUpdatesOrchestratorStateMachineActorRef;
  unlockTimeout?: number;
};

export type RestoreBackupStateMachineContext = RestoreBackupStateMachineInput & {
  lastSentState: RestoreBackupState | null;
  lastProgress: number;
  backup: Backup | undefined;
  restoreResult: RestoreBackupDAOutput | undefined;
  error: unknown;
  send: (params: RestoreBackupStateMachineEvent) => void;
};

export enum RestoreBackupStateMachineEventType {
  CANCEL = "CANCEL",
  RETRY = "RETRY",
}

export type RestoreBackupStateMachineEvent =
  | {
      type: RestoreBackupStateMachineEventType.CANCEL;
    }
  | {
      type: RestoreBackupStateMachineEventType.RETRY;
    }
  | DeviceSituationEvent;

export type RestoreBackupStateMachineOutput = {
  restoreResult: RestoreBackupDAOutput | undefined;
};

export type RestoreBackupStateMachine = StateMachine<
  RestoreBackupStateMachineContext,
  RestoreBackupStateMachineEvent,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  any, // children
  any, // actor
  any, // action
  any, // guard
  any, // delay
  any, // state value
  any, // tag
  /* eslint-enable @typescript-eslint/no-explicit-any */
  RestoreBackupStateMachineInput,
  RestoreBackupStateMachineOutput,
  /* eslint-disable @typescript-eslint/no-explicit-any */
  any, // emitted
  any, // meta
  /* eslint-enable @typescript-eslint/no-explicit-any */
  StateSchema
>;
