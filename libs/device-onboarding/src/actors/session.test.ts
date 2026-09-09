import {
  DeviceStatus,
  type DeviceManagementKit,
  type DeviceSessionState,
} from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";
import { createActor, setup } from "xstate";
import { mapSession, sessionListener, type SessionEvent } from "./session";

describe("mapSession", () => {
  it.each([
    [DeviceStatus.CONNECTED, DeviceStatus.LOCKED, "LOCKED"],
    [DeviceStatus.LOCKED, DeviceStatus.CONNECTED, "UNLOCKED"],
    [DeviceStatus.CONNECTED, DeviceStatus.NOT_CONNECTED, "TRANSPORT_LOST"],
    [DeviceStatus.LOCKED, DeviceStatus.NOT_CONNECTED, "TRANSPORT_LOST"],
  ])("maps %s to %s as %s", (previous, next, type) => {
    expect(mapSession(previous, next)).toEqual({ type });
  });

  it.each([
    [undefined, DeviceStatus.CONNECTED],
    [undefined, DeviceStatus.LOCKED],
    [DeviceStatus.CONNECTED, DeviceStatus.CONNECTED],
    [DeviceStatus.LOCKED, DeviceStatus.LOCKED],
    [DeviceStatus.CONNECTED, DeviceStatus.BUSY],
    [DeviceStatus.BUSY, DeviceStatus.CONNECTED],
    [DeviceStatus.LOCKED, DeviceStatus.BUSY],
    [DeviceStatus.BUSY, DeviceStatus.LOCKED],
  ])("does not map %s to %s", (previous, next) => {
    expect(mapSession(previous, next)).toBeUndefined();
  });

  it("treats an initial disconnected status as transport loss", () => {
    expect(mapSession(undefined, DeviceStatus.NOT_CONNECTED)).toEqual({
      type: "TRANSPORT_LOST",
    });
  });
});

describe("sessionListener", () => {
  it("compares statuses against the last non-BUSY status", () => {
    const states = new Subject<DeviceSessionState>();
    const received: SessionEvent[] = [];
    const actor = createListenerActor(states, received);

    states.next(sessionState(DeviceStatus.CONNECTED));
    states.next(sessionState(DeviceStatus.BUSY));
    states.next(sessionState(DeviceStatus.LOCKED));
    states.next(sessionState(DeviceStatus.BUSY));
    states.next(sessionState(DeviceStatus.CONNECTED));

    expect(received).toEqual([{ type: "LOCKED" }, { type: "UNLOCKED" }]);
    actor.stop();
  });

  it.each(["completion", "error"] as const)("maps observable %s to transport loss", ending => {
    const states = new Subject<DeviceSessionState>();
    const received: SessionEvent[] = [];
    const actor = createListenerActor(states, received);

    if (ending === "completion") {
      states.complete();
    } else {
      states.error(new Error("transport failed"));
    }

    expect(received).toEqual([{ type: "TRANSPORT_LOST" }]);
    actor.stop();
  });

  it("reports transport loss once when disconnection is followed by completion", () => {
    const states = new Subject<DeviceSessionState>();
    const received: SessionEvent[] = [];
    const actor = createListenerActor(states, received);

    states.next(sessionState(DeviceStatus.CONNECTED));
    states.next(sessionState(DeviceStatus.NOT_CONNECTED));
    states.complete();

    expect(received).toEqual([{ type: "TRANSPORT_LOST" }]);
    actor.stop();
  });

  it("maps a synchronous subscription failure to transport loss", () => {
    const states = new Subject<DeviceSessionState>();
    const received: SessionEvent[] = [];
    const dmk = {
      getDeviceSessionState: jest.fn(() => {
        throw new Error("session not found");
      }),
    } as unknown as DeviceManagementKit;
    const actor = createListenerActor(states, received, dmk);

    expect(received).toEqual([{ type: "TRANSPORT_LOST" }]);
    actor.stop();
  });

  it("unsubscribes when the actor stops", () => {
    const states = new Subject<DeviceSessionState>();
    const actor = createListenerActor(states, []);

    expect(states.observed).toBe(true);
    actor.stop();
    expect(states.observed).toBe(false);
  });
});

function createListenerActor(
  states: Subject<DeviceSessionState>,
  received: SessionEvent[],
  dmk: DeviceManagementKit = {
    getDeviceSessionState: jest.fn(() => states.asObservable()),
  } as unknown as DeviceManagementKit,
) {
  const machine = setup({
    types: {
      events: {} as SessionEvent,
    },
    actors: {
      sessionListener,
    },
    actions: {
      capture: ({ event }) => received.push(event),
    },
  }).createMachine({
    invoke: {
      src: "sessionListener",
      input: { dmk, sessionId: "session" },
    },
    on: {
      LOCKED: { actions: "capture" },
      UNLOCKED: { actions: "capture" },
      TRANSPORT_LOST: { actions: "capture" },
    },
  });

  return createActor(machine).start();
}

function sessionState(deviceStatus: DeviceStatus): DeviceSessionState {
  return { deviceStatus } as DeviceSessionState;
}
