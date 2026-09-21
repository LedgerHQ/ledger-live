import { createActor } from "xstate";
import type {
  OsUpdatesOrchestrator,
  OsUpdatesOrchestratorUseCaseInput,
} from "../model/OsUpdatesOrchestrator";
import { osUpdatesOrchestratorStateMachine } from "../../internal/orchestrator/osUpdatesOrchestratorStateMachine";
import { OsUpdatesOrchestratorStateMachineEventType } from "../../internal/orchestrator/types";
import { toProgress } from "../../internal/orchestrator/utils/toProgress";
import { unexpectedErrorState } from "../../internal/orchestrator/utils/unexpectedErrorState";

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
            listener(toProgress(snapshot.context));
          },
          // The errored snapshot keeps the context, so the step reached so far is preserved.
          error: () => {
            const { currentStep } = actor.getSnapshot().context;
            listener(
              toProgress({
                currentStep,
                currentState: unexpectedErrorState(currentStep, stop),
              }),
            );
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
