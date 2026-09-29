import type { DeviceManagementKit, DeviceSessionId } from "@ledgerhq/device-management-kit";
import { sessionListener, type SessionEvent } from "@ledgerhq/device-onboarding";
import { createActor, setup } from "xstate";

export function createSessionEventsActor(
  dmk: DeviceManagementKit,
  sessionId: DeviceSessionId,
  forward: (event: SessionEvent) => void,
) {
  const machine = setup({
    types: {
      events: {} as SessionEvent,
    },
    actors: {
      sessionListener,
    },
    actions: {
      forward: ({ event }) => forward(event),
    },
  }).createMachine({
    invoke: {
      src: "sessionListener",
      input: { dmk, sessionId },
    },
    on: {
      LOCKED: { actions: "forward" },
      UNLOCKED: { actions: "forward" },
      TRANSPORT_LOST: { actions: "forward" },
    },
  });

  return createActor(machine).start();
}
