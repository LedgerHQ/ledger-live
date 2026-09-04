import { createActor } from "xstate";
import type {
  OsUpdatesOrchestrator,
  OsUpdatesOrchestratorUseCaseInput,
} from "../model/OsUpdatesOrchestrator";
import { PreChecksStateType } from "../model/PreChecksState";
import { osUpdatesOrchestratorStateMachine } from "../../internal/orchestrator/osUpdatesOrchestratorStateMachine";
import { OsUpdatesOrchestratorStateMachineEventType } from "../../internal/orchestrator/types";

export class OsUpdatesOrchestratorUseCase {
  execute(input: OsUpdatesOrchestratorUseCaseInput): OsUpdatesOrchestrator {
    const actor = createActor(osUpdatesOrchestratorStateMachine, {
      input,
    });

    const stop = () => {
      actor.send({ type: OsUpdatesOrchestratorStateMachineEventType.STOP });
    };

    return {
      start: () => {
        actor.start();
      },
      stop,
      subscribe: listener => {
        const subscription = actor.subscribe({
          next: snapshot => {
            listener(snapshot.context.currentState);
          },
          // The errored snapshot keeps the context, so the step reached so far is preserved.
          error: () => {
            listener({
              ...actor.getSnapshot().context.currentState,
              state: {
                type: PreChecksStateType.UNEXPECTED_ERROR,
                cancel: stop,
              },
            });
          },
        });
        return {
          unsubscribe: () => {
            subscription.unsubscribe();
          },
        };
      },
    };
  }
}
