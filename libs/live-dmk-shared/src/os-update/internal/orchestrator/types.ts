import type { ActorRef, Snapshot } from "xstate";
import type { OsUpdatesOrchestratorUseCaseInput } from "../../api/model/OsUpdatesOrchestrator";
import type { OsUpdatesProgress } from "../../api/model/OsUpdatesProgress";
import type { PreChecksState } from "../../api/model/PreChecksState";

export type OsUpdatesOrchestratorStateMachineInput = OsUpdatesOrchestratorUseCaseInput;

export type OsUpdatesOrchestratorStateMachineContext = OsUpdatesOrchestratorStateMachineInput & {
  currentState: OsUpdatesProgress;
};

export enum OsUpdatesOrchestratorStateMachineEventType {
  STATE_UPDATE = "STATE_UPDATE",
  STOP = "STOP",
}

export type OsUpdatesOrchestratorStateMachineEvent =
  | {
      type: OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE;
      state: PreChecksState;
    }
  | {
      type: OsUpdatesOrchestratorStateMachineEventType.STOP;
    };

export type OsUpdatesOrchestratorStateMachineActorRef = ActorRef<
  Snapshot<unknown>,
  OsUpdatesOrchestratorStateMachineEvent
>;
