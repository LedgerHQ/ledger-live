import {
  DeviceDisconnectedWhileSendingError,
  DeviceLockedError,
  DeviceModelId,
  DeviceStatus,
  DmkResultStatus,
  UnknownDAError,
  type ConnectedDevice,
  type DeviceManagementKit,
  type DeviceSessionState,
} from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";
import { createActor, fromCallback, type Actor, type AnyEventObject } from "xstate";
import { checkErrorCauseStateMachine } from "./checkErrorCauseStateMachine";
import {
  DEVICE_CALL_TIMEOUT_MS,
  POLL_INTERVAL_MS,
  SESSION_SETTLE_TIMEOUT_MS,
  SESSION_TEARDOWN_TIMEOUT_MS,
} from "./constants";
import {
  CheckErrorCauseResult,
  DeviceSituation,
  DeviceSituationEventType,
  type CheckErrorCauseStateMachineInput,
  type DeviceSituationActorRef,
  type DeviceSituationEvent,
} from "./types";

const SESSION_ID = "session-id";
const DEVICE_ID = "device-id";
const TRANSPORT = "RN_BLE";

const CONNECTED_DEVICE: ConnectedDevice = {
  id: DEVICE_ID,
  sessionId: SESSION_ID,
  modelId: DeviceModelId.STAX,
  transport: TRANSPORT,
} as ConnectedDevice;

const DASHBOARD_APP = { name: "BOLOS", version: "2.2.3" };

/** DMK keeps `DeviceSessionNotFound` internal, so it can only be matched by tag. */
const DEVICE_SESSION_NOT_FOUND = { _tag: "DeviceSessionNotFound" };

const success = (data: unknown) => ({ status: DmkResultStatus.Success, data });
const failure = (error: unknown) => ({ status: DmkResultStatus.Error, error });

describe("checkErrorCauseStateMachine", () => {
  let getAppAndVersion: () => unknown;
  let sendCommand: jest.Mock;
  let getDeviceSessionState: jest.Mock;
  let connect: jest.Mock;
  let disconnect: jest.Mock;
  let sessionState$: Subject<DeviceSessionState>;
  let sessionStateUnsubscribe: jest.Mock;
  let hostEvents: DeviceSituationEvent[];
  let hostRef: DeviceSituationActorRef;
  let dmk: DeviceManagementKit;
  let actor: Actor<typeof checkErrorCauseStateMachine>;

  /** Flushes the microtask queue without firing any of the machine's delays. */
  const settle = async () => {
    for (let i = 0; i < 10; i++) {
      await jest.advanceTimersByTimeAsync(0);
    }
  };

  const start = (overrides: Partial<CheckErrorCauseStateMachineInput> = {}) => {
    actor = createActor(checkErrorCauseStateMachine, {
      input: {
        dmk,
        connectedDevice: CONNECTED_DEVICE,
        error: new UnknownDAError("boom"),
        hostRef,
        ...overrides,
      },
    });
    actor.start();
    return settle();
  };

  const appAndVersionCommandCalls = () =>
    sendCommand.mock.calls.filter(([{ command }]) => command.name === "getAppAndVersion");

  const emitSessionStatus = async (deviceStatus: DeviceStatus) => {
    sessionState$.next({ deviceStatus } as DeviceSessionState);
    await settle();
  };

  /** The device accepts connections again, as it would once it is back within reach. */
  const deviceComesBack = () => connect.mockResolvedValue(SESSION_ID);

  const situations = () => hostEvents.map(event => event.situation);

  beforeEach(() => {
    jest.useFakeTimers();
    getAppAndVersion = () => success(DASHBOARD_APP);
    sendCommand = jest.fn(async ({ command }) => {
      if (command.name !== "getAppAndVersion") {
        throw new Error(`Unexpected command: ${command.name}`);
      }
      return getAppAndVersion();
    });
    sessionState$ = new Subject<DeviceSessionState>();
    sessionStateUnsubscribe = jest.fn();
    // A device that just dropped refuses connections until it is back: tests that cover the
    // recovery opt in with `deviceComesBack`.
    connect = jest.fn(async () => {
      throw new Error("device unavailable");
    });
    disconnect = jest.fn(async () => undefined);
    getDeviceSessionState = jest.fn(() => ({
      subscribe: (observer: {
        next?: (state: DeviceSessionState) => void;
        error?: (error: unknown) => void;
        complete?: () => void;
      }) => {
        const subscription = sessionState$.subscribe(observer);
        return {
          unsubscribe: () => {
            sessionStateUnsubscribe();
            subscription.unsubscribe();
          },
        };
      },
    }));
    hostEvents = [];
    const hostActor = createActor(
      fromCallback<AnyEventObject>(({ receive }) => {
        receive(event => hostEvents.push(event as DeviceSituationEvent));
      }),
    );
    hostActor.start();
    hostRef = hostActor as unknown as DeviceSituationActorRef;
    dmk = {
      sendCommand,
      getDeviceSessionState,
      connect,
      disconnect,
    } as unknown as DeviceManagementKit;
  });

  afterEach(() => {
    actor?.stop();
    jest.useRealTimers();
    jest.clearAllTimers();
  });

  describe("device locked", () => {
    it("should report a locked device and wait one second before probing", async () => {
      getAppAndVersion = () => failure(new DeviceLockedError());

      await start({ error: new DeviceLockedError() });

      expect(situations()).toEqual([DeviceSituation.LOCKED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceUnlock: "Waiting" });
      expect(appAndVersionCommandCalls()).toHaveLength(0);

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(appAndVersionCommandCalls()).toHaveLength(1);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceUnlock: "Waiting" });
    });

    it("should resolve Recovered once the device is unlocked", async () => {
      getAppAndVersion = () => failure(new DeviceLockedError());
      await start({ error: new DeviceLockedError() });

      getAppAndVersion = () => success(DASHBOARD_APP);
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(actor.getSnapshot().output).toBe(CheckErrorCauseResult.Recovered);
    });

    it("should report a locked device when the settle timeout probe returns a device-locked error", async () => {
      getAppAndVersion = () => failure(new DeviceLockedError());
      await start();

      await emitSessionStatus(DeviceStatus.CONNECTED);
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(situations()).toEqual([DeviceSituation.LOCKED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceUnlock: "Waiting" });
    });

    // Every failed probe re-enters AwaitingDeviceUnlock, so the situation is reported again.
    // Collapsing consecutive reports is the host's job, through its own state deduplication.
    it("should keep reporting the locked device while it stays locked across polls", async () => {
      getAppAndVersion = () => failure(new DeviceLockedError());
      await start({ error: new DeviceLockedError() });

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(appAndVersionCommandCalls().length).toBeGreaterThan(1);
      expect(situations()).toEqual([
        DeviceSituation.LOCKED,
        DeviceSituation.LOCKED,
        DeviceSituation.LOCKED,
      ]);
    });
  });

  describe("device disconnected", () => {
    it("should report a disconnected device without reading the session status", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });

      expect(getDeviceSessionState).not.toHaveBeenCalled();
      expect(situations()).toEqual([DeviceSituation.DISCONNECTED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Reconnecting" });
    });

    it("should stay silent while identifying a connection loss", async () => {
      await start();

      await emitSessionStatus(DeviceStatus.CONNECTED);

      expect(actor.getSnapshot().value).toBe("IdentifyConnectionLoss");
      expect(hostEvents).toHaveLength(0);
    });

    it("should report a disconnected device when the session reports NOT_CONNECTED before the settle timeout", async () => {
      await start();

      await emitSessionStatus(DeviceStatus.NOT_CONNECTED);

      expect(sessionStateUnsubscribe).toHaveBeenCalled();
      expect(situations()).toEqual([DeviceSituation.DISCONNECTED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Reconnecting" });
    });

    it("should report a disconnected device when the session state completes", async () => {
      await start();

      sessionState$.complete();
      await settle();

      expect(situations()).toEqual([DeviceSituation.DISCONNECTED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Reconnecting" });
    });

    it("should report a disconnected device when the session is already gone", async () => {
      getDeviceSessionState.mockImplementation(() => {
        throw DEVICE_SESSION_NOT_FOUND;
      });

      await start();

      expect(situations()).toEqual([DeviceSituation.DISCONNECTED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Reconnecting" });
    });

    it("should report a disconnected device when the settle timeout probe finds no session left", async () => {
      getAppAndVersion = () => failure(DEVICE_SESSION_NOT_FOUND);
      await start();

      await emitSessionStatus(DeviceStatus.CONNECTED);
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(situations()).toEqual([DeviceSituation.DISCONNECTED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Reconnecting" });
    });
  });

  describe("session teardown", () => {
    it("should close the session before trying to connect again", async () => {
      let resolveDisconnect!: () => void;
      disconnect.mockImplementation(
        () =>
          new Promise<void>(resolve => {
            resolveDisconnect = resolve;
          }),
      );

      await start({ error: new DeviceDisconnectedWhileSendingError() });

      expect(disconnect).toHaveBeenCalledWith({ sessionId: SESSION_ID });
      expect(connect).not.toHaveBeenCalled();
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "TearDownSession" });

      resolveDisconnect();
      await settle();

      expect(connect).toHaveBeenCalled();
    });

    // Reconnecting over the link the transport still holds hands back a session that looks healthy
    // and breaks again on the next device action, so the teardown runs on every path.
    it("should close the session even when the transport already reported the loss", async () => {
      await start();

      await emitSessionStatus(DeviceStatus.NOT_CONNECTED);

      expect(disconnect).toHaveBeenCalledWith({ sessionId: SESSION_ID });
    });

    it("should try to connect again when the session was already gone", async () => {
      disconnect.mockRejectedValue(DEVICE_SESSION_NOT_FOUND);

      await start({ error: new DeviceDisconnectedWhileSendingError() });

      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Reconnecting" });
    });

    it("should give up on a transport that never confirms the disconnection", async () => {
      disconnect.mockImplementation(() => new Promise<void>(() => undefined));

      await start({ error: new DeviceDisconnectedWhileSendingError() });
      expect(connect).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(SESSION_TEARDOWN_TIMEOUT_MS);
      await settle();

      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Reconnecting" });
    });
  });

  describe("reconnection", () => {
    it("should reconnect with the captured device so the DMK reuses its session id", async () => {
      deviceComesBack();

      await start({ error: new DeviceDisconnectedWhileSendingError() });

      expect(connect).toHaveBeenCalledWith({
        device: expect.objectContaining({ id: DEVICE_ID, sessionId: SESSION_ID }),
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      expect(actor.getSnapshot().output).toBe(CheckErrorCauseResult.Recovered);
    });

    // The transport holds the link while it runs its own reconnection, which keeps the device from
    // advertising. Retrying the connection is the only way to find out that it is reachable again.
    it("should retry until the device accepts the connection", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });

      expect(connect).toHaveBeenCalledTimes(1);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Reconnecting" });

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      expect(connect).toHaveBeenCalledTimes(2);

      deviceComesBack();
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

      expect(actor.getSnapshot().output).toBe(CheckErrorCauseResult.Recovered);
    });

    it("should keep retrying for as long as the device stays unreachable", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 30);

      expect(connect.mock.calls.length).toBeGreaterThan(10);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Reconnecting" });
    });

    // The DMK waits for a session ping the dead link never answers, and a call left pending would
    // otherwise be the end of the polling.
    it("should try again when connecting never settles", async () => {
      connect.mockImplementation(() => new Promise<string>(() => undefined));

      await start({ error: new DeviceDisconnectedWhileSendingError() });
      expect(connect).toHaveBeenCalledTimes(1);

      await jest.advanceTimersByTimeAsync(DEVICE_CALL_TIMEOUT_MS + POLL_INTERVAL_MS);

      expect(connect).toHaveBeenCalledTimes(2);
    });

    it("should keep bounding the current attempt when an earlier one settles late", async () => {
      let failFirstAttempt!: () => void;
      connect
        .mockImplementationOnce(
          () =>
            new Promise<string>((_resolve, reject) => {
              failFirstAttempt = () => reject(new Error("device unavailable"));
            }),
        )
        .mockImplementation(() => new Promise<string>(() => undefined));

      await start({ error: new DeviceDisconnectedWhileSendingError() });
      await jest.advanceTimersByTimeAsync(DEVICE_CALL_TIMEOUT_MS + POLL_INTERVAL_MS);
      expect(connect).toHaveBeenCalledTimes(2);

      failFirstAttempt();
      await settle();

      await jest.advanceTimersByTimeAsync(DEVICE_CALL_TIMEOUT_MS + POLL_INTERVAL_MS);

      expect(connect).toHaveBeenCalledTimes(3);
    });

    it("should stop retrying once the machine is stopped", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      const callsBeforeStop = connect.mock.calls.length;

      actor.stop();
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS * 5);

      expect(connect).toHaveBeenCalledTimes(callsBeforeStop);
    });
  });

  describe("connection verification", () => {
    it("should ask the device for its app and version before reporting it back", async () => {
      deviceComesBack();

      await start({ error: new DeviceDisconnectedWhileSendingError() });

      expect(appAndVersionCommandCalls()).toHaveLength(1);
      expect(actor.getSnapshot().output).toBe(CheckErrorCauseResult.Recovered);
    });

    // The transport hands its cached link back for as long as it hopes to reconnect over it, and
    // the session opened on top swallows its own ping, so connecting says nothing on its own.
    it("should keep waiting when the device does not answer over the link it just accepted", async () => {
      deviceComesBack();
      getAppAndVersion = () => failure(new DeviceDisconnectedWhileSendingError());

      await start({ error: new DeviceDisconnectedWhileSendingError() });

      expect(situations()).toEqual([DeviceSituation.DISCONNECTED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Retrying" });
    });

    it("should close the unusable session and connect again on the next poll", async () => {
      deviceComesBack();
      getAppAndVersion = () => failure(new DeviceDisconnectedWhileSendingError());
      await start({ error: new DeviceDisconnectedWhileSendingError() });

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(disconnect).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenCalledTimes(2);
    });

    it("should resolve Recovered once the device answers", async () => {
      deviceComesBack();
      getAppAndVersion = () => failure(new DeviceDisconnectedWhileSendingError());
      await start({ error: new DeviceDisconnectedWhileSendingError() });

      getAppAndVersion = () => success(DASHBOARD_APP);
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(actor.getSnapshot().output).toBe(CheckErrorCauseResult.Recovered);
    });

    it("should start over when the device never answers the command", async () => {
      deviceComesBack();
      sendCommand.mockImplementation(() => new Promise(() => undefined));

      await start({ error: new DeviceDisconnectedWhileSendingError() });
      expect(actor.getSnapshot().value).toEqual({
        AwaitingDeviceReconnection: "VerifyingConnection",
      });

      await jest.advanceTimersByTimeAsync(DEVICE_CALL_TIMEOUT_MS);
      await settle();

      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Retrying" });
    });
  });

  describe("resolution", () => {
    it("should resolve Recovered when the settle timeout probe succeeds", async () => {
      await start();

      await emitSessionStatus(DeviceStatus.CONNECTED);
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(actor.getSnapshot().output).toBe(CheckErrorCauseResult.Recovered);
      expect(hostEvents).toHaveLength(0);
    });

    it("should resolve Unrecoverable when the probed error is neither a lock nor a disconnect", async () => {
      getAppAndVersion = () => failure(new UnknownDAError("boom"));
      await start();

      await emitSessionStatus(DeviceStatus.CONNECTED);
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(sessionStateUnsubscribe).toHaveBeenCalled();
      expect(actor.getSnapshot().output).toBe(CheckErrorCauseResult.Unrecoverable);
      expect(hostEvents).toHaveLength(0);
    });

    it("should report the device situation to its host as a DEVICE_SITUATION_UPDATE event", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });

      expect(hostEvents).toEqual([
        {
          type: DeviceSituationEventType.DEVICE_SITUATION_UPDATE,
          situation: DeviceSituation.DISCONNECTED,
        },
      ]);
    });
  });
});
