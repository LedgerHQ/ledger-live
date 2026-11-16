import type { ActorRef, Snapshot } from "xstate";
import type { ApplyUpdatesState } from "../../types/ApplyUpdatesState";
import type { CreateBackupState } from "../../types/CreateBackupState";
import type { OsUpdatesOrchestratorUseCaseInput } from "../../types/OsUpdatesOrchestrator";
import type { OsUpdatesSteps } from "../../types/OsUpdatesSteps";
import type { PreChecksState } from "../../types/PreChecksState";
import type { RestoreBackupState } from "../../types/RestoreBackupState";

export type OsUpdatesOrchestratorStateMachineInput = OsUpdatesOrchestratorUseCaseInput;

export type OsUpdatesState =
  | PreChecksState
  | CreateBackupState
  | ApplyUpdatesState
  | RestoreBackupState;

export type OsUpdatesOrchestratorStateMachineContext = OsUpdatesOrchestratorStateMachineInput & {
  currentStep: OsUpdatesSteps;
  currentState: OsUpdatesState;
  failedError?: unknown;
};

export enum OsUpdatesOrchestratorStateMachineEventType {
  STATE_UPDATE = "STATE_UPDATE",
  STOP = "STOP",
}

export type OsUpdatesOrchestratorStateMachineEvent =
  | {
      type: OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE;
      state: OsUpdatesState;
    }
  | {
      type: OsUpdatesOrchestratorStateMachineEventType.STOP;
    };

export type OsUpdatesOrchestratorStateMachineActorRef = ActorRef<
  Snapshot<unknown>,
  OsUpdatesOrchestratorStateMachineEvent
>;
