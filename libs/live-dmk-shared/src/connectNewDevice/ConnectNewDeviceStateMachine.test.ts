import {
  type ConnectedDevice,
  DeviceModelId as DMKDeviceModelId,
  type DeviceManagementKit,
  type DiscoveredDevice,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Subject, type Observer } from "rxjs";

import { DEFAULT_DEVICE_NOT_FOUND_DELAY, DEFAULT_SUCCESS_DELAY } from "./constants";
import { DefaultConnectNewDeviceStateMachine } from "./ConnectNewDeviceStateMachine";
import {
  ConnectNewDeviceUIStateTypes,
  type ConnectNewDeviceMapConnectionError,
  type ConnectNewDeviceUIState,
  type ConnectNewDeviceUIStateType,
} from "./types";
import {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  type BaseConnectionError,
  type DeviceDiscoveryService,
  type UnknownDiscoveryError,
} from "../deviceConnectivity/types";

const bleTransport = "RN_BLE" as TransportIdentifier;
const usbTransport = "RN_HID" as TransportIdentifier;

const nanoX: DiscoveredDevice = {
  id: "nano-x-id",
  name: "Nano X 1A2B",
  deviceModel: { id: "nanoX", model: DMKDeviceModelId.NANO_X, name: "Ledger Nano X" },
  transport: bleTransport,
} as DiscoveredDevice;

const stax: DiscoveredDevice = {
  id: "stax-id",
  name: "Stax 3C4D",
  deviceModel: { id: "stax", model: DMKDeviceModelId.STAX, name: "Ledger Stax" },
  transport: bleTransport,
} as DiscoveredDevice;

const nanoXDevice = {
  transport: bleTransport,
  deviceModelId: DeviceModelId.nanoX,
  id: "nano-x-id",
  name: "Nano X 1A2B",
};

const makeConnectedDevice = (overrides: Partial<ConnectedDevice> = {}): ConnectedDevice =>
  ({
    id: "connected-device-id",
    sessionId: "session-id",
    modelId: DMKDeviceModelId.NANO_X,
    name: "Nano X 1A2B",
    type: "BLE",
    transport: bleTransport,
    ...overrides,
  }) as ConnectedDevice;

const makeDiscoveryError = (
  overrides: Partial<Omit<UnknownDiscoveryError, "type">> = {},
): UnknownDiscoveryError => ({
  type: BaseDiscoveryErrorTypes.Unknown,
  transportId: bleTransport,
  ...overrides,
});

const flushPromises = () => jest.advanceTimersByTimeAsync(0);

type SetupTestOptions = {
  readonly transportIds?: Array<TransportIdentifier>;
  readonly connect?: jest.Mock;
  readonly connectedDevice?: ConnectedDevice;
  readonly mapConnectionError?: ConnectNewDeviceMapConnectionError;
  readonly buildCompatDeviceId?: (device: ConnectedDevice) => string;
  readonly deviceNotFoundDelay?: number;
  readonly successDelay?: number;
};

const startedMachines: Array<DefaultConnectNewDeviceStateMachine> = [];

const setupTest = ({
  transportIds = [bleTransport, usbTransport],
  connect = jest.fn().mockResolvedValue("session-id"),
  connectedDevice = makeConnectedDevice(),
  mapConnectionError = jest.fn(error => ({ type: BaseConnectionErrorTypes.Unknown, error })),
  buildCompatDeviceId,
  deviceNotFoundDelay,
  successDelay,
}: SetupTestOptions = {}) => {
  const discoveredDevices = new Subject<Array<DiscoveredDevice>>();
  const errors = new Subject<UnknownDiscoveryError>();
  const dmk = {
    connect,
    getConnectedDevice: jest.fn(() => connectedDevice),
  } as unknown as DeviceManagementKit;
  const onConnected = jest.fn();

  const states: Array<ConnectNewDeviceUIState> = [];
  const observer: Observer<ConnectNewDeviceUIState> = {
    next: state => states.push(state),
    error: jest.fn(),
    complete: jest.fn(),
  };

  const deviceDiscoveryService: DeviceDiscoveryService = {
    start: jest.fn(),
    stop: jest.fn(() => discoveredDevices.next([])),
    transportIds,
    discoveredDevices,
    errors,
  };

  const machine = new DefaultConnectNewDeviceStateMachine({
    dmk,
    deviceDiscoveryService,
    observer,
    onConnected,
    mapConnectionError,
    ...(buildCompatDeviceId ? { buildCompatDeviceId } : {}),
    ...(deviceNotFoundDelay === undefined ? {} : { deviceNotFoundDelay }),
    ...(successDelay === undefined ? {} : { successDelay }),
  });
  startedMachines.push(machine);

  const lastState = <TType extends ConnectNewDeviceUIStateType>(type: TType) => {
    const state = states[states.length - 1];
    expect(state?.type).toBe(type);
    return state as Extract<ConnectNewDeviceUIState, { type: TType }>;
  };

  return {
    connect,
    deviceDiscoveryService,
    discoverDevices: (devices: Array<DiscoveredDevice>) => discoveredDevices.next(devices),
    dmk,
    emitDiscoveryError: (error: UnknownDiscoveryError) => errors.next(error),
    lastState,
    machine,
    onConnected,
    states,
  };
};

const connectToNanoX = async (setup: ReturnType<typeof setupTest>) => {
  setup.machine.start();
  setup.discoverDevices([nanoX]);
  setup.lastState(ConnectNewDeviceUIStateTypes.Discovering).devices[0].onSelect();
  await flushPromises();
};

describe("ConnectNewDeviceStateMachine", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    startedMachines.splice(0).forEach(machine => machine.stop());
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("Discovering", () => {
    it("should start discovery on every transport when the machine starts", () => {
      const { deviceDiscoveryService, lastState, machine } = setupTest();

      machine.start();

      expect(deviceDiscoveryService.start).toHaveBeenCalledWith({ ignoreTransportIdentifiers: [] });
      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering)).toEqual({
        type: ConnectNewDeviceUIStateTypes.Discovering,
        devices: [],
        scanningTransports: [bleTransport, usbTransport],
        showDeviceNotFound: false,
      });
    });

    it("should emit every discovered device as a selectable device when devices are discovered", () => {
      const { discoverDevices, lastState, machine } = setupTest();

      machine.start();
      discoverDevices([nanoX, stax]);

      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering).devices).toEqual([
        { device: nanoXDevice, onSelect: expect.any(Function) },
        {
          device: {
            transport: bleTransport,
            deviceModelId: DeviceModelId.stax,
            id: "stax-id",
            name: "Stax 3C4D",
          },
          onSelect: expect.any(Function),
        },
      ]);
    });

    it("should remove a device from the list when discovery no longer reports it", () => {
      const { discoverDevices, lastState, machine } = setupTest();

      machine.start();
      discoverDevices([nanoX, stax]);
      discoverDevices([stax]);

      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering).devices).toEqual([
        expect.objectContaining({ device: expect.objectContaining({ id: "stax-id" }) }),
      ]);
    });
  });

  describe("Device not found delay", () => {
    it("should not show device not found before the default delay has elapsed", () => {
      const { lastState, machine } = setupTest();

      machine.start();
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY - 1);

      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering).showDeviceNotFound).toBe(false);
    });

    it("should show device not found when the default delay has elapsed", () => {
      const { lastState, machine } = setupTest();

      machine.start();
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);

      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering).showDeviceNotFound).toBe(true);
    });

    it("should use the injected delay when one is given", () => {
      const { lastState, machine } = setupTest({ deviceNotFoundDelay: 1_000 });

      machine.start();
      jest.advanceTimersByTime(1_000);

      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering).showDeviceNotFound).toBe(true);
    });

    it("should keep device not found shown when devices are discovered after the delay", () => {
      const { discoverDevices, lastState, machine } = setupTest();

      machine.start();
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);
      discoverDevices([nanoX]);

      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering).showDeviceNotFound).toBe(true);
    });

    it("should hide device not found and restart the delay when discovery starts again", () => {
      const { emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);
      emitDiscoveryError(makeDiscoveryError());
      lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).ignore();

      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering).showDeviceNotFound).toBe(false);
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);
      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering).showDeviceNotFound).toBe(true);
    });

    it("should cancel the delay when the machine leaves Discovering", () => {
      const { emitDiscoveryError, lastState, machine, states } = setupTest();

      machine.start();
      emitDiscoveryError(makeDiscoveryError());
      const statesCountBeforeDelay = states.length;
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);

      expect(states).toHaveLength(statesCountBeforeDelay);
      lastState(ConnectNewDeviceUIStateTypes.DiscoveryError);
    });
  });

  describe("Discovery errors", () => {
    it("should stop discovery and emit the DiscoveryError when discovery fails", () => {
      const { deviceDiscoveryService, emitDiscoveryError, lastState, machine } = setupTest();
      const discoveryError = makeDiscoveryError();

      machine.start();
      emitDiscoveryError(discoveryError);

      expect(deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
      expect(lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).error).toBe(discoveryError);
    });

    it("should offer retry when the error has a resolution", () => {
      const { emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      emitDiscoveryError(makeDiscoveryError({ resolution: { type: "prompt", retry: jest.fn() } }));

      expect(lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).retry).toEqual(
        expect.any(Function),
      );
    });

    it("should not offer retry when the error resolution is none", () => {
      const { emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      emitDiscoveryError(makeDiscoveryError({ resolution: { type: "none" } }));

      expect(lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).retry).toBeUndefined();
    });

    it("should not offer retry when the error has no resolution", () => {
      const { emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      emitDiscoveryError(makeDiscoveryError());

      expect(lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).retry).toBeUndefined();
    });

    it("should restart discovery without the error transport when the error is ignored", () => {
      const { deviceDiscoveryService, emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      emitDiscoveryError(makeDiscoveryError({ transportId: bleTransport }));
      lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).ignore();

      expect(deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering).scanningTransports).toEqual([
        usbTransport,
      ]);
    });

    it("should show no devices from the previous discovery when the error is ignored", () => {
      const { discoverDevices, emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      discoverDevices([nanoX]);
      emitDiscoveryError(makeDiscoveryError());
      lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).ignore();

      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering).devices).toEqual([]);
    });

    it("should skip every ignored transport when errors are ignored on several transports", () => {
      const { deviceDiscoveryService, emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      emitDiscoveryError(makeDiscoveryError({ transportId: bleTransport }));
      lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).ignore();
      emitDiscoveryError(makeDiscoveryError({ transportId: bleTransport }));
      lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).ignore();
      emitDiscoveryError(makeDiscoveryError({ transportId: usbTransport }));
      lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).ignore();

      expect(deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport, usbTransport],
      });
      expect(lastState(ConnectNewDeviceUIStateTypes.Discovering).scanningTransports).toEqual([]);
    });

    it("should keep every transport when an error without transport is ignored", () => {
      const { deviceDiscoveryService, emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      emitDiscoveryError(makeDiscoveryError({ transportId: undefined }));
      lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).ignore();

      expect(deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [],
      });
    });

    it("should restart discovery when the retry succeeds", async () => {
      const retry = jest.fn().mockResolvedValue(true);
      const { deviceDiscoveryService, emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      emitDiscoveryError(makeDiscoveryError({ resolution: { type: "prompt", retry } }));
      lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).retry!();
      await flushPromises();

      expect(retry).toHaveBeenCalledTimes(1);
      expect(deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
      expect(deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [],
      });
      lastState(ConnectNewDeviceUIStateTypes.Discovering);
    });

    it("should emit the returned DiscoveryError when the retry fails", async () => {
      const retryError = makeDiscoveryError({ transportId: usbTransport });
      const retry = jest.fn().mockResolvedValue(retryError);
      const { emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      emitDiscoveryError(makeDiscoveryError({ resolution: { type: "prompt", retry } }));
      lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).retry!();
      await flushPromises();

      expect(lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).error).toBe(retryError);
    });

    it("should emit an unknown DiscoveryError when the retry throws", async () => {
      const retryFailure = new Error("retry failed");
      const retry = jest.fn().mockRejectedValue(retryFailure);
      const { emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      emitDiscoveryError(makeDiscoveryError({ resolution: { type: "prompt", retry } }));
      lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).retry!();
      await flushPromises();

      expect(lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).error).toEqual({
        type: BaseDiscoveryErrorTypes.Unknown,
        error: retryFailure,
      });
    });

    it("should restart discovery without the error transport when the error is ignored during a retry", () => {
      const retry = jest.fn(() => new Promise<true>(() => {}));
      const { deviceDiscoveryService, emitDiscoveryError, lastState, machine } = setupTest();

      machine.start();
      emitDiscoveryError(
        makeDiscoveryError({ transportId: bleTransport, resolution: { type: "prompt", retry } }),
      );
      const discoveryErrorState = lastState(ConnectNewDeviceUIStateTypes.DiscoveryError);
      discoveryErrorState.retry!();
      discoveryErrorState.ignore();

      expect(deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
      lastState(ConnectNewDeviceUIStateTypes.Discovering);
    });
  });

  describe("Connecting", () => {
    it("should stop discovery and emit Connecting with the selected device when a device is selected", () => {
      const { deviceDiscoveryService, discoverDevices, lastState, machine } = setupTest();

      machine.start();
      discoverDevices([nanoX, stax]);
      lastState(ConnectNewDeviceUIStateTypes.Discovering).devices[0].onSelect();

      expect(deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
      expect(lastState(ConnectNewDeviceUIStateTypes.Connecting).device).toEqual(nanoXDevice);
    });

    it("should connect to the selected discovered device without the session refresher", () => {
      const { connect, discoverDevices, lastState, machine } = setupTest();

      machine.start();
      discoverDevices([nanoX, stax]);
      lastState(ConnectNewDeviceUIStateTypes.Discovering).devices[1].onSelect();

      expect(connect).toHaveBeenCalledWith({
        device: stax,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
    });

    it("should cancel the device not found delay when a device is selected", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.discoverDevices([nanoX]);
      setup.lastState(ConnectNewDeviceUIStateTypes.Discovering).devices[0].onSelect();
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);

      setup.lastState(ConnectNewDeviceUIStateTypes.Connecting);
    });

    it("should ignore the selection of a device from a previous state when connecting", () => {
      const { connect, discoverDevices, lastState, machine } = setupTest({
        connect: jest.fn(() => new Promise<string>(() => {})),
      });

      machine.start();
      discoverDevices([nanoX, stax]);
      const { devices } = lastState(ConnectNewDeviceUIStateTypes.Discovering);
      devices[0].onSelect();
      devices[1].onSelect();

      expect(connect).toHaveBeenCalledTimes(1);
      expect(lastState(ConnectNewDeviceUIStateTypes.Connecting).device).toEqual(nanoXDevice);
    });
  });

  describe("Connected and Done", () => {
    it("should emit Connected without calling onConnected when the connection succeeds", async () => {
      const setup = setupTest();

      await connectToNanoX(setup);

      setup.lastState(ConnectNewDeviceUIStateTypes.Connected);
      expect(setup.onConnected).not.toHaveBeenCalled();
    });

    it("should stay Connected before the default success delay has elapsed", async () => {
      const setup = setupTest();

      await connectToNanoX(setup);
      jest.advanceTimersByTime(DEFAULT_SUCCESS_DELAY - 1);

      setup.lastState(ConnectNewDeviceUIStateTypes.Connected);
    });

    it("should emit Done when the default success delay has elapsed", async () => {
      const setup = setupTest();

      await connectToNanoX(setup);
      jest.advanceTimersByTime(DEFAULT_SUCCESS_DELAY);

      setup.lastState(ConnectNewDeviceUIStateTypes.Done);
    });

    it("should use the injected success delay when one is given", async () => {
      const setup = setupTest({ successDelay: 300 });

      await connectToNanoX(setup);
      jest.advanceTimersByTime(300);

      setup.lastState(ConnectNewDeviceUIStateTypes.Done);
    });

    it("should call onConnected once with the connection result when Done", async () => {
      const connectedDevice = makeConnectedDevice();
      const setup = setupTest({ connectedDevice });

      await connectToNanoX(setup);
      jest.advanceTimersByTime(DEFAULT_SUCCESS_DELAY);

      expect(setup.dmk.getConnectedDevice).toHaveBeenCalledWith({ sessionId: "session-id" });
      expect(setup.onConnected).toHaveBeenCalledTimes(1);
      expect(setup.onConnected).toHaveBeenCalledWith({
        dmk: setup.dmk,
        sessionId: "session-id",
        connectedDevice,
        compatDeviceId: connectedDevice.id,
        compatDeviceName: connectedDevice.name,
        compatDeviceWired: false,
      });
    });

    it("should build the compat device id with the injected builder when one is given", async () => {
      const connectedDevice = makeConnectedDevice({ id: "usb_1002", type: "USB" });
      const buildCompatDeviceId = jest.fn(() => "custom-compat-id");
      const setup = setupTest({ connectedDevice, buildCompatDeviceId });

      await connectToNanoX(setup);
      jest.advanceTimersByTime(DEFAULT_SUCCESS_DELAY);

      expect(buildCompatDeviceId).toHaveBeenCalledWith(connectedDevice);
      expect(setup.onConnected).toHaveBeenCalledWith(
        expect.objectContaining({ compatDeviceId: "custom-compat-id", compatDeviceWired: true }),
      );
    });

    it("should emit nothing after Done when more time passes", async () => {
      const setup = setupTest();

      await connectToNanoX(setup);
      jest.advanceTimersByTime(DEFAULT_SUCCESS_DELAY);
      const statesCountAtDone = setup.states.length;
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY + DEFAULT_SUCCESS_DELAY);

      expect(setup.states).toHaveLength(statesCountAtDone);
      expect(setup.onConnected).toHaveBeenCalledTimes(1);
    });
  });

  describe("Connection errors", () => {
    const connectionFailure = new Error("connection failed");

    it("should emit an unknown ConnectionError for the selected device when the connection fails", async () => {
      const setup = setupTest({ connect: jest.fn().mockRejectedValue(connectionFailure) });

      await connectToNanoX(setup);

      const connectionErrorState = setup.lastState(ConnectNewDeviceUIStateTypes.ConnectionError);
      expect(connectionErrorState.error).toEqual({
        type: BaseConnectionErrorTypes.Unknown,
        error: connectionFailure,
      });
      expect(connectionErrorState.device).toEqual(nanoXDevice);
    });

    it.each(["ble-pairing-refused", "ble-pairing-peer-removed-pairing"])(
      "should emit the mapped %s ConnectionError with retry and ignore when the connection fails",
      async mappedErrorType => {
        const mapConnectionError = jest.fn((): BaseConnectionError => ({ type: mappedErrorType }));
        const setup = setupTest({
          connect: jest.fn().mockRejectedValue(connectionFailure),
          mapConnectionError,
        });

        await connectToNanoX(setup);

        expect(mapConnectionError).toHaveBeenCalledWith(connectionFailure);
        expect(setup.lastState(ConnectNewDeviceUIStateTypes.ConnectionError)).toEqual({
          type: ConnectNewDeviceUIStateTypes.ConnectionError,
          error: { type: mappedErrorType },
          device: nanoXDevice,
          retry: expect.any(Function),
          ignore: expect.any(Function),
        });
      },
    );

    it("should connect again to the same device without restarting discovery when the ConnectionError is retried", async () => {
      const connect = jest.fn().mockRejectedValueOnce(connectionFailure).mockResolvedValue("s-2");
      const setup = setupTest({ connect });

      await connectToNanoX(setup);
      setup.lastState(ConnectNewDeviceUIStateTypes.ConnectionError).retry();
      expect(setup.lastState(ConnectNewDeviceUIStateTypes.Connecting).device).toEqual(nanoXDevice);
      await flushPromises();

      expect(connect).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenLastCalledWith(expect.objectContaining({ device: nanoX }));
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
      setup.lastState(ConnectNewDeviceUIStateTypes.Connected);
    });

    it("should start discovery again with an empty list when the ConnectionError is ignored", async () => {
      const setup = setupTest({ connect: jest.fn().mockRejectedValue(connectionFailure) });

      await connectToNanoX(setup);
      setup.lastState(ConnectNewDeviceUIStateTypes.ConnectionError).ignore();

      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [],
      });
      expect(setup.lastState(ConnectNewDeviceUIStateTypes.Discovering)).toEqual({
        type: ConnectNewDeviceUIStateTypes.Discovering,
        devices: [],
        scanningTransports: [bleTransport, usbTransport],
        showDeviceNotFound: false,
      });
    });

    it("should connect to another device selected after the ConnectionError is ignored", async () => {
      const connect = jest.fn().mockRejectedValueOnce(connectionFailure).mockResolvedValue("s-2");
      const setup = setupTest({ connect });

      await connectToNanoX(setup);
      setup.lastState(ConnectNewDeviceUIStateTypes.ConnectionError).ignore();
      setup.discoverDevices([stax]);
      setup.lastState(ConnectNewDeviceUIStateTypes.Discovering).devices[0].onSelect();
      await flushPromises();

      expect(connect).toHaveBeenCalledTimes(2);
      expect(connect).toHaveBeenLastCalledWith(expect.objectContaining({ device: stax }));
      setup.lastState(ConnectNewDeviceUIStateTypes.Connected);
    });

    it("should keep skipping the ignored transports when the ConnectionError is ignored", async () => {
      const setup = setupTest({ connect: jest.fn().mockRejectedValue(connectionFailure) });

      setup.machine.start();
      setup.emitDiscoveryError(makeDiscoveryError({ transportId: usbTransport }));
      setup.lastState(ConnectNewDeviceUIStateTypes.DiscoveryError).ignore();
      setup.discoverDevices([nanoX]);
      setup.lastState(ConnectNewDeviceUIStateTypes.Discovering).devices[0].onSelect();
      await flushPromises();
      setup.lastState(ConnectNewDeviceUIStateTypes.ConnectionError).ignore();

      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [usbTransport],
      });
      expect(setup.lastState(ConnectNewDeviceUIStateTypes.Discovering).scanningTransports).toEqual([
        bleTransport,
      ]);
    });

    it("should not call onConnected when the ConnectionError is ignored", async () => {
      const setup = setupTest({ connect: jest.fn().mockRejectedValue(connectionFailure) });

      await connectToNanoX(setup);
      setup.lastState(ConnectNewDeviceUIStateTypes.ConnectionError).ignore();
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY + DEFAULT_SUCCESS_DELAY);

      expect(setup.onConnected).not.toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    it("should emit no state when the machine is stopped while discovering", () => {
      const { machine, states } = setupTest();

      machine.start();
      const statesCountBeforeStop = states.length;
      machine.stop();

      expect(states).toHaveLength(statesCountBeforeStop);
    });

    it("should stop discovery when the machine is stopped while discovering", () => {
      const { deviceDiscoveryService, machine } = setupTest();

      machine.start();
      machine.stop();

      expect(deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
    });

    it("should not stop discovery again when the machine is stopped after discovery has stopped", () => {
      const { deviceDiscoveryService, emitDiscoveryError, machine } = setupTest();

      machine.start();
      emitDiscoveryError(makeDiscoveryError());
      machine.stop();

      expect(deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
    });

    it("should not reach Done or call onConnected when the machine is stopped while Connected", async () => {
      const setup = setupTest();

      await connectToNanoX(setup);
      setup.machine.stop();
      jest.advanceTimersByTime(DEFAULT_SUCCESS_DELAY);

      setup.lastState(ConnectNewDeviceUIStateTypes.Connected);
      expect(setup.onConnected).not.toHaveBeenCalled();
    });

    it("should ignore discovered devices when the machine is stopped", () => {
      const { discoverDevices, machine, states } = setupTest();

      machine.start();
      machine.stop();
      const statesCountAtStop = states.length;
      discoverDevices([nanoX]);

      expect(states).toHaveLength(statesCountAtStop);
    });
  });
});
