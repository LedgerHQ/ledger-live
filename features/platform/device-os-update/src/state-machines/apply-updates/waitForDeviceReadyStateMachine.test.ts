import {
  DeviceDisconnectedWhileSendingError,
  DeviceModelId,
  DmkResultStatus,
  type ConnectedDevice,
  type DeviceManagementKit,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import { Subject } from "rxjs";
import { createActor, type Actor } from "xstate";
import {
  DEVICE_CALL_TIMEOUT_MS,
  DISCOVERY_TIMEOUT_MS,
  POLL_INTERVAL_MS,
} from "../shared/constants";
import { REBOOT_SETTLE_DELAY_MS } from "./constants";
import { DeviceReadyTarget, type WaitForDeviceReadyOutput } from "./types";
import { waitForDeviceReadyStateMachine } from "./waitForDeviceReadyStateMachine";

const SESSION_ID = "session-id";
const DEVICE_ID = "device-id";
const NEW_DEVICE_ID = "new-device-id";

const BLE_DEVICE: ConnectedDevice = {
  id: DEVICE_ID,
  sessionId: SESSION_ID,
  modelId: DeviceModelId.STAX,
  name: "Ledger Stax 123A",
  transport: "RN_BLE",
} as ConnectedDevice;

const USB_DEVICE: ConnectedDevice = {
  ...BLE_DEVICE,
  transport: "RN_HID",
} as ConnectedDevice;

const RENAMED_DEVICE: DiscoveredDevice = {
  id: NEW_DEVICE_ID,
  name: "123A",
  deviceModel: { id: NEW_DEVICE_ID, model: DeviceModelId.STAX, name: "Stax" },
  transport: "RN_BLE",
} as DiscoveredDevice;

const REENUMERATED_DEVICE: DiscoveredDevice = {
  id: NEW_DEVICE_ID,
  name: "",
  deviceModel: { id: NEW_DEVICE_ID, model: DeviceModelId.STAX, name: "Stax" },
  transport: "RN_HID",
} as DiscoveredDevice;

const success = (data: unknown) => ({ status: DmkResultStatus.Success, data });
const failure = (error: unknown) => ({ status: DmkResultStatus.Error, error });

const osVersion = (overrides: { isBootloader?: boolean; isOsu?: boolean } = {}) => ({
  isBootloader: false,
  isOsu: false,
  ...overrides,
});

describe("waitForDeviceReadyStateMachine", () => {
  let sendCommand: jest.Mock;
  let connect: jest.Mock;
  let disconnect: jest.Mock;
  let stopDiscovering: jest.Mock;
  let getConnectedDevice: jest.Mock;
  let availableDevices$: Subject<DiscoveredDevice[]>;
  let dmk: DeviceManagementKit;
  let actor: Actor<typeof waitForDeviceReadyStateMachine>;

  /** Flushes the microtask queue without firing any of the machine's delays. */
  const settle = async () => {
    for (let i = 0; i < 10; i++) {
      await jest.advanceTimersByTimeAsync(0);
    }
  };

  const start = (
    target: DeviceReadyTarget,
    connectedDevice: ConnectedDevice = BLE_DEVICE,
  ): Promise<void> => {
    actor = createActor(waitForDeviceReadyStateMachine, {
      input: { dmk, connectedDevice, target },
    });
    actor.start();
    return settle();
  };

  /** Lets the settle delay elapse so the session is torn down and discovery starts. */
  const reachDiscovery = async () => {
    await jest.advanceTimersByTimeAsync(REBOOT_SETTLE_DELAY_MS);
    await settle();
  };

  /** Completes the rediscovery and reconnection that every wait starts with. */
  const reconnect = async (
    discoveredDevice: DiscoveredDevice = RENAMED_DEVICE,
    reconnectedDevice: ConnectedDevice = { ...BLE_DEVICE, id: NEW_DEVICE_ID, name: "123A" },
  ) => {
    getConnectedDevice.mockReturnValue(reconnectedDevice);
    availableDevices$.next([discoveredDevice]);
    await settle();
  };

  const nextPoll = () => jest.advanceTimersByTimeAsync(POLL_INTERVAL_MS);

  const output = () => actor.getSnapshot().output as WaitForDeviceReadyOutput | undefined;

  beforeEach(() => {
    jest.useFakeTimers();
    sendCommand = jest.fn(async () => success(osVersion()));
    connect = jest.fn(async () => SESSION_ID);
    disconnect = jest.fn(async () => undefined);
    stopDiscovering = jest.fn(async () => undefined);
    getConnectedDevice = jest.fn(() => BLE_DEVICE);
    availableDevices$ = new Subject();
    dmk = {
      sendCommand,
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
  });

  describe("reconnection", () => {
    it("should not touch the device before the reboot had time to settle", async () => {
      await start(DeviceReadyTarget.AnyResponse);

      expect(disconnect).not.toHaveBeenCalled();
      expect(sendCommand).not.toHaveBeenCalled();

      await reachDiscovery();

      expect(disconnect).toHaveBeenCalledWith({ sessionId: SESSION_ID });
      expect(sendCommand).not.toHaveBeenCalled();
    });

    it("should rediscover a USB device that came back under a new uid", async () => {
      const reconnected = { ...USB_DEVICE, id: NEW_DEVICE_ID };
      await start(DeviceReadyTarget.AnyResponse, USB_DEVICE);
      await reachDiscovery();

      expect(disconnect).toHaveBeenCalledWith({ sessionId: SESSION_ID });
      expect(connect).not.toHaveBeenCalled();

      await reconnect(REENUMERATED_DEVICE, reconnected);

      expect(connect).toHaveBeenCalledWith({
        device: expect.objectContaining({
          id: NEW_DEVICE_ID,
          sessionId: SESSION_ID,
        }),
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
    });

    it("should rediscover a BLE device that came back under a new address and name", async () => {
      await start(DeviceReadyTarget.AnyResponse);
      await reachDiscovery();
      await reconnect();

      expect(connect).toHaveBeenCalledWith({
        device: expect.objectContaining({
          id: NEW_DEVICE_ID,
          sessionId: SESSION_ID,
        }),
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      expect(stopDiscovering).toHaveBeenCalled();
    });

    it("should read again on the reconnected device rather than trust the connection", async () => {
      const reconnected = { ...BLE_DEVICE, id: NEW_DEVICE_ID, name: "123A" };
      sendCommand.mockResolvedValue(success(osVersion({ isBootloader: true })));

      await start(DeviceReadyTarget.AnyResponse);
      await reachDiscovery();
      await reconnect(RENAMED_DEVICE, reconnected);

      expect(sendCommand).toHaveBeenCalledTimes(1);
      expect(actor.getSnapshot().status).toBe("done");
      expect(output()).toEqual({
        osVersion: osVersion({ isBootloader: true }),
        connectedDevice: reconnected,
      });
    });

    it("should carry on when the transport never confirms the disconnection", async () => {
      disconnect.mockImplementation(() => new Promise(() => {}));

      await start(DeviceReadyTarget.AnyResponse, USB_DEVICE);
      await reachDiscovery();
      availableDevices$.next([REENUMERATED_DEVICE]);
      await settle();

      expect(connect).not.toHaveBeenCalled();

      await jest.advanceTimersByTimeAsync(DEVICE_CALL_TIMEOUT_MS);
      availableDevices$.next([REENUMERATED_DEVICE]);
      await settle();

      expect(connect).toHaveBeenCalled();
    });

    it("should keep discovering when the device cannot be connected to again", async () => {
      connect.mockRejectedValue(new Error("connect failed"));

      await start(DeviceReadyTarget.AnyResponse, USB_DEVICE);
      await reachDiscovery();
      availableDevices$.next([REENUMERATED_DEVICE]);
      await settle();

      expect(connect).toHaveBeenCalled();
      expect(actor.getSnapshot().value).toEqual({
        Reconnecting: "AwaitingDiscoveryRetry",
      });

      await nextPoll();

      expect(actor.getSnapshot().value).toEqual({ Reconnecting: "Discovering" });
      expect(sendCommand).not.toHaveBeenCalled();
    });

    it("should keep retrying when discovery fails", async () => {
      await start(DeviceReadyTarget.AnyResponse);
      await reachDiscovery();

      availableDevices$.error(new Error("bluetooth off"));
      await settle();

      await jest.advanceTimersByTimeAsync(DISCOVERY_TIMEOUT_MS);
      await settle();

      expect(actor.getSnapshot().value).toEqual({
        Reconnecting: "AwaitingDiscoveryRetry",
      });
    });

    it("should keep discovering when a device never shows up", async () => {
      await start(DeviceReadyTarget.AnyResponse);
      await reachDiscovery();
      await jest.advanceTimersByTimeAsync(DISCOVERY_TIMEOUT_MS);
      await settle();

      expect(connect).not.toHaveBeenCalled();
      expect(stopDiscovering).toHaveBeenCalled();
      expect(actor.getSnapshot().value).toEqual({
        Reconnecting: "AwaitingDiscoveryRetry",
      });

      await nextPoll();

      expect(actor.getSnapshot().value).toEqual({ Reconnecting: "Discovering" });
    });
  });

  describe("polling", () => {
    it("should resolve on any answer when the caller branches on the result itself", async () => {
      sendCommand.mockResolvedValue(success(osVersion({ isOsu: true })));

      await start(DeviceReadyTarget.AnyResponse);
      await reachDiscovery();
      await reconnect();

      expect(output()?.osVersion).toEqual(osVersion({ isOsu: true }));
    });

    it("should wait for a device that is neither in bootloader nor in OSU mode", async () => {
      sendCommand.mockResolvedValue(success(osVersion({ isOsu: true })));

      await start(DeviceReadyTarget.UpdatedOs);
      await reachDiscovery();
      await reconnect();

      expect(actor.getSnapshot().status).toBe("active");

      sendCommand.mockResolvedValue(success(osVersion()));
      await nextPoll();

      expect(actor.getSnapshot().status).toBe("done");
    });

    it("should reconnect when the device answers with a disconnect", async () => {
      sendCommand.mockResolvedValueOnce(failure(new DeviceDisconnectedWhileSendingError()));

      await start(DeviceReadyTarget.AnyResponse);
      await reachDiscovery();
      await reconnect();

      expect(actor.getSnapshot().value).toEqual({ Reconnecting: "Discovering" });
      expect(disconnect).toHaveBeenCalledTimes(2);
    });

    it("should poll again when the device answers with another error", async () => {
      sendCommand.mockResolvedValueOnce(failure(new Error("command failed")));

      await start(DeviceReadyTarget.AnyResponse, USB_DEVICE);
      await reachDiscovery();
      await reconnect(REENUMERATED_DEVICE, { ...USB_DEVICE, id: NEW_DEVICE_ID });

      expect(actor.getSnapshot().value).toBe("Waiting");
      expect(disconnect).toHaveBeenCalledTimes(1);

      await nextPoll();

      expect(sendCommand).toHaveBeenCalledTimes(2);
      expect(disconnect).toHaveBeenCalledTimes(1);
    });

    it("should poll again rather than reconnect when the read fails on anything else", async () => {
      sendCommand.mockRejectedValueOnce(new Error("command failed"));

      await start(DeviceReadyTarget.AnyResponse, USB_DEVICE);
      await reachDiscovery();
      await reconnect(REENUMERATED_DEVICE, { ...USB_DEVICE, id: NEW_DEVICE_ID });

      expect(actor.getSnapshot().value).toBe("Waiting");
      expect(disconnect).toHaveBeenCalledTimes(1);

      await nextPoll();

      expect(sendCommand).toHaveBeenCalledTimes(2);
      expect(disconnect).toHaveBeenCalledTimes(1);
    });

    it("should reconnect when a later read fails with a disconnect", async () => {
      sendCommand
        .mockRejectedValueOnce(new DeviceDisconnectedWhileSendingError())
        .mockResolvedValue(success(osVersion({ isBootloader: true })));

      await start(DeviceReadyTarget.AnyResponse);
      await reachDiscovery();
      await reconnect();

      expect(disconnect).toHaveBeenCalledTimes(2);
      expect(actor.getSnapshot().value).toEqual({ Reconnecting: "Discovering" });

      await reconnect();

      expect(actor.getSnapshot().status).toBe("done");
    });

    it("should reconnect when a read goes out over a link that never answers", async () => {
      sendCommand.mockImplementationOnce(() => new Promise(() => {}));

      await start(DeviceReadyTarget.AnyResponse, USB_DEVICE);
      await reachDiscovery();
      await reconnect(REENUMERATED_DEVICE, { ...USB_DEVICE, id: NEW_DEVICE_ID });
      await jest.advanceTimersByTimeAsync(DEVICE_CALL_TIMEOUT_MS);
      await settle();

      expect(disconnect).toHaveBeenCalledTimes(2);
      expect(actor.getSnapshot().value).toEqual({ Reconnecting: "Discovering" });
    });
  });

  describe("teardown", () => {
    it("should stop polling once the invoking state has left", async () => {
      sendCommand.mockResolvedValue(success(osVersion({ isBootloader: true })));

      await start(DeviceReadyTarget.UpdatedOs);
      await reachDiscovery();
      await reconnect();
      actor.stop();
      await nextPoll();
      await nextPoll();

      expect(sendCommand).toHaveBeenCalledTimes(1);
    });

    it("should stop discovering once the invoking state has left", async () => {
      await start(DeviceReadyTarget.AnyResponse);
      await reachDiscovery();
      actor.stop();

      expect(stopDiscovering).toHaveBeenCalled();
    });
  });
});
