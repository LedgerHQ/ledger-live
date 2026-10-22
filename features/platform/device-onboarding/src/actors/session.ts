import {
  DeviceStatus,
  type DeviceManagementKit,
  type DeviceSessionId,
} from "@ledgerhq/device-management-kit";
import { createActor, fromCallback, setup } from "xstate";
import type { OnboardingEvent } from "../types";

export type SessionEvent = Extract<
  OnboardingEvent,
  { type: "LOCKED" | "UNLOCKED" | "TRANSPORT_LOST" }
>;

export type SessionListenerInput = {
  dmk: DeviceManagementKit;
  sessionId: DeviceSessionId;
};

export function mapSession(
  previous: DeviceStatus | undefined,
  next: DeviceStatus,
): SessionEvent | undefined {
  if (previous === DeviceStatus.BUSY || next === DeviceStatus.BUSY) {
    return undefined;
  }

  if (next === DeviceStatus.NOT_CONNECTED) {
    return { type: "TRANSPORT_LOST" };
  }

  if (previous === DeviceStatus.LOCKED && next === DeviceStatus.CONNECTED) {
    return { type: "UNLOCKED" };
  }

  if (previous !== DeviceStatus.LOCKED && next === DeviceStatus.LOCKED) {
    return { type: "LOCKED" };
  }

  if (previous === undefined) {
    return undefined;
  }

  return undefined;
}

export const sessionListener = fromCallback<SessionEvent, SessionListenerInput>(
  ({ input, sendBack }) => {
    let previous: DeviceStatus | undefined;
    let transportLost = false;

    const sendTransportLost = () => {
      if (!transportLost) {
        transportLost = true;
        sendBack({ type: "TRANSPORT_LOST" });
      }
    };

    let subscription: { unsubscribe(): void } | undefined;

    try {
      subscription = input.dmk.getDeviceSessionState({ sessionId: input.sessionId }).subscribe({
        next: state => {
          const next = state.deviceStatus;
          const event = mapSession(previous, next);

          if (next !== DeviceStatus.BUSY) {
            previous = next;
          }

          if (event?.type === "TRANSPORT_LOST") {
            sendTransportLost();
          } else if (event !== undefined) {
            sendBack(event);
          }
        },
        error: sendTransportLost,
        complete: sendTransportLost,
      });
    } catch {
      sendTransportLost();
    }

    return () => subscription?.unsubscribe();
  },
);

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
