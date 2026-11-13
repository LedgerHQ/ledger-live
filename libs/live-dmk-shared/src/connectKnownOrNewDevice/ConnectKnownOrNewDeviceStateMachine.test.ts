import {
  type ConnectedDevice,
  DeviceModelId as DMKDeviceModelId,
  type DeviceManagementKit,
  type DiscoveredDevice,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { listen, type Log } from "@ledgerhq/logs";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { BehaviorSubject, Subject, type Observer } from "rxjs";

import { DefaultConnectKnownOrNewDeviceStateMachine } from "./ConnectKnownOrNewDeviceStateMachine";
import { DEFAULT_DEVICE_NOT_FOUND_DELAY } from "./constants";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  DeviceListItemStatuses,
  type ConnectKnownOrNewDeviceDelays,
  type ConnectKnownOrNewDeviceFindMatchingDevice,
  type ConnectKnownOrNewDeviceKnownDevice,
  type ConnectKnownOrNewDeviceUIState,
  type ConnectKnownOrNewDeviceUIStateType,
  type SelectableDeviceListItem,
} from "./types";
import { ConnectNewDeviceUIStateTypes, type SelectableDevice } from "../connectNewDevice/types";
import { createFakeDeviceDiscoveryService } from "../deviceConnectivity/discoveryService/__test-utils__/createFakeDeviceDiscoveryService";
import {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  type BaseConnectionError,
  type UnknownDiscoveryError,
} from "../deviceConnectivity/types";

const bleTransport = "RN_BLE" as TransportIdentifier;
const usbTransport = "RN_HID" as TransportIdentifier;

const knownNanoX: ConnectKnownOrNewDeviceKnownDevice = {
  transport: bleTransport,
  deviceModelId: DeviceModelId.nanoX,
  id: "nano-x-id",
  name: "My Nano X",
  lastUsedAt: 100,
};

const knownStax: ConnectKnownOrNewDeviceKnownDevice = {
  transport: bleTransport,
  deviceModelId: DeviceModelId.stax,
  id: "stax-id",
  name: "My Stax",
  lastUsedAt: 200,
};

const nanoX: DiscoveredDevice = {
  id: "nano-x-id",
  name: "Nano X 1A2B",
  deviceModel: { id: "nanoX", model: DMKDeviceModelId.NANO_X, name: "Ledger Nano X" },
  transport: bleTransport,
} as DiscoveredDevice;

const flexUsb: DiscoveredDevice = {
  id: "flex-usb-id",
  name: "Flex",
  deviceModel: { id: "flex", model: DMKDeviceModelId.FLEX, name: "Ledger Flex" },
  transport: usbTransport,
} as DiscoveredDevice;

const newNanoS: DiscoveredDevice = {
  id: "new-nano-s-id",
  name: "Nano S Plus 5E6F",
  deviceModel: { id: "nanoSP", model: DMKDeviceModelId.NANO_SP, name: "Ledger Nano S Plus" },
  transport: bleTransport,
} as DiscoveredDevice;

const NANO_X_KEY = `known:${bleTransport}:nano-x-id`;
const STAX_KEY = `known:${bleTransport}:stax-id`;
const FLEX_KEY = `discovered:${usbTransport}:flex-usb-id`;

const makeConnectedDevice = (overrides: Partial<ConnectedDevice> = {}): ConnectedDevice =>
  ({
    id: "nano-x-id",
    sessionId: "nano-x-session",
    modelId: DMKDeviceModelId.NANO_X,
    name: "Nano X 1A2B",
    type: "BLE",
    transport: bleTransport,
    ...overrides,
  }) as ConnectedDevice;

const connectedFlex = makeConnectedDevice({
  id: "flex-usb-id",
  sessionId: "flex-session",
  modelId: DMKDeviceModelId.FLEX,
  name: "Flex",
  type: "USB",
  transport: usbTransport,
});

const makeDiscoveryError = (
  overrides: Partial<Omit<UnknownDiscoveryError, "type">> = {},
): UnknownDiscoveryError => ({
  type: BaseDiscoveryErrorTypes.Unknown,
  transportId: bleTransport,
  ...overrides,
});

const findMatchingDeviceById: ConnectKnownOrNewDeviceFindMatchingDevice = (device, candidates) =>
  candidates.find(
    candidate => candidate.transport === device.transport && candidate.id === device.id,
  ) ?? null;

const flushPromises = () => jest.advanceTimersByTimeAsync(0);

type SetupTestOptions = {
  readonly knownDevices?: Array<ConnectKnownOrNewDeviceKnownDevice>;
  readonly connect?: jest.Mock;
  readonly disconnect?: jest.Mock;
  readonly mapConnectionError?: jest.Mock;
  readonly onConnected?: jest.Mock;
  readonly isPaused?: boolean;
  readonly delays?: ConnectKnownOrNewDeviceDelays;
};

const startedMachines: Array<DefaultConnectKnownOrNewDeviceStateMachine> = [];

const setupTest = ({
  knownDevices = [knownNanoX],
  connect = jest.fn().mockResolvedValue("nano-x-session"),
  disconnect = jest.fn().mockResolvedValue(undefined),
  mapConnectionError = jest.fn(error => ({ type: BaseConnectionErrorTypes.Unknown, error })),
  onConnected = jest.fn(),
  isPaused,
  delays,
}: SetupTestOptions = {}) => {
  const knownDevices$ = new BehaviorSubject(knownDevices);
  const connectedDevices$ = new BehaviorSubject<Array<ConnectedDevice>>([]);
  const discoveredDevices = new Subject<Array<DiscoveredDevice>>();
  const errors = new Subject<UnknownDiscoveryError>();
  const dmk = {
    connect,
    disconnect,
    getConnectedDevice: jest.fn(({ sessionId }: { sessionId: string }) =>
      sessionId === connectedFlex.sessionId
        ? connectedFlex
        : makeConnectedDevice({ sessionId, id: sessionId.replace("-session", "-id") }),
    ),
  } as unknown as DeviceManagementKit;
  const removeKnownDevice = jest.fn();

  const states: Array<ConnectKnownOrNewDeviceUIState> = [];
  const observer: Observer<ConnectKnownOrNewDeviceUIState> = {
    next: state => states.push(state),
    error: jest.fn(),
    complete: jest.fn(),
  };

  const deviceDiscoveryService = createFakeDeviceDiscoveryService({
    transportIds: [bleTransport, usbTransport],
    discoveredDevices,
    errors,
    onStop: () => discoveredDevices.next([]),
  });

  const machine = new DefaultConnectKnownOrNewDeviceStateMachine({
    dmk,
    deviceDiscoveryService,
    observer,
    knownDevices$,
    connectedDevices$,
    findMatchingDevice: findMatchingDeviceById,
    getConnectivity: ({ transport }) => (transport === usbTransport ? "USB" : "BLE"),
    removeKnownDevice,
    mapConnectionError,
    onConnected,
    getDiscoveredDeviceKey: ({ transport, id }) => `${transport}:${id}`,
    ...(isPaused === undefined ? {} : { isPaused }),
    delays: { connectNewDevice: { successDelay: 0 }, ...delays },
  });
  startedMachines.push(machine);

  const lastState = <TType extends ConnectKnownOrNewDeviceUIStateType>(type: TType) => {
    const state = states[states.length - 1];
    expect(state?.type).toBe(type);
    return state as Extract<ConnectKnownOrNewDeviceUIState, { type: TType }>;
  };

  const row = (key: string): SelectableDeviceListItem => {
    const found = lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering).devices.find(
      device => device.key === key,
    );
    if (!found) {
      throw new Error(`no row ${key}`);
    }
    return found;
  };

  const setConnectedDevices = (devices: Array<ConnectedDevice>) => connectedDevices$.next(devices);

  return {
    connect,
    connectedDevices$,
    deviceDiscoveryService,
    disconnect,
    discoverDevices: (devices: Array<DiscoveredDevice>) => discoveredDevices.next(devices),
    dmk,
    emitDiscoveryError: (error: UnknownDiscoveryError) => errors.next(error),
    knownDevices$,
    lastState,
    machine,
    mapConnectionError,
    observer,
    onConnected,
    removeKnownDevice,
    row,
    setConnectedDevices,
    states,
  };
};

type Setup = ReturnType<typeof setupTest>;

const startWithNanoXAvailable = (setup: Setup) => {
  setup.machine.start();
  setup.discoverDevices([nanoX]);
};

const connectToNanoX = async (setup: Setup) => {
  startWithNanoXAvailable(setup);
  setup.row(NANO_X_KEY).connect();
  await flushPromises();
};

const openAddMode = (setup: Setup) => {
  setup.machine.start();
  setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering).addNewDevice();
};

const embeddedState = (setup: Setup) =>
  setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice).connectNewDeviceUIState;

const selectInAddMode = (setup: Setup, discoveredDevice: DiscoveredDevice) => {
  const state = embeddedState(setup);
  if (state.type !== ConnectNewDeviceUIStateTypes.Discovering) {
    throw new Error(`the Add mode is in ${state.type}`);
  }
  const selectable = state.devices.find(
    (device: SelectableDevice) => device.device.id === discoveredDevice.id,
  );
  if (!selectable?.isAvailable) {
    throw new Error(`${discoveredDevice.id} is not available in the Add mode`);
  }
  selectable.onSelect();
};

describe("ConnectKnownOrNewDeviceStateMachine", () => {
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
      const { deviceDiscoveryService, machine } = setupTest();

      machine.start();

      expect(deviceDiscoveryService.start).toHaveBeenCalledWith({ ignoreTransportIdentifiers: [] });
    });

    it("should emit the known devices as unavailable when nothing is discovered", () => {
      const { lastState, machine } = setupTest();

      machine.start();

      expect(lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toEqual({
        type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
        devices: [
          {
            key: NANO_X_KEY,
            device: {
              transport: bleTransport,
              deviceModelId: DeviceModelId.nanoX,
              id: "nano-x-id",
              name: "My Nano X",
            },
            connectivity: "BLE",
            status: DeviceListItemStatuses.Unavailable,
            connect: expect.any(Function),
            remove: expect.any(Function),
          },
        ],
        addNewDevice: expect.any(Function),
      });
    });

    it("should emit a known device as available when discovery finds it", () => {
      const setup = setupTest();

      startWithNanoXAvailable(setup);

      expect(setup.row(NANO_X_KEY).status).toBe(DeviceListItemStatuses.Available);
    });

    it("should emit a discovered USB device without remove", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.discoverDevices([flexUsb]);

      expect(setup.row(FLEX_KEY)).toEqual(
        expect.not.objectContaining({ remove: expect.anything() }),
      );
    });

    it("should emit a connected device with disconnect", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);

      expect(setup.row(NANO_X_KEY)).toEqual(
        expect.objectContaining({
          status: DeviceListItemStatuses.Connected,
          disconnect: expect.any(Function),
          remove: expect.any(Function),
        }),
      );
    });

    it("should emit the new list when the known devices change", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.knownDevices$.next([knownNanoX, knownStax]);

      expect(
        setup
          .lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)
          .devices.map(({ key }) => key),
      ).toEqual([STAX_KEY, NANO_X_KEY]);
    });

    it("should keep the devices of the last scan while discovery is stopped", () => {
      const setup = setupTest();

      startWithNanoXAvailable(setup);
      setup.machine.pause();
      setup.setConnectedDevices([]);

      expect(setup.row(NANO_X_KEY).status).toBe(DeviceListItemStatuses.Available);
    });
  });

  describe("Tapping a device", () => {
    it("should call onConnected with the session of a connected known device", () => {
      const setup = setupTest();
      const connectedNanoX = makeConnectedDevice();

      setup.machine.start();
      setup.setConnectedDevices([connectedNanoX]);
      setup.row(NANO_X_KEY).connect();

      expect(setup.onConnected).toHaveBeenCalledWith(
        {
          sessionId: "nano-x-session",
          connectedDevice: connectedNanoX,
          dmk: setup.dmk,
          compatDeviceId: "nano-x-id",
          compatDeviceName: "Nano X 1A2B",
          compatDeviceWired: false,
        },
        { isNewDevice: false },
      );
      expect(setup.connect).not.toHaveBeenCalled();
    });

    it("should call onConnected as a new device when the connected device is not known", () => {
      const setup = setupTest({ knownDevices: [] });

      setup.machine.start();
      setup.setConnectedDevices([connectedFlex]);
      setup.row("connected:flex-session").connect();

      expect(setup.onConnected).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "flex-session", compatDeviceWired: true }),
        { isNewDevice: true },
      );
    });

    it("should stop discovery and stay in Discovering when a connected device is tapped", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);
      setup.row(NANO_X_KEY).connect();

      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("should stop discovery and emit Connecting when an available device is tapped", () => {
      const setup = setupTest();

      startWithNanoXAvailable(setup);
      setup.row(NANO_X_KEY).connect();

      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Connecting)).toEqual({
        type: ConnectKnownOrNewDeviceUIStateTypes.Connecting,
        devices: [
          {
            key: NANO_X_KEY,
            device: expect.objectContaining({ name: "My Nano X" }),
            connectivity: "BLE",
            status: DeviceListItemStatuses.Available,
          },
        ],
        device: expect.objectContaining({ id: "nano-x-id" }),
        close: expect.any(Function),
      });
    });

    it("should emit WaitingForDevice when an unavailable device is tapped", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.row(NANO_X_KEY).connect();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice)).toEqual({
        type: ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice,
        devices: [expect.objectContaining({ key: NANO_X_KEY })],
        device: expect.objectContaining({ id: "nano-x-id" }),
        showDeviceNotFound: false,
        addNewDevice: expect.any(Function),
        close: expect.any(Function),
      });
    });

    it("should follow the current status of the device when a row from an older list is tapped", () => {
      const setup = setupTest();

      setup.machine.start();
      const unavailableRow = setup.row(NANO_X_KEY);
      setup.discoverDevices([nanoX]);
      unavailableRow.connect();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Connecting)).toBeDefined();
    });

    it("should ignore a tap on a device that is no longer listed", () => {
      const setup = setupTest();

      setup.machine.start();
      const removedRow = setup.row(NANO_X_KEY);
      setup.knownDevices$.next([]);
      const statesCount = setup.states.length;
      removedRow.connect();

      expect(setup.states).toHaveLength(statesCount);
    });
  });

  describe("WaitingForDevice", () => {
    const waitForNanoX = (setup: Setup) => {
      setup.machine.start();
      setup.row(NANO_X_KEY).connect();
    };

    it("should keep discovery running", () => {
      const setup = setupTest();

      waitForNanoX(setup);

      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
      expect(setup.deviceDiscoveryService.stop).not.toHaveBeenCalled();
    });

    it("should connect to the device when discovery finds it", async () => {
      const setup = setupTest();

      waitForNanoX(setup);
      setup.discoverDevices([nanoX]);
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Connecting).device.id).toBe(
        "nano-x-id",
      );
      await flushPromises();

      expect(setup.connect).toHaveBeenCalledWith({
        device: nanoX,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
    });

    it("should keep waiting when discovery finds another device", () => {
      const setup = setupTest({ knownDevices: [knownNanoX, knownStax] });

      waitForNanoX(setup);
      setup.discoverDevices([flexUsb]);

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice)).toBeDefined();
      expect(setup.connect).not.toHaveBeenCalled();
    });

    it("should not show the hint before the default delay has elapsed", () => {
      const setup = setupTest();

      waitForNanoX(setup);
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY - 1);

      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).showDeviceNotFound,
      ).toBe(false);
    });

    it("should show the hint when the default delay has elapsed", () => {
      const setup = setupTest();

      waitForNanoX(setup);
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);

      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).showDeviceNotFound,
      ).toBe(true);
    });

    it("should show the hint after the injected delay when one is given", () => {
      const setup = setupTest({ delays: { deviceNotFoundDelay: 1_000 } });

      waitForNanoX(setup);
      jest.advanceTimersByTime(1_000);

      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).showDeviceNotFound,
      ).toBe(true);
    });

    it("should hide the hint when the user waits for a device again", () => {
      const setup = setupTest();

      waitForNanoX(setup);
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).close();
      setup.row(NANO_X_KEY).connect();

      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).showDeviceNotFound,
      ).toBe(false);
    });

    it("should open the Add mode when the hint is tapped", () => {
      const setup = setupTest();

      waitForNanoX(setup);
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).addNewDevice();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice)).toBeDefined();
    });

    it("should go back to the list, with discovery still running, when it is closed", () => {
      const setup = setupTest();

      waitForNanoX(setup);
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).close();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.stop).not.toHaveBeenCalled();
    });

    it("should not show the hint after it is closed", () => {
      const setup = setupTest();

      waitForNanoX(setup);
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).close();
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("should emit the DiscoveryError when discovery fails", () => {
      const setup = setupTest();

      waitForNanoX(setup);
      setup.emitDiscoveryError(makeDiscoveryError());

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError)).toBeDefined();
    });
  });

  describe("Connecting", () => {
    it("should disconnect the other sessions before connecting", async () => {
      const disconnect = jest.fn().mockResolvedValue(undefined);
      const connect = jest.fn().mockResolvedValue("nano-x-session");
      const setup = setupTest({ connect, disconnect });

      startWithNanoXAvailable(setup);
      setup.setConnectedDevices([connectedFlex]);
      setup.row(NANO_X_KEY).connect();
      await flushPromises();

      expect(disconnect).toHaveBeenCalledWith({ sessionId: "flex-session" });
      expect(disconnect.mock.invocationCallOrder[0]).toBeLessThan(
        connect.mock.invocationCallOrder[0],
      );
    });

    it("should still connect and write a log when disconnecting another session fails", async () => {
      const logs: Array<Log> = [];
      const unsubscribe = listen(entry => logs.push(entry));
      const setup = setupTest({ disconnect: jest.fn().mockRejectedValue(new Error("busy")) });

      startWithNanoXAvailable(setup);
      setup.setConnectedDevices([connectedFlex]);
      setup.row(NANO_X_KEY).connect();
      await flushPromises();
      unsubscribe();

      expect(setup.connect).toHaveBeenCalled();
      expect(logs).toContainEqual(
        expect.objectContaining({
          type: "ConnectKnownOrNewDeviceStateMachine",
          message: "failed to disconnect a device",
        }),
      );
    });

    it("should call onConnected with the new session when the connection succeeds", async () => {
      const setup = setupTest();

      await connectToNanoX(setup);

      expect(setup.onConnected).toHaveBeenCalledTimes(1);
      expect(setup.onConnected).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "nano-x-session", dmk: setup.dmk }),
        { isNewDevice: false },
      );
    });

    it("should call onConnected as a new device when the connected USB device was not known", async () => {
      const setup = setupTest({ connect: jest.fn().mockResolvedValue("flex-session") });

      setup.machine.start();
      setup.discoverDevices([flexUsb]);
      setup.row(FLEX_KEY).connect();
      await flushPromises();

      expect(setup.onConnected).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "flex-session" }),
        { isNewDevice: true },
      );
    });

    it("should go back to the list without starting discovery when the connection succeeds", async () => {
      const setup = setupTest();

      await connectToNanoX(setup);

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    });

    it("should go back to the list and start discovery again when it is closed", () => {
      const setup = setupTest();

      startWithNanoXAvailable(setup);
      setup.row(NANO_X_KEY).connect();
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Connecting).close();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("should neither call onConnected nor disconnect when the connection succeeds after a close", async () => {
      let resolveConnect: (sessionId: string) => void = () => undefined;
      const setup = setupTest({
        connect: jest.fn(() => new Promise<string>(resolve => (resolveConnect = resolve))),
      });

      startWithNanoXAvailable(setup);
      setup.row(NANO_X_KEY).connect();
      await flushPromises();
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Connecting).close();
      resolveConnect("nano-x-session");
      await flushPromises();

      expect(setup.onConnected).not.toHaveBeenCalled();
      expect(setup.disconnect).not.toHaveBeenCalled();
    });

    it("should emit the mapped ConnectionError for the device when the connection fails", async () => {
      const connectionError: BaseConnectionError = { type: "pairing-refused" };
      const setup = setupTest({
        connect: jest.fn().mockRejectedValue(new Error("refused")),
        mapConnectionError: jest.fn(() => connectionError),
      });

      await connectToNanoX(setup);

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectionError)).toEqual({
        type: ConnectKnownOrNewDeviceUIStateTypes.ConnectionError,
        devices: [expect.objectContaining({ key: NANO_X_KEY })],
        error: connectionError,
        device: expect.objectContaining({ id: "nano-x-id" }),
        retry: expect.any(Function),
        ignore: expect.any(Function),
        close: expect.any(Function),
      });
    });
  });

  describe("ConnectionError", () => {
    const failToConnect = async () => {
      const connect = jest
        .fn()
        .mockRejectedValueOnce(new Error("refused"))
        .mockResolvedValue("nano-x-session");
      const setup = setupTest({ connect });
      await connectToNanoX(setup);
      return setup;
    };

    it("should connect again to the same device when it is retried", async () => {
      const setup = await failToConnect();

      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectionError).retry();
      await flushPromises();

      expect(setup.connect).toHaveBeenNthCalledWith(2, expect.objectContaining({ device: nanoX }));
      expect(setup.onConnected).toHaveBeenCalledTimes(1);
    });

    it("should go back to the list and start discovery again when it is ignored", async () => {
      const setup = await failToConnect();

      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectionError).ignore();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("should go back to the list and start discovery again when it is closed", async () => {
      const setup = await failToConnect();

      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectionError).close();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });
  });

  describe("Discovery errors", () => {
    it("should stop discovery and emit the DiscoveryError over the list when discovery fails", () => {
      const setup = setupTest();
      const error = makeDiscoveryError();

      setup.machine.start();
      setup.emitDiscoveryError(error);

      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError)).toEqual({
        type: ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError,
        devices: [expect.objectContaining({ key: NANO_X_KEY })],
        error,
        ignore: expect.any(Function),
        close: expect.any(Function),
      });
    });

    it("should offer retry when the error has a resolution", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.emitDiscoveryError(
        makeDiscoveryError({ resolution: { type: "prompt", retry: jest.fn() } }),
      );

      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).retry,
      ).toBeInstanceOf(Function);
    });

    it("should start discovery again without the error transport when it is ignored", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.emitDiscoveryError(makeDiscoveryError());
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).ignore();

      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("should do the same as ignore when it is closed", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.emitDiscoveryError(makeDiscoveryError());
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).close();

      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("should go back to the list without the waited device when a WaitingForDevice error is ignored", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.row(NANO_X_KEY).connect();
      setup.emitDiscoveryError(makeDiscoveryError({ transportId: usbTransport }));
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).ignore();
      setup.discoverDevices([nanoX]);

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.connect).not.toHaveBeenCalled();
    });

    it("should start discovery again when the retry succeeds", async () => {
      const setup = setupTest();

      setup.machine.start();
      setup.emitDiscoveryError(
        makeDiscoveryError({
          resolution: { type: "prompt", retry: jest.fn().mockResolvedValue(true) },
        }),
      );
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).retry!();
      await flushPromises();

      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [],
      });
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("should emit the returned DiscoveryError when the retry fails", async () => {
      const setup = setupTest();
      const retryError = makeDiscoveryError({ transportId: usbTransport });

      setup.machine.start();
      setup.emitDiscoveryError(
        makeDiscoveryError({
          resolution: { type: "prompt", retry: jest.fn().mockResolvedValue(retryError) },
        }),
      );
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).retry!();
      await flushPromises();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).error).toBe(
        retryError,
      );
    });

    it("should emit an unknown DiscoveryError when the retry throws", async () => {
      const setup = setupTest();
      const thrown = new Error("retry failed");

      setup.machine.start();
      setup.emitDiscoveryError(
        makeDiscoveryError({
          resolution: { type: "prompt", retry: jest.fn().mockRejectedValue(thrown) },
        }),
      );
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).retry!();
      await flushPromises();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).error).toEqual({
        type: BaseDiscoveryErrorTypes.Unknown,
        error: thrown,
      });
    });

    it("should start discovery again without the error transport when it is ignored during a retry", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.emitDiscoveryError(
        makeDiscoveryError({
          resolution: { type: "prompt", retry: jest.fn(() => new Promise(() => undefined)) },
        }),
      );
      const errorState = setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError);
      errorState.retry!();
      errorState.ignore();

      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
    });

    it("should skip the error transport when discovery starts again after a pause", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.emitDiscoveryError(makeDiscoveryError());
      setup.machine.pause();
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).ignore();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
      setup.machine.resume();

      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
    });
  });

  describe("Add mode", () => {
    it("should emit ConnectNewDevice with the Discovering state of the embedded flow", () => {
      const setup = setupTest();

      openAddMode(setup);

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice)).toEqual({
        type: ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice,
        connectNewDeviceUIState: expect.objectContaining({
          type: ConnectNewDeviceUIStateTypes.Discovering,
          scanningTransports: [bleTransport, usbTransport],
        }),
        close: expect.any(Function),
      });
    });

    it("should keep discovery running when the Add mode opens", () => {
      const setup = setupTest();

      openAddMode(setup);

      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
      expect(setup.deviceDiscoveryService.stop).not.toHaveBeenCalled();
    });

    it("should show the devices of the embedded flow", () => {
      const setup = setupTest();

      openAddMode(setup);
      setup.discoverDevices([newNanoS]);

      expect(embeddedState(setup)).toEqual(
        expect.objectContaining({
          devices: [
            expect.objectContaining({ device: expect.objectContaining({ id: "new-nano-s-id" }) }),
          ],
        }),
      );
    });

    it("should call onConnected as a new device when the embedded flow connects a device", async () => {
      const setup = setupTest({ connect: jest.fn().mockResolvedValue("new-nano-s-session") });

      openAddMode(setup);
      setup.discoverDevices([newNanoS]);
      selectInAddMode(setup, newNanoS);
      await flushPromises();
      await flushPromises();

      expect(setup.onConnected).toHaveBeenCalledTimes(1);
      expect(setup.onConnected).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "new-nano-s-session" }),
        { isNewDevice: true },
      );
    });

    it("should go back to the list without starting discovery when the embedded flow connects a device", async () => {
      const setup = setupTest({ connect: jest.fn().mockResolvedValue("new-nano-s-session") });

      openAddMode(setup);
      setup.discoverDevices([newNanoS]);
      selectInAddMode(setup, newNanoS);
      await flushPromises();
      await flushPromises();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    });

    it("should go back to the list, with discovery still running, when it is closed", () => {
      const setup = setupTest();

      openAddMode(setup);
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice).close();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
      expect(setup.deviceDiscoveryService.stop).not.toHaveBeenCalled();
    });

    it("should emit nothing from the embedded flow after it is closed", () => {
      const setup = setupTest();

      openAddMode(setup);
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice).close();
      setup.discoverDevices([newNanoS]);
      jest.advanceTimersByTime(60_000);

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("should let the embedded flow show the discovery errors", () => {
      const setup = setupTest();

      openAddMode(setup);
      setup.emitDiscoveryError(makeDiscoveryError());

      expect(embeddedState(setup).type).toBe(ConnectNewDeviceUIStateTypes.DiscoveryError);
    });

    it("should stay in the Add mode when an embedded discovery error is closed", () => {
      const setup = setupTest();

      openAddMode(setup);
      setup.emitDiscoveryError(makeDiscoveryError());
      const errorState = embeddedState(setup);
      if (errorState.type !== ConnectNewDeviceUIStateTypes.DiscoveryError) {
        throw new Error("expected a discovery error");
      }
      errorState.close();

      expect(embeddedState(setup).type).toBe(ConnectNewDeviceUIStateTypes.Discovering);
    });

    it("should skip the transport that the embedded flow ignored when the list starts discovery again", () => {
      const setup = setupTest();

      openAddMode(setup);
      setup.emitDiscoveryError(makeDiscoveryError());
      const errorState = embeddedState(setup);
      if (errorState.type !== ConnectNewDeviceUIStateTypes.DiscoveryError) {
        throw new Error("expected a discovery error");
      }
      errorState.ignore();
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice).close();
      setup.machine.pause();
      setup.machine.resume();

      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
    });

    it("should send the error to the observer when the embedded flow fails", async () => {
      const failure = new Error("mapping failed");
      const setup = setupTest({
        connect: jest.fn().mockRejectedValue(new Error("refused")),
        mapConnectionError: jest.fn(() => {
          throw failure;
        }),
      });

      openAddMode(setup);
      setup.discoverDevices([newNanoS]);
      selectInAddMode(setup, newNanoS);
      await flushPromises();

      expect(setup.observer.error).toHaveBeenCalledWith(failure);
    });
  });

  describe("Disconnect and Remove", () => {
    it("should disconnect the session of a connected device", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);
      const connectedRow = setup.row(NANO_X_KEY);
      if (connectedRow.status !== DeviceListItemStatuses.Connected) {
        throw new Error("expected a connected row");
      }
      connectedRow.disconnect();

      expect(setup.disconnect).toHaveBeenCalledWith({ sessionId: "nano-x-session" });
    });

    it("should write a log when a disconnect fails", async () => {
      const logs: Array<Log> = [];
      const unsubscribe = listen(entry => logs.push(entry));
      const setup = setupTest({ disconnect: jest.fn().mockRejectedValue(new Error("busy")) });

      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);
      const connectedRow = setup.row(NANO_X_KEY);
      if (connectedRow.status !== DeviceListItemStatuses.Connected) {
        throw new Error("expected a connected row");
      }
      connectedRow.disconnect();
      await flushPromises();
      unsubscribe();

      expect(logs).toContainEqual(
        expect.objectContaining({ message: "failed to disconnect a device" }),
      );
    });

    it("should remove a known device that is not connected", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.row(NANO_X_KEY).remove!();

      expect(setup.removeKnownDevice).toHaveBeenCalledWith(knownNanoX);
      expect(setup.disconnect).not.toHaveBeenCalled();
    });

    it("should disconnect a connected known device before removing it", async () => {
      const setup = setupTest();

      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);
      setup.row(NANO_X_KEY).remove!();
      expect(setup.removeKnownDevice).not.toHaveBeenCalled();
      await flushPromises();

      expect(setup.disconnect).toHaveBeenCalledWith({ sessionId: "nano-x-session" });
      expect(setup.removeKnownDevice).toHaveBeenCalledWith(knownNanoX);
    });

    it("should still remove a connected known device when its disconnect fails", async () => {
      const setup = setupTest({ disconnect: jest.fn().mockRejectedValue(new Error("busy")) });

      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);
      setup.row(NANO_X_KEY).remove!();
      await flushPromises();

      expect(setup.removeKnownDevice).toHaveBeenCalledWith(knownNanoX);
    });

    it("should stay in Discovering when a device is removed", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.row(NANO_X_KEY).remove!();

      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });
  });

  describe("Pause and resume", () => {
    it("should not start discovery when the machine starts paused", () => {
      const setup = setupTest({ isPaused: true });

      setup.machine.start();

      expect(setup.deviceDiscoveryService.start).not.toHaveBeenCalled();
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("should stop discovery when the machine is paused", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.machine.pause();

      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
    });

    it("should start discovery again when the machine resumes in Discovering", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.machine.pause();
      setup.machine.resume();

      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("should start discovery again when the machine resumes in WaitingForDevice", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.row(NANO_X_KEY).connect();
      setup.machine.pause();
      setup.machine.resume();

      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("should not start discovery when the machine resumes in Connecting", () => {
      const setup = setupTest({ connect: jest.fn(() => new Promise(() => undefined)) });

      startWithNanoXAvailable(setup);
      setup.row(NANO_X_KEY).connect();
      setup.machine.pause();
      setup.machine.resume();

      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    });

    it("should not start discovery when the list shows again while paused", () => {
      const setup = setupTest({ connect: jest.fn(() => new Promise(() => undefined)) });

      startWithNanoXAvailable(setup);
      setup.row(NANO_X_KEY).connect();
      setup.machine.pause();
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Connecting).close();

      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    });

    it("should start discovery again on resume after onConnected", async () => {
      const setup = setupTest();

      await connectToNanoX(setup);
      setup.machine.resume();

      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("should start discovery again when the machine resumes in the Add mode while it discovers", () => {
      const setup = setupTest();

      openAddMode(setup);
      setup.machine.pause();
      setup.machine.resume();

      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("should not start discovery when the machine resumes in the Add mode while it connects", () => {
      const setup = setupTest({ connect: jest.fn(() => new Promise(() => undefined)) });

      openAddMode(setup);
      setup.discoverDevices([newNanoS]);
      selectInAddMode(setup, newNanoS);
      setup.machine.pause();
      setup.machine.resume();

      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    });
  });

  describe("stop", () => {
    it("should stop discovery when the machine is stopped", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.machine.stop();

      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
    });

    it("should neither disconnect nor call onConnected when a connection succeeds after the machine is stopped", async () => {
      let resolveConnect: (sessionId: string) => void = () => undefined;
      const setup = setupTest({
        connect: jest.fn(() => new Promise<string>(resolve => (resolveConnect = resolve))),
      });

      startWithNanoXAvailable(setup);
      setup.row(NANO_X_KEY).connect();
      await flushPromises();
      setup.machine.stop();
      resolveConnect("nano-x-session");
      await flushPromises();

      expect(setup.disconnect).not.toHaveBeenCalled();
      expect(setup.onConnected).not.toHaveBeenCalled();
    });

    it("should neither disconnect nor call onConnected when the machine is stopped in the Add mode", async () => {
      let resolveConnect: (sessionId: string) => void = () => undefined;
      const setup = setupTest({
        connect: jest.fn(() => new Promise<string>(resolve => (resolveConnect = resolve))),
      });

      openAddMode(setup);
      setup.discoverDevices([newNanoS]);
      selectInAddMode(setup, newNanoS);
      setup.machine.stop();
      resolveConnect("new-nano-s-session");
      await flushPromises();

      expect(setup.disconnect).not.toHaveBeenCalled();
      expect(setup.onConnected).not.toHaveBeenCalled();
    });

    it("should emit no state after the machine is stopped", () => {
      const setup = setupTest();

      setup.machine.start();
      setup.machine.stop();
      const statesCount = setup.states.length;
      setup.knownDevices$.next([knownNanoX, knownStax]);

      expect(setup.states).toHaveLength(statesCount);
    });
  });

  describe("Failures", () => {
    it("should send the error to the observer when onConnected throws", () => {
      const failure = new Error("caller failed");
      const setup = setupTest({
        onConnected: jest.fn(() => {
          throw failure;
        }),
      });

      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);
      setup.row(NANO_X_KEY).connect();

      expect(setup.observer.error).toHaveBeenCalledWith(failure);
    });

    it("should send the error to the observer and stop discovery when the connected devices fail", () => {
      const failure = new Error("session state failed");
      const setup = setupTest();

      setup.machine.start();
      setup.connectedDevices$.error(failure);

      expect(setup.observer.error).toHaveBeenCalledWith(failure);
      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
    });
  });
});
