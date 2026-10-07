import { DeviceStatus } from "@ledgerhq/device-management-kit";
import { createDeviceManagementKit } from "../tests/fakeDmk";
import { createSessionStream, type SessionStream } from "../tests/testStream";
import {
  createSessionEventsActor,
  mapSession,
  type SessionEvent,
  type SessionListenerInput,
} from "./session";

describe("mapSession", () => {
  it.each([
    [DeviceStatus.CONNECTED, DeviceStatus.LOCKED, "LOCKED"],
    [undefined, DeviceStatus.LOCKED, "LOCKED"],
    [DeviceStatus.LOCKED, DeviceStatus.CONNECTED, "UNLOCKED"],
    [DeviceStatus.CONNECTED, DeviceStatus.NOT_CONNECTED, "TRANSPORT_LOST"],
    [DeviceStatus.LOCKED, DeviceStatus.NOT_CONNECTED, "TRANSPORT_LOST"],
  ])("maps %s to %s as %s", (previous, next, type) => {
    expect(mapSession(previous, next)).toEqual({ type });
  });

  it.each([
    [undefined, DeviceStatus.CONNECTED],
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
  it("reports a session that is already locked", () => {
    const session = createSessionStream();
    const received: SessionEvent[] = [];
    const actor = createListenerActor(session, received);

    session.set(DeviceStatus.LOCKED);

    expect(received).toEqual([{ type: "LOCKED" }]);
    actor.stop();
  });

  it("compares statuses against the last non-BUSY status", () => {
    const session = createSessionStream();
    const received: SessionEvent[] = [];
    const actor = createListenerActor(session, received);

    session.set(DeviceStatus.CONNECTED);
    session.set(DeviceStatus.BUSY);
    session.set(DeviceStatus.LOCKED);
    session.set(DeviceStatus.BUSY);
    session.set(DeviceStatus.CONNECTED);

    expect(received).toEqual([{ type: "LOCKED" }, { type: "UNLOCKED" }]);
    actor.stop();
  });

  it.each(["completion", "error"] as const)("maps observable %s to transport loss", ending => {
    const session = createSessionStream();
    const received: SessionEvent[] = [];
    const actor = createListenerActor(session, received);

    if (ending === "completion") {
      session.end();
    } else {
      session.fail(new Error("transport failed"));
    }

    expect(received).toEqual([{ type: "TRANSPORT_LOST" }]);
    actor.stop();
  });

  it("reports transport loss once when disconnection is followed by completion", () => {
    const session = createSessionStream();
    const received: SessionEvent[] = [];
    const actor = createListenerActor(session, received);

    session.set(DeviceStatus.CONNECTED);
    session.set(DeviceStatus.NOT_CONNECTED);
    session.end();

    expect(received).toEqual([{ type: "TRANSPORT_LOST" }]);
    actor.stop();
  });

  it("maps a synchronous subscription failure to transport loss", () => {
    const session = createSessionStream();
    const received: SessionEvent[] = [];
    const dmk = createDeviceManagementKit({
      getDeviceSessionState: () => {
        throw new Error("session not found");
      },
    });
    const actor = createListenerActor(session, received, dmk);

    expect(received).toEqual([{ type: "TRANSPORT_LOST" }]);
    actor.stop();
  });

  it("unsubscribes when the actor stops", () => {
    const session = createSessionStream();
    const actor = createListenerActor(session, []);

    expect(session.watched).toBe(true);
    actor.stop();
    expect(session.watched).toBe(false);
  });
});

function createListenerActor(
  session: SessionStream,
  received: SessionEvent[],
  dmk: SessionListenerInput["dmk"] = sessionKit(session),
) {
  return createSessionEventsActor(dmk, "session", event => {
    received.push(event);
  });
}

function sessionKit(session: SessionStream) {
  return createDeviceManagementKit({
    getDeviceSessionState: () => session.events,
  });
}
