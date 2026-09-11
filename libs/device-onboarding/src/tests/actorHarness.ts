import { createActor, setup, type AnyActorLogic, type EventObject } from "xstate";

export type RunningActor<TEvent> = {
  received: TEvent[];
  stop(): void;
};

/**
 * Invokes an actor from a machine that captures whatever it sends back, since a callback actor only
 * reports through its parent.
 */
export function runActor<TEvent extends EventObject>(
  actor: AnyActorLogic,
  input: unknown,
): RunningActor<TEvent> {
  const received: TEvent[] = [];

  const machine = setup({
    types: { events: {} as TEvent },
    actors: { actor },
    actions: {
      capture: ({ event }) => {
        if (!event.type.startsWith("xstate.")) {
          received.push(event);
        }
      },
    },
  }).createMachine({
    invoke: { src: "actor", input },
    on: { "*": { actions: "capture" } },
  });

  const running = createActor(machine).start();

  return { received, stop: () => running.stop() };
}

/**
 * Drains the pending promises and zero-delay timers, one cycle per attempt an actor under a retry
 * policy can make.
 */
export async function settle(cycles = 4): Promise<void> {
  for (let cycle = 0; cycle < cycles; cycle++) {
    await new Promise(resolve => {
      setTimeout(resolve, 0);
    });
  }
}
