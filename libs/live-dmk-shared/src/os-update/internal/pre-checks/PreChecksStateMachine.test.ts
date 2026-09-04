import {
  BatteryStatusType,
  DeviceActionStatus,
  DeviceDisconnectedWhileSendingError,
  DeviceLockedError,
  DeviceModelId,
  DeviceStatus,
  DmkResultStatus,
  UnknownDAError,
  UserInteractionRequired,
  type ConnectedDevice,
  type DeviceManagementKit,
  type DeviceSessionState,
} from "@ledgerhq/device-management-kit";
import type { Backup, OsUpdate } from "@ledgerhq/dmk-ledger-wallet";
import { Subject } from "rxjs";
import { createActor, fromCallback, type Actor, type AnyEventObject } from "xstate";
import { PreChecksStateType, type PreChecksState } from "../../api/model/PreChecksState";
import {
  OsUpdatesOrchestratorStateMachineEventType,
  type OsUpdatesOrchestratorStateMachineActorRef,
  type OsUpdatesOrchestratorStateMachineEvent,
} from "../orchestrator/types";
import { POLL_INTERVAL_MS, SESSION_SETTLE_TIMEOUT_MS } from "./constants";
import { preChecksStateMachine } from "./PreChecksStateMachine";
import { PreChecksNextAction, type PreChecksStateMachineInput } from "./types";

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
const ETHEREUM_APP = { name: "Ethereum", version: "1.10.4" };

const AN_OS_UPDATE = {} as OsUpdate;
const A_BACKUP = {} as Backup;

/** DMK keeps `DeviceSessionNotFound` internal, so it can only be matched by tag. */
const DEVICE_SESSION_NOT_FOUND = { _tag: "DeviceSessionNotFound" };

/** DMK does not export its `ChargingMode` enum: `NONE` is `0` and `USB` is `1`. */
const NOT_CHARGING = 0;
const CHARGING_OVER_USB = 1;

const success = (data: unknown) => ({ status: DmkResultStatus.Success, data });
const failure = (error: unknown) => ({ status: DmkResultStatus.Error, error });

const osVersion = (overrides: { isBootloader?: boolean; isOsu?: boolean } = {}) => ({
  isBootloader: false,
  isOsu: false,
  ...overrides,
});

const batteryFlags = (charging: number) => ({
  charging,
  issueCharging: false,
  issueTemperature: false,
  issueBattery: false,
});

type DeviceActionRun = {
  states: Subject<unknown>;
  cancel: jest.Mock;
};

type CommandResponders = {
  getOsVersion: () => unknown;
  getBatteryStatus: (statusType: BatteryStatusType) => unknown;
  getAppAndVersion: () => unknown;
};

describe("PreChecksStateMachine", () => {
  let deviceActionRuns: DeviceActionRun[];
  let responders: CommandResponders;
  let sendCommand: jest.Mock;
  let getBackup: jest.Mock;
  let getDeviceSessionState: jest.Mock;
  let listenToAvailableDevices: jest.Mock;
  let connect: jest.Mock;
  let sessionState$: Subject<DeviceSessionState>;
  let availableDevices$: Subject<Array<{ id: string }>>;
  let sessionStateUnsubscribe: jest.Mock;
  let availableDevicesUnsubscribe: jest.Mock;
  let parentEvents: OsUpdatesOrchestratorStateMachineEvent[];
  let parentRef: OsUpdatesOrchestratorStateMachineActorRef;
  let dmk: DeviceManagementKit;
  let actor: Actor<typeof preChecksStateMachine>;

  /** Flushes the microtask queue without firing any of the machine's delays. */
  const settle = async () => {
    for (let i = 0; i < 10; i++) {
      await jest.advanceTimersByTimeAsync(0);
    }
  };

  const start = (overrides: Partial<PreChecksStateMachineInput> = {}) => {
    actor = createActor(preChecksStateMachine, {
      input: {
        dmk,
        connectedDevice: CONNECTED_DEVICE,
        osUpdates: [AN_OS_UPDATE],
        storage: { getBackup },
        parentRef,
        ...overrides,
      },
    });
    actor.start();
    return settle();
  };

  const latestRun = () => deviceActionRuns[deviceActionRuns.length - 1];

  const emitPending = async (requiredUserInteraction: UserInteractionRequired) => {
    latestRun().states.next({
      status: DeviceActionStatus.Pending,
      intermediateValue: { requiredUserInteraction },
    });
    await settle();
  };

  const completeDeviceAction = async (output: unknown) => {
    const run = latestRun();
    run.states.next({ status: DeviceActionStatus.Completed, output });
    run.states.complete();
    await settle();
  };

  const failDeviceAction = async (error: unknown) => {
    const run = latestRun();
    run.states.next({ status: DeviceActionStatus.Error, error });
    run.states.complete();
    await settle();
  };

  const sentStates = (): PreChecksState[] =>
    parentEvents
      .filter(event => event.type === OsUpdatesOrchestratorStateMachineEventType.STATE_UPDATE)
      .map(event => event.state);

  const sentStateTypes = () => sentStates().map(state => state.type);

  const lastSentStateType = () => {
    const types = sentStateTypes();
    return types[types.length - 1];
  };

  const sentStatesOfType = <TType extends PreChecksStateType>(type: TType) =>
    sentStates().filter((state): state is Extract<PreChecksState, { type: TType }> =>
      Boolean(state.type === type),
    );

  const batteryCommandCalls = () =>
    sendCommand.mock.calls.filter(([{ command }]) => command.name === "getBatteryStatus");

  const appAndVersionCommandCalls = () =>
    sendCommand.mock.calls.filter(([{ command }]) => command.name === "getAppAndVersion");

  const emitSessionStatus = async (deviceStatus: DeviceStatus) => {
    sessionState$.next({ deviceStatus } as DeviceSessionState);
    await settle();
  };

  const emitAvailableDevices = async (...ids: string[]) => {
    availableDevices$.next(ids.map(id => ({ id })));
    await settle();
  };

  beforeEach(() => {
    jest.useFakeTimers();
    deviceActionRuns = [];
    responders = {
      getOsVersion: () => success(osVersion()),
      getBatteryStatus: statusType =>
        success(
          statusType === BatteryStatusType.BATTERY_PERCENTAGE ? 80 : batteryFlags(NOT_CHARGING),
        ),
      getAppAndVersion: () => success(DASHBOARD_APP),
    };
    sendCommand = jest.fn(async ({ command }) => {
      switch (command.name) {
        case "getOsVersion":
          return responders.getOsVersion();
        case "getBatteryStatus":
          return responders.getBatteryStatus(command.args.statusType);
        case "getAppAndVersion":
          return responders.getAppAndVersion();
        default:
          throw new Error(`Unexpected command: ${command.name}`);
      }
    });
    getBackup = jest.fn(async () => undefined);
    sessionState$ = new Subject<DeviceSessionState>();
    availableDevices$ = new Subject<Array<{ id: string }>>();
    sessionStateUnsubscribe = jest.fn();
    availableDevicesUnsubscribe = jest.fn();
    connect = jest.fn(async () => SESSION_ID);
    listenToAvailableDevices = jest.fn(() => ({
      subscribe: (observer: { next?: (devices: Array<{ id: string }>) => void }) => {
        const subscription = availableDevices$.subscribe(observer);
        return {
          unsubscribe: () => {
            availableDevicesUnsubscribe();
            subscription.unsubscribe();
          },
        };
      },
    }));
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
    parentEvents = [];
    const parentActor = createActor(
      fromCallback<AnyEventObject>(({ receive }) => {
        receive(event => parentEvents.push(event as OsUpdatesOrchestratorStateMachineEvent));
      }),
    );
    parentActor.start();
    parentRef = parentActor as unknown as OsUpdatesOrchestratorStateMachineActorRef;
    dmk = {
      executeDeviceAction: jest.fn(() => {
        const run: DeviceActionRun = {
          states: new Subject(),
          cancel: jest.fn(),
        };
        deviceActionRuns.push(run);
        return { observable: run.states.asObservable(), cancel: run.cancel };
      }),
      sendCommand,
      getDeviceSessionState,
      listenToAvailableDevices,
      connect,
    } as unknown as DeviceManagementKit;
  });

  afterEach(() => {
    actor?.stop();
    parentRef.stop?.();
    jest.useRealTimers();
  });

  describe("success", () => {
    it("should resolve PerformOsUpdates when the device is on the dashboard with a pending update and a charged battery", async () => {
      await start();

      await completeDeviceAction(DASHBOARD_APP);

      expect(actor.getSnapshot().status).toBe("done");
      expect(actor.getSnapshot().output).toBe(PreChecksNextAction.PerformOsUpdates);
    });

    it("should go through GoToDashboard and back to WaitForAppAndVersion when the running app is not the dashboard", async () => {
      await start();

      await completeDeviceAction(ETHEREUM_APP);
      expect(actor.getSnapshot().value).toBe("GoToDashboard");

      await completeDeviceAction(undefined);
      expect(actor.getSnapshot().value).toBe("WaitingForAppAndVersion");

      await completeDeviceAction(DASHBOARD_APP);
      expect(actor.getSnapshot().output).toBe(PreChecksNextAction.PerformOsUpdates);
    });

    it("should resolve PerformOsUpdates when the device is in bootloader mode even without a pending update", async () => {
      responders.getOsVersion = () => success(osVersion({ isBootloader: true }));
      await start({ osUpdates: [] });

      await completeDeviceAction(DASHBOARD_APP);

      expect(actor.getSnapshot().output).toBe(PreChecksNextAction.PerformOsUpdates);
      expect(getBackup).not.toHaveBeenCalled();
    });

    it("should resolve PerformOsUpdates when the device is in OSU mode even without a pending update", async () => {
      responders.getOsVersion = () => success(osVersion({ isOsu: true }));
      await start({ osUpdates: [] });

      await completeDeviceAction(DASHBOARD_APP);

      expect(actor.getSnapshot().output).toBe(PreChecksNextAction.PerformOsUpdates);
      expect(getBackup).not.toHaveBeenCalled();
    });

    it("should resolve PerformOsUpdates without reading the battery when the device model has none", async () => {
      await start({
        connectedDevice: { ...CONNECTED_DEVICE, modelId: DeviceModelId.NANO_SP },
      });

      await completeDeviceAction(DASHBOARD_APP);

      expect(actor.getSnapshot().output).toBe(PreChecksNextAction.PerformOsUpdates);
      expect(batteryCommandCalls()).toHaveLength(0);
    });

    it("should resolve RestoreBackup when there is no update to perform and a backup exists", async () => {
      getBackup.mockResolvedValue(A_BACKUP);
      await start({ osUpdates: [] });

      await completeDeviceAction(DASHBOARD_APP);

      expect(actor.getSnapshot().output).toBe(PreChecksNextAction.RestoreBackup);
      expect(getBackup).toHaveBeenCalledWith(DEVICE_ID);
    });

    it("should resolve Completed when there is no update to perform and no backup exists", async () => {
      await start({ osUpdates: [] });

      await completeDeviceAction(DASHBOARD_APP);

      expect(actor.getSnapshot().output).toBe(PreChecksNextAction.Completed);
    });

    it("should emit DEVICE_LOCKED only once while consecutive snapshots require unlocking", async () => {
      await start();

      await emitPending(UserInteractionRequired.UnlockDevice);
      await emitPending(UserInteractionRequired.UnlockDevice);
      await emitPending(UserInteractionRequired.UnlockDevice);

      expect(sentStatesOfType(PreChecksStateType.DEVICE_LOCKED)).toHaveLength(1);
      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_LOCKED);
    });

    it("should emit LOADING once the snapshot no longer requires unlocking", async () => {
      await start();

      await emitPending(UserInteractionRequired.UnlockDevice);
      await emitPending(UserInteractionRequired.None);

      expect(lastSentStateType()).toBe(PreChecksStateType.LOADING);
      expect(sentStatesOfType(PreChecksStateType.DEVICE_LOCKED)).toHaveLength(1);
    });

    it("should emit BATTERY_TOO_LOW only once while the percentage stays the same across polls", async () => {
      responders.getBatteryStatus = statusType =>
        success(
          statusType === BatteryStatusType.BATTERY_PERCENTAGE ? 10 : batteryFlags(NOT_CHARGING),
        );
      await start();
      await completeDeviceAction(DASHBOARD_APP);

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(batteryCommandCalls().length).toBeGreaterThan(2);
      expect(sentStatesOfType(PreChecksStateType.BATTERY_TOO_LOW)).toHaveLength(1);
    });

    it("should emit BATTERY_TOO_LOW again when the percentage changes between polls", async () => {
      let percentage = 10;
      responders.getBatteryStatus = statusType =>
        success(
          statusType === BatteryStatusType.BATTERY_PERCENTAGE
            ? percentage
            : batteryFlags(NOT_CHARGING),
        );
      await start();
      await completeDeviceAction(DASHBOARD_APP);

      percentage = 15;
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(
        sentStatesOfType(PreChecksStateType.BATTERY_TOO_LOW).map(
          ({ currentPercentage }) => currentPercentage,
        ),
      ).toEqual([10, 15]);
    });

    it("should resolve PerformOsUpdates when a battery poll reports the device is charging", async () => {
      let charging = NOT_CHARGING;
      responders.getBatteryStatus = statusType =>
        success(statusType === BatteryStatusType.BATTERY_PERCENTAGE ? 10 : batteryFlags(charging));
      await start();
      await completeDeviceAction(DASHBOARD_APP);
      expect(actor.getSnapshot().value).toBe("AwaitingChargingMode");

      charging = CHARGING_OVER_USB;
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(actor.getSnapshot().output).toBe(PreChecksNextAction.PerformOsUpdates);
    });

    it("should send STOP to the parent when cancel is called on the BATTERY_TOO_LOW state", async () => {
      responders.getBatteryStatus = statusType =>
        success(
          statusType === BatteryStatusType.BATTERY_PERCENTAGE ? 10 : batteryFlags(NOT_CHARGING),
        );
      await start();
      await completeDeviceAction(DASHBOARD_APP);

      sentStatesOfType(PreChecksStateType.BATTERY_TOO_LOW)[0].cancel();
      await settle();

      expect(parentEvents).toContainEqual({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
      expect(actor.getSnapshot().value).toBe("Canceled");
    });
  });

  describe("error", () => {
    it("should wait one second before probing GetAppAndVersion after a device-locked failure", async () => {
      responders.getAppAndVersion = () => failure(new DeviceLockedError());
      await start();

      await failDeviceAction(new DeviceLockedError());

      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_LOCKED);
      expect(actor.getSnapshot().value).toEqual({
        AwaitingDeviceUnlock: "Waiting",
      });
      expect(appAndVersionCommandCalls()).toHaveLength(0);

      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(appAndVersionCommandCalls()).toHaveLength(1);
      expect(actor.getSnapshot().value).toEqual({
        AwaitingDeviceUnlock: "Waiting",
      });
    });

    it("should emit LOADING and resume at WaitForAppAndVersion once the device is unlocked", async () => {
      responders.getAppAndVersion = () => failure(new DeviceLockedError());
      await start();
      await failDeviceAction(new DeviceLockedError());

      responders.getAppAndVersion = () => success(DASHBOARD_APP);
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(actor.getSnapshot().value).toBe("WaitingForAppAndVersion");
      expect(lastSentStateType()).toBe(PreChecksStateType.LOADING);
    });

    it("should resume at GetBatteryStatus when the device locked error came from that command", async () => {
      responders.getBatteryStatus = () => failure(new DeviceLockedError());
      responders.getAppAndVersion = () => failure(new DeviceLockedError());
      await start();
      await completeDeviceAction(DASHBOARD_APP);
      expect(actor.getSnapshot().value).toEqual({
        AwaitingDeviceUnlock: "Waiting",
      });

      responders.getAppAndVersion = () => success(DASHBOARD_APP);
      responders.getBatteryStatus = statusType =>
        success(
          statusType === BatteryStatusType.BATTERY_PERCENTAGE ? 90 : batteryFlags(NOT_CHARGING),
        );
      await jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);
      await settle();

      expect(actor.getSnapshot().output).toBe(PreChecksNextAction.PerformOsUpdates);
      expect(deviceActionRuns).toHaveLength(1);
    });

    it("should emit UNEXPECTED_ERROR when a command fails with a generic error that is neither lock nor disconnect", async () => {
      responders.getOsVersion = () => failure(new UnknownDAError("boom"));
      responders.getAppAndVersion = () => failure(new UnknownDAError("boom"));
      await start();

      await completeDeviceAction(DASHBOARD_APP);
      await emitSessionStatus(DeviceStatus.CONNECTED);

      expect(actor.getSnapshot().value).toBe("IdentifyConnectionLoss");
      expect(lastSentStateType()).not.toBe(PreChecksStateType.UNEXPECTED_ERROR);

      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(sessionStateUnsubscribe).toHaveBeenCalled();
      expect(actor.getSnapshot().value).toBe("UnrecoverableError");
      expect(lastSentStateType()).toBe(PreChecksStateType.UNEXPECTED_ERROR);
    });

    it("should emit UNEXPECTED_ERROR when a device action fails with a generic error that is neither lock nor disconnect", async () => {
      responders.getAppAndVersion = () => failure(new UnknownDAError("boom"));
      await start();

      await failDeviceAction(new UnknownDAError("boom"));
      await emitSessionStatus(DeviceStatus.CONNECTED);

      expect(actor.getSnapshot().value).toBe("IdentifyConnectionLoss");

      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(actor.getSnapshot().value).toBe("UnrecoverableError");
      expect(lastSentStateType()).toBe(PreChecksStateType.UNEXPECTED_ERROR);
    });

    it("should emit DEVICE_DISCONNECTED when a command fails with a disconnect tag", async () => {
      responders.getOsVersion = () => failure(new DeviceDisconnectedWhileSendingError());
      await start();

      await completeDeviceAction(DASHBOARD_APP);

      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_DISCONNECTED);
      expect(actor.getSnapshot().value).toBe("AwaitingDeviceReconnection");
    });

    it("should emit DEVICE_DISCONNECTED when the error is a disconnect tag without reading session status", async () => {
      await start();

      await failDeviceAction(new DeviceDisconnectedWhileSendingError());

      expect(getDeviceSessionState).not.toHaveBeenCalled();
      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_DISCONNECTED);
      expect(actor.getSnapshot().value).toBe("AwaitingDeviceReconnection");
    });

    it("should emit DEVICE_DISCONNECTED when a generic error is followed by NOT_CONNECTED before the settle timeout", async () => {
      await start();

      await failDeviceAction(new UnknownDAError("boom"));
      await emitSessionStatus(DeviceStatus.CONNECTED);
      expect(actor.getSnapshot().value).toBe("IdentifyConnectionLoss");

      await emitSessionStatus(DeviceStatus.NOT_CONNECTED);

      expect(sessionStateUnsubscribe).toHaveBeenCalled();
      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_DISCONNECTED);
      expect(actor.getSnapshot().value).toBe("AwaitingDeviceReconnection");
    });

    it("should keep the last sent state while identifying a connection loss", async () => {
      await start();

      await emitPending(UserInteractionRequired.UnlockDevice);
      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_LOCKED);

      await failDeviceAction(new UnknownDAError("boom"));

      expect(actor.getSnapshot().value).toBe("IdentifyConnectionLoss");
      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_LOCKED);
    });

    it("should emit DEVICE_DISCONNECTED when the session state completes before the settle timeout", async () => {
      await start();

      await failDeviceAction(new UnknownDAError("boom"));
      expect(actor.getSnapshot().value).toBe("IdentifyConnectionLoss");

      sessionState$.complete();
      await settle();

      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_DISCONNECTED);
      expect(actor.getSnapshot().value).toBe("AwaitingDeviceReconnection");
    });

    it("should emit DEVICE_DISCONNECTED when the session is already gone", async () => {
      getDeviceSessionState.mockImplementation(() => {
        throw DEVICE_SESSION_NOT_FOUND;
      });
      await start();

      await failDeviceAction(new UnknownDAError("boom"));

      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_DISCONNECTED);
      expect(actor.getSnapshot().value).toBe("AwaitingDeviceReconnection");
    });

    it("should emit DEVICE_DISCONNECTED when the settle timeout probe finds no session left", async () => {
      responders.getAppAndVersion = () => failure(DEVICE_SESSION_NOT_FOUND);
      await start();

      await failDeviceAction(new UnknownDAError("boom"));
      await emitSessionStatus(DeviceStatus.CONNECTED);
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_DISCONNECTED);
      expect(actor.getSnapshot().value).toBe("AwaitingDeviceReconnection");
    });

    it("should emit DEVICE_DISCONNECTED when a non device-locked error happens while disconnected", async () => {
      await start();

      await failDeviceAction(new UnknownDAError("boom"));
      await emitSessionStatus(DeviceStatus.NOT_CONNECTED);

      expect(sessionStateUnsubscribe).toHaveBeenCalled();
      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_DISCONNECTED);
      expect(actor.getSnapshot().value).toBe("AwaitingDeviceReconnection");
    });

    it("should emit DEVICE_LOCKED when the settle timeout probe returns a device-locked error", async () => {
      responders.getAppAndVersion = () => failure(new DeviceLockedError());
      await start();

      await failDeviceAction(new UnknownDAError("boom"));
      await emitSessionStatus(DeviceStatus.CONNECTED);
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_LOCKED);
      expect(actor.getSnapshot().value).toEqual({
        AwaitingDeviceUnlock: "Waiting",
      });
    });

    it("should resume the last action when the settle timeout probe succeeds", async () => {
      await start();

      await failDeviceAction(new UnknownDAError("boom"));
      await emitSessionStatus(DeviceStatus.CONNECTED);
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      expect(actor.getSnapshot().value).toBe("WaitingForAppAndVersion");
      expect(lastSentStateType()).toBe(PreChecksStateType.LOADING);
    });

    it("should ignore other devices and reconnect when the same device shows up", async () => {
      await start();
      await failDeviceAction(new UnknownDAError("boom"));
      await emitSessionStatus(DeviceStatus.NOT_CONNECTED);

      expect(listenToAvailableDevices).toHaveBeenCalledWith({ transport: TRANSPORT });

      await emitAvailableDevices("other-device");
      expect(connect).not.toHaveBeenCalled();
      expect(actor.getSnapshot().value).toBe("AwaitingDeviceReconnection");

      await emitAvailableDevices("other-device", DEVICE_ID);

      expect(connect).toHaveBeenCalledWith({
        device: expect.objectContaining({ id: DEVICE_ID, sessionId: SESSION_ID }),
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      expect(availableDevicesUnsubscribe).toHaveBeenCalled();
      expect(actor.getSnapshot().value).toBe("WaitingForAppAndVersion");
      expect(lastSentStateType()).toBe(PreChecksStateType.LOADING);
    });

    it("should keep the original session id after reconnecting", async () => {
      connect.mockResolvedValue("ignored-new-session-id");
      await start();
      await failDeviceAction(new UnknownDAError("boom"));
      await emitSessionStatus(DeviceStatus.NOT_CONNECTED);

      await emitAvailableDevices(DEVICE_ID);

      expect(actor.getSnapshot().context.connectedDevice.sessionId).toBe(SESSION_ID);
    });

    it("should try again on the next discovery when connecting fails", async () => {
      connect.mockRejectedValueOnce(new Error("connection refused"));
      await start();
      await failDeviceAction(new UnknownDAError("boom"));
      await emitSessionStatus(DeviceStatus.NOT_CONNECTED);

      await emitAvailableDevices(DEVICE_ID);
      expect(actor.getSnapshot().value).toBe("AwaitingDeviceReconnection");

      await emitAvailableDevices(DEVICE_ID);

      expect(connect).toHaveBeenCalledTimes(2);
      expect(actor.getSnapshot().value).toBe("WaitingForAppAndVersion");
    });

    it("should still reconnect if the device appears after a long wait", async () => {
      await start();
      await failDeviceAction(new UnknownDAError("boom"));
      await emitSessionStatus(DeviceStatus.NOT_CONNECTED);

      await jest.advanceTimersByTimeAsync(30_000);
      await settle();

      expect(lastSentStateType()).toBe(PreChecksStateType.DEVICE_DISCONNECTED);
      expect(actor.getSnapshot().value).toBe("AwaitingDeviceReconnection");
      expect(availableDevicesUnsubscribe).not.toHaveBeenCalled();

      await emitAvailableDevices(DEVICE_ID);

      expect(connect).toHaveBeenCalledTimes(1);
      expect(actor.getSnapshot().value).toBe("WaitingForAppAndVersion");
    });

    it("should emit UNEXPECTED_ERROR when reading the existing backup rejects", async () => {
      getBackup.mockRejectedValue(new Error("storage unavailable"));
      await start({ osUpdates: [] });

      await completeDeviceAction(DASHBOARD_APP);

      expect(actor.getSnapshot().value).toBe("UnrecoverableError");
      expect(lastSentStateType()).toBe(PreChecksStateType.UNEXPECTED_ERROR);
    });

    it("should send STOP to the parent when cancel is called on the UNEXPECTED_ERROR state", async () => {
      responders.getAppAndVersion = () => failure(new UnknownDAError("boom"));
      await start();
      await failDeviceAction(new UnknownDAError("boom"));
      await emitSessionStatus(DeviceStatus.CONNECTED);
      await jest.advanceTimersByTimeAsync(SESSION_SETTLE_TIMEOUT_MS);
      await settle();

      sentStatesOfType(PreChecksStateType.UNEXPECTED_ERROR)[0].cancel();
      await settle();

      expect(parentEvents).toContainEqual({
        type: OsUpdatesOrchestratorStateMachineEventType.STOP,
      });
      expect(actor.getSnapshot().value).toBe("Canceled");
    });
  });
});
