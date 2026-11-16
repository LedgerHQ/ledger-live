import { createActor } from "xstate";
import type {
  OsUpdatesOrchestratorRun,
  OsUpdatesOrchestratorUseCaseInput,
} from "../../types/OsUpdatesOrchestrator";
import { osUpdatesOrchestratorStateMachine } from "../../state-machines/orchestrator/osUpdatesOrchestratorStateMachine";
import { OsUpdatesOrchestratorStateMachineEventType } from "../../state-machines/orchestrator/types";
import { toProgress } from "../../state-machines/orchestrator/utils/toProgress";
import { unexpectedErrorState } from "../../state-machines/orchestrator/utils/unexpectedErrorState";

export class OsUpdatesOrchestratorUseCase {
  execute(input: OsUpdatesOrchestratorUseCaseInput): OsUpdatesOrchestratorRun {
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
          error: error => {
            const { currentStep } = actor.getSnapshot().context;
            listener(
              toProgress({
                currentStep,
                currentState: unexpectedErrorState(currentStep, stop, error),
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
