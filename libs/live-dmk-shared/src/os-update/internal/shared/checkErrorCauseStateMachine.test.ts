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
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";
import { createActor, fromCallback, type Actor, type AnyEventObject } from "xstate";
import { checkErrorCauseStateMachine } from "./checkErrorCauseStateMachine";
import {
  DEVICE_CALL_TIMEOUT_MS,
  DISCOVERY_TIMEOUT_MS,
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
const NEW_DEVICE_ID = "new-device-id";
const TRANSPORT = "RN_BLE";

const CONNECTED_DEVICE: ConnectedDevice = {
  id: DEVICE_ID,
  sessionId: SESSION_ID,
  modelId: DeviceModelId.STAX,
  name: "Ledger Stax 123A",
  transport: TRANSPORT,
} as ConnectedDevice;

const REDISCOVERED_DEVICE: DiscoveredDevice = {
  id: NEW_DEVICE_ID,
  name: "123A",
  deviceModel: { id: NEW_DEVICE_ID, model: DeviceModelId.STAX, name: "Stax" },
  transport: TRANSPORT,
} as DiscoveredDevice;

const RECONNECTED_DEVICE: ConnectedDevice = {
  ...CONNECTED_DEVICE,
  id: NEW_DEVICE_ID,
  name: "123A",
};

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
  let stopDiscovering: jest.Mock;
  let getConnectedDevice: jest.Mock;
  let availableDevices$: Subject<DiscoveredDevice[]>;
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

  /** The device shows up again under a new address, and the session reopens on it. */
  const deviceComesBack = async () => {
    connect.mockResolvedValue(SESSION_ID);
    getConnectedDevice.mockReturnValue(RECONNECTED_DEVICE);
    availableDevices$.next([REDISCOVERED_DEVICE]);
    await settle();
  };

  const recovered = (connectedDevice: ConnectedDevice = CONNECTED_DEVICE) => ({
    result: CheckErrorCauseResult.Recovered,
    connectedDevice,
  });

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
    connect = jest.fn(async () => {
      throw new Error("device unavailable");
    });
    disconnect = jest.fn(async () => undefined);
    stopDiscovering = jest.fn(async () => undefined);
    getConnectedDevice = jest.fn(() => CONNECTED_DEVICE);
    availableDevices$ = new Subject();
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
      stopDiscovering,
      getConnectedDevice,
      listenToAvailableDevices: jest.fn(() => availableDevices$.asObservable()),
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

      expect(actor.getSnapshot().output).toEqual(recovered());
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
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
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
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
    });

    it("should report a disconnected device when the session state completes", async () => {
      await start();

      sessionState$.complete();
      await settle();

      expect(situations()).toEqual([DeviceSituation.DISCONNECTED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
    });

    it("should report a disconnected device when the session is already gone", async () => {
      getDeviceSessionState.mockImplementation(() => {
        throw DEVICE_SESSION_NOT_FOUND;
      });

      await start();

      expect(situations()).toEqual([DeviceSituation.DISCONNECTED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
    });

    it("should report a disconnected device when the settle timeout probe finds no session left", async () => {
      getAppAndVersion = () => failure(DEVICE_SESSION_NOT_FOUND);
      await start();

      await emitSessionStatus(DeviceStatus.CONNECTED);
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(situations()).toEqual([DeviceSituation.DISCONNECTED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
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

      expect(connect).not.toHaveBeenCalled();
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
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

      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
    });

    it("should give up on a transport that never confirms the disconnection", async () => {
      disconnect.mockImplementation(() => new Promise<void>(() => undefined));

      await start({ error: new DeviceDisconnectedWhileSendingError() });
      expect(connect).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(SESSION_TEARDOWN_TIMEOUT_MS);
      await settle();

      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
    });
  });

  describe("reconnection", () => {
    it("should reconnect under the same session id on the device discovery found", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });

      expect(connect).not.toHaveBeenCalled();

      await deviceComesBack();

      expect(connect).toHaveBeenCalledWith({
        device: expect.objectContaining({ id: NEW_DEVICE_ID, sessionId: SESSION_ID }),
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      expect(stopDiscovering).toHaveBeenCalled();
      expect(actor.getSnapshot().output).toEqual(recovered(RECONNECTED_DEVICE));
    });

    it("should retry discovery until the device shows up", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });

      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
      expect(connect).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(DISCOVERY_TIMEOUT_MS);
      await settle();
      expect(actor.getSnapshot().value).toEqual({
        AwaitingDeviceReconnection: "AwaitingDiscoveryRetry",
      });

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });

      await deviceComesBack();

      expect(actor.getSnapshot().output).toEqual(recovered(RECONNECTED_DEVICE));
    });

    it("should keep retrying when discovery fails", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });

      availableDevices$.error(new Error("bluetooth off"));
      await settle();

      await jest.advanceTimersByTimeAsync(DISCOVERY_TIMEOUT_MS);
      await settle();

      expect(actor.getSnapshot().value).toEqual({
        AwaitingDeviceReconnection: "AwaitingDiscoveryRetry",
      });
    });

    it("should keep looking for as long as the device stays out of discovery", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });

      await jest.advanceTimersByTimeAsync((DISCOVERY_TIMEOUT_MS + POLL_INTERVAL_MS) * 5);

      expect(connect).not.toHaveBeenCalled();
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
    });

    it("should discover again when connecting never settles", async () => {
      connect.mockImplementation(() => new Promise<string>(() => undefined));

      await start({ error: new DeviceDisconnectedWhileSendingError() });
      availableDevices$.next([REDISCOVERED_DEVICE]);
      await settle();
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Connecting" });

      await jest.advanceTimersByTimeAsync(DEVICE_CALL_TIMEOUT_MS);
      await settle();
      expect(actor.getSnapshot().value).toEqual({
        AwaitingDeviceReconnection: "AwaitingDiscoveryRetry",
      });

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(connect).toHaveBeenCalledTimes(1);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
    });

    it("should discover again when the connection is refused", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });
      availableDevices$.next([REDISCOVERED_DEVICE]);
      await settle();

      expect(actor.getSnapshot().value).toEqual({
        AwaitingDeviceReconnection: "AwaitingDiscoveryRetry",
      });

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });
    });

    it("should stop looking once the machine is stopped", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });

      actor.stop();
      availableDevices$.next([REDISCOVERED_DEVICE]);
      await settle();

      expect(connect).not.toHaveBeenCalled();
    });
  });

  describe("connection verification", () => {
    it("should ask the device for its app and version before reporting it back", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });
      await deviceComesBack();

      expect(appAndVersionCommandCalls()).toHaveLength(1);
      expect(actor.getSnapshot().output).toEqual(recovered(RECONNECTED_DEVICE));
    });

    // The transport hands its cached link back for as long as it hopes to reconnect over it, and
    // the session opened on top swallows its own ping, so connecting says nothing on its own.
    it("should keep waiting when the device does not answer over the link it just accepted", async () => {
      getAppAndVersion = () => failure(new DeviceDisconnectedWhileSendingError());

      await start({ error: new DeviceDisconnectedWhileSendingError() });
      await deviceComesBack();

      expect(situations()).toEqual([DeviceSituation.DISCONNECTED]);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Retrying" });
    });

    it("should close the unusable session and connect again once the device is found again", async () => {
      getAppAndVersion = () => failure(new DeviceDisconnectedWhileSendingError());
      await start({ error: new DeviceDisconnectedWhileSendingError() });
      await deviceComesBack();

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();
      expect(disconnect).toHaveBeenCalledTimes(2);
      expect(actor.getSnapshot().value).toEqual({ AwaitingDeviceReconnection: "Discovering" });

      await deviceComesBack();

      expect(connect).toHaveBeenCalledTimes(2);
    });

    it("should resolve Recovered once the device answers", async () => {
      getAppAndVersion = () => failure(new DeviceDisconnectedWhileSendingError());
      await start({ error: new DeviceDisconnectedWhileSendingError() });
      await deviceComesBack();

      getAppAndVersion = () => success(DASHBOARD_APP);
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();
      await deviceComesBack();

      expect(actor.getSnapshot().output).toEqual(recovered(RECONNECTED_DEVICE));
    });

    it("should start over when the device never answers the command", async () => {
      await start({ error: new DeviceDisconnectedWhileSendingError() });
      sendCommand.mockImplementation(() => new Promise(() => undefined));
      await deviceComesBack();

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

      expect(actor.getSnapshot().output).toEqual(recovered());
      expect(hostEvents).toHaveLength(0);
    });

    it("should resolve Unrecoverable when the probed error is neither a lock nor a disconnect", async () => {
      getAppAndVersion = () => failure(new UnknownDAError("boom"));
      await start();

      await emitSessionStatus(DeviceStatus.CONNECTED);
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(sessionStateUnsubscribe).toHaveBeenCalled();
      expect(actor.getSnapshot().output).toEqual({
        result: CheckErrorCauseResult.Unrecoverable,
      });
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
