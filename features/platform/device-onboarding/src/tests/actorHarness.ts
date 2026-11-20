import { createActor, sendTo, setup, type AnyActorLogic, type EventObject } from "xstate";

export type RunningActor<TEvent> = {
  received: TEvent[];
  send(event: { type: "PAUSE" } | { type: "RESUME" }): void;
  stop(): void;
};

/**
 * Invokes an actor from a machine that captures whatever it sends back, since a callback actor only
 * reports through its parent.
 */
type ActorCommand = { type: "PAUSE" } | { type: "RESUME" };

export function runActor<TEvent extends EventObject>(
  actor: AnyActorLogic,
  input: unknown,
): RunningActor<TEvent> {
  const received: TEvent[] = [];

  const machine = setup({
    types: { events: {} as TEvent | ActorCommand },
    actors: { actor },
    actions: {
      capture: ({ event }) => {
        if (event.type === "PAUSE" || event.type === "RESUME" || event.type.startsWith("xstate.")) {
          return;
        }
        received.push(event as TEvent);
      },
      forward: sendTo("actor", ({ event }) => event),
    },
  }).createMachine({
    invoke: { id: "actor", src: "actor", input },
    on: {
      PAUSE: { actions: "forward" },
      RESUME: { actions: "forward" },
      "*": { actions: "capture" },
    },
  });

  const running = createActor(machine).start();

  return {
    received,
    send: event => running.send(event),
    stop: () => running.stop(),
  };
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
