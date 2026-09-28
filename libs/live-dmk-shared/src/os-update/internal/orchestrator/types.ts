import type { ActorRef, Snapshot } from "xstate";
import type { CreateBackupState } from "../../api/model/CreateBackupState";
import type { OsUpdatesOrchestratorUseCaseInput } from "../../api/model/OsUpdatesOrchestrator";
import type { OsUpdatesSteps } from "../../api/model/OsUpdatesSteps";
import type { PreChecksState } from "../../api/model/PreChecksState";

export type OsUpdatesOrchestratorStateMachineInput = OsUpdatesOrchestratorUseCaseInput;

export type OsUpdatesState = PreChecksState | CreateBackupState;

export type OsUpdatesOrchestratorStateMachineContext = OsUpdatesOrchestratorStateMachineInput & {
  currentStep: OsUpdatesSteps;
  currentState: OsUpdatesState;
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
