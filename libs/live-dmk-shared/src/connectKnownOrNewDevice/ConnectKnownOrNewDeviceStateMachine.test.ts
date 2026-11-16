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
  type ConnectKnownOrNewDeviceUIState,
  type ConnectKnownOrNewDeviceUIStateType,
  type DeviceListItem,
  type SelectableDeviceListItem,
} from "./types";
import type { KnownDevice } from "../connectDevice/types";
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

const knownNanoX: KnownDevice = {
  transport: bleTransport,
  deviceModelId: DeviceModelId.nanoX,
  id: "nano-x-id",
  name: "My Nano X",
  lastUsedAt: 100,
};

const knownStax: KnownDevice = {
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
  readonly knownDevices?: Array<KnownDevice>;
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
    listConnectedDevices: jest.fn(() => connectedDevices$.value),
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

  const activeList = () => {
    const state = lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering);
    if (state.isPaused) {
      throw new Error("the list is paused");
    }
    return state;
  };

  const row = (key: string): SelectableDeviceListItem => {
    const found = activeList().devices.find(device => device.key === key);
    if (!found) {
      throw new Error(`no row ${key}`);
    }
    return found;
  };

  const listedDevice = (key: string): DeviceListItem => {
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
    activeList,
    connect,
    connectedDevices$,
    deviceDiscoveryService,
    disconnect,
    discoverDevices: (devices: Array<DiscoveredDevice>) => discoveredDevices.next(devices),
    dmk,
    emitDiscoveryError: (error: UnknownDiscoveryError) => errors.next(error),
    knownDevices$,
    lastState,
    listedDevice,
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

const connectedRow = (setup: Setup, key: string) => {
  const found = setup.row(key);
  if (found.status !== DeviceListItemStatuses.Connected) {
    throw new Error(`${key} is not connected`);
  }
  return found;
};

const openAddMode = (setup: Setup) => {
  setup.machine.start();
  setup.activeList().addNewDevice();
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
    it("GIVEN a machine, WHEN it starts, THEN it should start discovery on every transport", () => {
      // GIVEN
      const { deviceDiscoveryService, machine } = setupTest();

      // WHEN
      machine.start();

      // THEN
      expect(deviceDiscoveryService.start).toHaveBeenCalledWith({ ignoreTransportIdentifiers: [] });
    });

    it("GIVEN known devices and nothing discovered, WHEN the machine starts, THEN it should emit the known devices as unavailable", () => {
      // GIVEN
      const { lastState, machine } = setupTest();

      // WHEN
      machine.start();

      // THEN
      expect(lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toEqual({
        type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
        isPaused: false,
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

    it("GIVEN a known device, WHEN discovery finds it, THEN it should emit it as available", () => {
      // GIVEN
      const setup = setupTest();

      // WHEN
      startWithNanoXAvailable(setup);

      // THEN
      expect(setup.row(NANO_X_KEY).status).toBe(DeviceListItemStatuses.Available);
    });

    it("GIVEN a started machine, WHEN discovery finds a USB device, THEN it should emit it without remove", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();

      // WHEN
      setup.discoverDevices([flexUsb]);

      // THEN
      expect(setup.row(FLEX_KEY)).toEqual(
        expect.not.objectContaining({ remove: expect.anything() }),
      );
    });

    it("GIVEN a started machine, WHEN a known device is connected, THEN it should emit it with disconnect", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();

      // WHEN
      setup.setConnectedDevices([makeConnectedDevice()]);

      // THEN
      expect(setup.row(NANO_X_KEY)).toEqual(
        expect.objectContaining({
          status: DeviceListItemStatuses.Connected,
          disconnect: expect.any(Function),
          remove: expect.any(Function),
        }),
      );
    });

    it("GIVEN a started machine, WHEN the known devices change, THEN it should emit the new list", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();

      // WHEN
      setup.knownDevices$.next([knownNanoX, knownStax]);

      // THEN
      expect(
        setup
          .lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)
          .devices.map(({ key }) => key),
      ).toEqual([STAX_KEY, NANO_X_KEY]);
    });

    it("GIVEN discovery found a device and then stopped, WHEN the connected devices change, THEN it should keep the devices of the last scan", () => {
      // GIVEN
      const setup = setupTest();
      startWithNanoXAvailable(setup);
      setup.machine.pause();

      // WHEN
      setup.setConnectedDevices([]);

      // THEN
      expect(setup.listedDevice(NANO_X_KEY).status).toBe(DeviceListItemStatuses.Available);
    });
  });

  describe("Tapping a device", () => {
    it("GIVEN a connected known device, WHEN it is tapped, THEN it should call onConnected with its session", () => {
      // GIVEN
      const setup = setupTest();
      const connectedNanoX = makeConnectedDevice();
      setup.machine.start();
      setup.setConnectedDevices([connectedNanoX]);

      // WHEN
      setup.row(NANO_X_KEY).connect();

      // THEN
      expect(setup.onConnected).toHaveBeenCalledWith({
        sessionId: "nano-x-session",
        connectedDevice: connectedNanoX,
        dmk: setup.dmk,
        compatDeviceId: "nano-x-id",
        compatDeviceName: "Nano X 1A2B",
        compatDeviceWired: false,
      });
      expect(setup.connect).not.toHaveBeenCalled();
    });

    it("GIVEN a connected device that is not known, WHEN it is tapped, THEN it should call onConnected with its session", () => {
      // GIVEN
      const setup = setupTest({ knownDevices: [] });
      setup.machine.start();
      setup.setConnectedDevices([connectedFlex]);

      // WHEN
      setup.row("connected:flex-session").connect();

      // THEN
      expect(setup.onConnected).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "flex-session", compatDeviceWired: true }),
      );
    });

    it("GIVEN a connected device, WHEN it is tapped, THEN it should stop discovery and stay in Discovering", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);

      // WHEN
      setup.row(NANO_X_KEY).connect();

      // THEN
      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("GIVEN an available device, WHEN it is tapped, THEN it should stop discovery and emit Connecting", () => {
      // GIVEN
      const setup = setupTest();
      startWithNanoXAvailable(setup);

      // WHEN
      setup.row(NANO_X_KEY).connect();

      // THEN
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

    it("GIVEN an unavailable device, WHEN it is tapped, THEN it should emit WaitingForDevice", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();

      // WHEN
      setup.row(NANO_X_KEY).connect();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice)).toEqual({
        type: ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice,
        devices: [expect.objectContaining({ key: NANO_X_KEY })],
        device: expect.objectContaining({ id: "nano-x-id" }),
        showDeviceNotFound: false,
        addNewDevice: expect.any(Function),
        close: expect.any(Function),
      });
    });

    it("GIVEN a row from an older list, WHEN it is tapped, THEN it should follow the current status of the device", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      const unavailableRow = setup.row(NANO_X_KEY);
      setup.discoverDevices([nanoX]);

      // WHEN
      unavailableRow.connect();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Connecting)).toBeDefined();
    });

    it("GIVEN a device that is no longer listed, WHEN its row is tapped, THEN it should ignore the tap", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      const removedRow = setup.row(NANO_X_KEY);
      setup.knownDevices$.next([]);
      const statesCount = setup.states.length;

      // WHEN
      removedRow.connect();

      // THEN
      expect(setup.states).toHaveLength(statesCount);
    });
  });

  describe("WaitingForDevice", () => {
    const waitForNanoX = (setup: Setup) => {
      setup.machine.start();
      setup.row(NANO_X_KEY).connect();
    };

    it("GIVEN an unavailable device, WHEN the machine waits for it, THEN it should keep discovery running", () => {
      // GIVEN
      const setup = setupTest();

      // WHEN
      waitForNanoX(setup);

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
      expect(setup.deviceDiscoveryService.stop).not.toHaveBeenCalled();
    });

    it("GIVEN the machine waits for a device, WHEN discovery finds it, THEN it should connect to the device", async () => {
      // GIVEN
      const setup = setupTest();
      waitForNanoX(setup);

      // WHEN
      setup.discoverDevices([nanoX]);

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Connecting).device.id).toBe(
        "nano-x-id",
      );

      // WHEN
      await flushPromises();

      // THEN
      expect(setup.connect).toHaveBeenCalledWith({
        device: nanoX,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
    });

    it("GIVEN the machine waits for a device, WHEN discovery finds another device, THEN it should keep waiting", () => {
      // GIVEN
      const setup = setupTest({ knownDevices: [knownNanoX, knownStax] });
      waitForNanoX(setup);

      // WHEN
      setup.discoverDevices([flexUsb]);

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice)).toBeDefined();
      expect(setup.connect).not.toHaveBeenCalled();
    });

    it("GIVEN the machine waits for a device, WHEN the device gets a session, THEN it should stop discovery, call onConnected with that session and go back to the list", () => {
      // GIVEN
      const setup = setupTest();
      const connectedNanoX = makeConnectedDevice();
      waitForNanoX(setup);

      // WHEN
      setup.setConnectedDevices([connectedNanoX]);

      // THEN
      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
      expect(setup.onConnected).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "nano-x-session", connectedDevice: connectedNanoX }),
      );
      expect(setup.connect).not.toHaveBeenCalled();
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("GIVEN the machine waits for a device, WHEN less than the default delay has elapsed, THEN it should not show the hint", () => {
      // GIVEN
      const setup = setupTest();
      waitForNanoX(setup);

      // WHEN
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY - 1);

      // THEN
      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).showDeviceNotFound,
      ).toBe(false);
    });

    it("GIVEN the machine waits for a device, WHEN the default delay has elapsed, THEN it should show the hint", () => {
      // GIVEN
      const setup = setupTest();
      waitForNanoX(setup);

      // WHEN
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);

      // THEN
      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).showDeviceNotFound,
      ).toBe(true);
    });

    it("GIVEN an injected delay and the machine waits for a device, WHEN the injected delay has elapsed, THEN it should show the hint", () => {
      // GIVEN
      const setup = setupTest({ delays: { deviceNotFoundDelay: 1_000 } });
      waitForNanoX(setup);

      // WHEN
      jest.advanceTimersByTime(1_000);

      // THEN
      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).showDeviceNotFound,
      ).toBe(true);
    });

    it("GIVEN the hint was shown and WaitingForDevice was closed, WHEN the user waits for the device again, THEN it should hide the hint", () => {
      // GIVEN
      const setup = setupTest();
      waitForNanoX(setup);
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).close();

      // WHEN
      setup.row(NANO_X_KEY).connect();

      // THEN
      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).showDeviceNotFound,
      ).toBe(false);
    });

    it("GIVEN the hint is shown, WHEN it is tapped, THEN it should open the Add mode", () => {
      // GIVEN
      const setup = setupTest();
      waitForNanoX(setup);
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).addNewDevice!();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice)).toBeDefined();
    });

    it("GIVEN the machine waits for a device, WHEN WaitingForDevice is closed, THEN it should go back to the list with discovery still running", () => {
      // GIVEN
      const setup = setupTest();
      waitForNanoX(setup);

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).close();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.stop).not.toHaveBeenCalled();
    });

    it("GIVEN WaitingForDevice was closed, WHEN the default delay has elapsed, THEN it should not show the hint", () => {
      // GIVEN
      const setup = setupTest();
      waitForNanoX(setup);
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).close();

      // WHEN
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("GIVEN the machine waits for a device, WHEN discovery fails, THEN it should emit the DiscoveryError", () => {
      // GIVEN
      const setup = setupTest();
      waitForNanoX(setup);

      // WHEN
      setup.emitDiscoveryError(makeDiscoveryError());

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError)).toBeDefined();
    });
  });

  describe("Connecting", () => {
    it("GIVEN another connected session, WHEN an available device is tapped, THEN it should disconnect the other sessions before connecting", async () => {
      // GIVEN
      const disconnect = jest.fn().mockResolvedValue(undefined);
      const connect = jest.fn().mockResolvedValue("nano-x-session");
      const setup = setupTest({ connect, disconnect });
      startWithNanoXAvailable(setup);
      setup.setConnectedDevices([connectedFlex]);

      // WHEN
      setup.row(NANO_X_KEY).connect();
      await flushPromises();

      // THEN
      expect(disconnect).toHaveBeenCalledWith({ sessionId: "flex-session" });
      expect(disconnect.mock.invocationCallOrder[0]).toBeLessThan(
        connect.mock.invocationCallOrder[0],
      );
    });

    it("GIVEN disconnecting another session fails, WHEN an available device is tapped, THEN it should still connect and write a log", async () => {
      // GIVEN
      const logs: Array<Log> = [];
      const unsubscribe = listen(entry => logs.push(entry));
      const setup = setupTest({ disconnect: jest.fn().mockRejectedValue(new Error("busy")) });
      startWithNanoXAvailable(setup);
      setup.setConnectedDevices([connectedFlex]);

      // WHEN
      setup.row(NANO_X_KEY).connect();
      await flushPromises();
      unsubscribe();

      // THEN
      expect(setup.connect).toHaveBeenCalled();
      expect(logs).toContainEqual(
        expect.objectContaining({
          type: "disconnectOtherSessions",
          message: "failed to disconnect a session before a connection",
        }),
      );
    });

    it("GIVEN an available known device, WHEN the connection to it succeeds, THEN it should call onConnected with the new session", async () => {
      // GIVEN
      const setup = setupTest();

      // WHEN
      await connectToNanoX(setup);

      // THEN
      expect(setup.onConnected).toHaveBeenCalledTimes(1);
      expect(setup.onConnected).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "nano-x-session", dmk: setup.dmk }),
      );
    });

    it("GIVEN a discovered USB device that is not known, WHEN the connection to it succeeds, THEN it should call onConnected with the new session", async () => {
      // GIVEN
      const setup = setupTest({ connect: jest.fn().mockResolvedValue("flex-session") });
      setup.machine.start();
      setup.discoverDevices([flexUsb]);

      // WHEN
      setup.row(FLEX_KEY).connect();
      await flushPromises();

      // THEN
      expect(setup.onConnected).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "flex-session" }),
      );
    });

    it("GIVEN an available known device, WHEN the connection to it succeeds, THEN it should go back to the list without starting discovery", async () => {
      // GIVEN
      const setup = setupTest();

      // WHEN
      await connectToNanoX(setup);

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    });

    it("GIVEN the machine is connecting, WHEN Connecting is closed, THEN it should go back to the list and start discovery again", () => {
      // GIVEN
      const setup = setupTest();
      startWithNanoXAvailable(setup);
      setup.row(NANO_X_KEY).connect();

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Connecting).close();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("GIVEN Connecting was closed, WHEN the connection succeeds, THEN it should neither call onConnected nor disconnect", async () => {
      // GIVEN
      let resolveConnect: (sessionId: string) => void = () => undefined;
      const setup = setupTest({
        connect: jest.fn(() => new Promise<string>(resolve => (resolveConnect = resolve))),
      });
      startWithNanoXAvailable(setup);
      setup.row(NANO_X_KEY).connect();
      await flushPromises();
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Connecting).close();

      // WHEN
      resolveConnect("nano-x-session");
      await flushPromises();

      // THEN
      expect(setup.onConnected).not.toHaveBeenCalled();
      expect(setup.disconnect).not.toHaveBeenCalled();
    });

    it("GIVEN the connection fails, WHEN connecting to an available device, THEN it should emit the mapped ConnectionError for the device", async () => {
      // GIVEN
      const connectionError: BaseConnectionError = { type: "pairing-refused" };
      const setup = setupTest({
        connect: jest.fn().mockRejectedValue(new Error("refused")),
        mapConnectionError: jest.fn(() => connectionError),
      });

      // WHEN
      await connectToNanoX(setup);

      // THEN
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

    it("GIVEN a ConnectionError, WHEN it is retried, THEN it should connect again to the same device", async () => {
      // GIVEN
      const setup = await failToConnect();

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectionError).retry();
      await flushPromises();

      // THEN
      expect(setup.connect).toHaveBeenNthCalledWith(2, expect.objectContaining({ device: nanoX }));
      expect(setup.onConnected).toHaveBeenCalledTimes(1);
    });

    it("GIVEN a ConnectionError, WHEN it is ignored, THEN it should go back to the list and start discovery again", async () => {
      // GIVEN
      const setup = await failToConnect();

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectionError).ignore();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("GIVEN a ConnectionError, WHEN it is closed, THEN it should go back to the list and start discovery again", async () => {
      // GIVEN
      const setup = await failToConnect();

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectionError).close();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });
  });

  describe("Discovery errors", () => {
    it("GIVEN a started machine, WHEN discovery fails, THEN it should stop discovery and emit the DiscoveryError over the list", () => {
      // GIVEN
      const setup = setupTest();
      const error = makeDiscoveryError();
      setup.machine.start();

      // WHEN
      setup.emitDiscoveryError(error);

      // THEN
      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError)).toEqual({
        type: ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError,
        devices: [expect.objectContaining({ key: NANO_X_KEY })],
        error,
        ignore: expect.any(Function),
        close: expect.any(Function),
      });
    });

    it("GIVEN a started machine, WHEN discovery fails with an error that has a resolution, THEN it should offer retry", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();

      // WHEN
      setup.emitDiscoveryError(
        makeDiscoveryError({ resolution: { type: "prompt", retry: jest.fn() } }),
      );

      // THEN
      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).retry,
      ).toBeInstanceOf(Function);
    });

    it("GIVEN a DiscoveryError, WHEN it is ignored, THEN it should start discovery again without the error transport", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.emitDiscoveryError(makeDiscoveryError());

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).ignore();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("GIVEN a DiscoveryError, WHEN it is closed, THEN it should do the same as ignore", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.emitDiscoveryError(makeDiscoveryError());

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).close();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("GIVEN a DiscoveryError while the machine waits for a device, WHEN the error is ignored, THEN it should go back to the list without the waited device", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.row(NANO_X_KEY).connect();
      setup.emitDiscoveryError(makeDiscoveryError({ transportId: usbTransport }));

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).ignore();
      setup.discoverDevices([nanoX]);

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.connect).not.toHaveBeenCalled();
    });

    it("GIVEN a DiscoveryError with a resolution, WHEN the retry succeeds, THEN it should start discovery again", async () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.emitDiscoveryError(
        makeDiscoveryError({
          resolution: { type: "prompt", retry: jest.fn().mockResolvedValue(true) },
        }),
      );

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).retry!();
      await flushPromises();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [],
      });
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("GIVEN a DiscoveryError with a resolution, WHEN the retry fails, THEN it should emit the returned DiscoveryError", async () => {
      // GIVEN
      const setup = setupTest();
      const retryError = makeDiscoveryError({ transportId: usbTransport });
      setup.machine.start();
      setup.emitDiscoveryError(
        makeDiscoveryError({
          resolution: { type: "prompt", retry: jest.fn().mockResolvedValue(retryError) },
        }),
      );

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).retry!();
      await flushPromises();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).error).toBe(
        retryError,
      );
    });

    it("GIVEN a DiscoveryError with a resolution, WHEN the retry throws, THEN it should emit an unknown DiscoveryError", async () => {
      // GIVEN
      const setup = setupTest();
      const thrown = new Error("retry failed");
      setup.machine.start();
      setup.emitDiscoveryError(
        makeDiscoveryError({
          resolution: { type: "prompt", retry: jest.fn().mockRejectedValue(thrown) },
        }),
      );

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).retry!();
      await flushPromises();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).error).toEqual({
        type: BaseDiscoveryErrorTypes.Unknown,
        error: thrown,
      });
    });

    it("GIVEN a DiscoveryError retry in progress, WHEN the error is ignored, THEN it should start discovery again without the error transport", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.emitDiscoveryError(
        makeDiscoveryError({
          resolution: { type: "prompt", retry: jest.fn(() => new Promise(() => undefined)) },
        }),
      );
      const errorState = setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError);
      errorState.retry!();

      // WHEN
      errorState.ignore();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
    });

    it("GIVEN a DiscoveryError ignored while the machine is paused, WHEN the machine resumes, THEN it should start discovery again without the error transport", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.emitDiscoveryError(makeDiscoveryError());
      setup.machine.pause();
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.DiscoveryError).ignore();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);

      // WHEN
      setup.machine.resume();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
    });
  });

  describe("Add mode", () => {
    it("GIVEN the device list, WHEN the Add mode opens, THEN it should emit ConnectNewDevice with the Discovering state of the embedded flow", () => {
      // GIVEN
      const setup = setupTest();

      // WHEN
      openAddMode(setup);

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice)).toEqual({
        type: ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice,
        connectNewDeviceUIState: expect.objectContaining({
          type: ConnectNewDeviceUIStateTypes.Discovering,
          scanningTransports: [bleTransport, usbTransport],
        }),
        close: expect.any(Function),
      });
    });

    it("GIVEN the device list, WHEN the Add mode opens, THEN it should keep discovery running", () => {
      // GIVEN
      const setup = setupTest();

      // WHEN
      openAddMode(setup);

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
      expect(setup.deviceDiscoveryService.stop).not.toHaveBeenCalled();
    });

    it("GIVEN the Add mode is open, WHEN discovery finds a new device, THEN it should show the devices of the embedded flow", () => {
      // GIVEN
      const setup = setupTest();
      openAddMode(setup);

      // WHEN
      setup.discoverDevices([newNanoS]);

      // THEN
      expect(embeddedState(setup)).toEqual(
        expect.objectContaining({
          devices: [
            expect.objectContaining({ device: expect.objectContaining({ id: "new-nano-s-id" }) }),
          ],
        }),
      );
    });

    it("GIVEN the Add mode shows a new device, WHEN the embedded flow connects it, THEN it should call onConnected with the new session", async () => {
      // GIVEN
      const setup = setupTest({ connect: jest.fn().mockResolvedValue("new-nano-s-session") });
      openAddMode(setup);
      setup.discoverDevices([newNanoS]);

      // WHEN
      selectInAddMode(setup, newNanoS);
      await flushPromises();
      await flushPromises();

      // THEN
      expect(setup.onConnected).toHaveBeenCalledTimes(1);
      expect(setup.onConnected).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "new-nano-s-session" }),
      );
    });

    it("GIVEN the Add mode shows a new device, WHEN the embedded flow connects it, THEN it should go back to the list without starting discovery", async () => {
      // GIVEN
      const setup = setupTest({ connect: jest.fn().mockResolvedValue("new-nano-s-session") });
      openAddMode(setup);
      setup.discoverDevices([newNanoS]);

      // WHEN
      selectInAddMode(setup, newNanoS);
      await flushPromises();
      await flushPromises();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    });

    it("GIVEN the Add mode is open, WHEN it is closed, THEN it should go back to the list with discovery still running", () => {
      // GIVEN
      const setup = setupTest();
      openAddMode(setup);

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice).close();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
      expect(setup.deviceDiscoveryService.stop).not.toHaveBeenCalled();
    });

    it("GIVEN the Add mode was closed, WHEN discovery finds a device and time passes, THEN it should emit nothing from the embedded flow", () => {
      // GIVEN
      const setup = setupTest();
      openAddMode(setup);
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice).close();

      // WHEN
      setup.discoverDevices([newNanoS]);
      jest.advanceTimersByTime(60_000);

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("GIVEN the Add mode is open, WHEN discovery fails, THEN it should let the embedded flow show the discovery error", () => {
      // GIVEN
      const setup = setupTest();
      openAddMode(setup);

      // WHEN
      setup.emitDiscoveryError(makeDiscoveryError());

      // THEN
      expect(embeddedState(setup).type).toBe(ConnectNewDeviceUIStateTypes.DiscoveryError);
    });

    it("GIVEN a discovery error in the Add mode, WHEN the error is closed, THEN it should stay in the Add mode", () => {
      // GIVEN
      const setup = setupTest();
      openAddMode(setup);
      setup.emitDiscoveryError(makeDiscoveryError());
      const errorState = embeddedState(setup);
      if (errorState.type !== ConnectNewDeviceUIStateTypes.DiscoveryError) {
        throw new Error("expected a discovery error");
      }

      // WHEN
      errorState.close();

      // THEN
      expect(embeddedState(setup).type).toBe(ConnectNewDeviceUIStateTypes.Discovering);
    });

    it("GIVEN the embedded flow ignored a transport and the Add mode was closed, WHEN the list starts discovery again, THEN it should skip that transport", () => {
      // GIVEN
      const setup = setupTest();
      openAddMode(setup);
      setup.emitDiscoveryError(makeDiscoveryError());
      const errorState = embeddedState(setup);
      if (errorState.type !== ConnectNewDeviceUIStateTypes.DiscoveryError) {
        throw new Error("expected a discovery error");
      }
      errorState.ignore();
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.ConnectNewDevice).close();

      // WHEN
      setup.machine.pause();
      setup.machine.resume();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: [bleTransport],
      });
    });

    it("GIVEN a connection error mapping that throws, WHEN the embedded flow fails to connect a device, THEN it should send the error to the observer", async () => {
      // GIVEN
      const failure = new Error("mapping failed");
      const setup = setupTest({
        connect: jest.fn().mockRejectedValue(new Error("refused")),
        mapConnectionError: jest.fn(() => {
          throw failure;
        }),
      });
      openAddMode(setup);
      setup.discoverDevices([newNanoS]);

      // WHEN
      selectInAddMode(setup, newNanoS);
      await flushPromises();

      // THEN
      expect(setup.observer.error).toHaveBeenCalledWith(failure);
    });
  });

  describe("Disconnect and Remove", () => {
    it("GIVEN a connected device, WHEN the user disconnects it, THEN it should disconnect its session", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);
      const connectedRow = setup.row(NANO_X_KEY);
      if (connectedRow.status !== DeviceListItemStatuses.Connected) {
        throw new Error("expected a connected row");
      }

      // WHEN
      connectedRow.disconnect();

      // THEN
      expect(setup.disconnect).toHaveBeenCalledWith({ sessionId: "nano-x-session" });
    });

    it("GIVEN a connected device whose disconnect fails, WHEN the user disconnects it, THEN it should write a log", async () => {
      // GIVEN
      const logs: Array<Log> = [];
      const unsubscribe = listen(entry => logs.push(entry));
      const setup = setupTest({ disconnect: jest.fn().mockRejectedValue(new Error("busy")) });
      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);
      const connectedRow = setup.row(NANO_X_KEY);
      if (connectedRow.status !== DeviceListItemStatuses.Connected) {
        throw new Error("expected a connected row");
      }

      // WHEN
      connectedRow.disconnect();
      await flushPromises();
      unsubscribe();

      // THEN
      expect(logs).toContainEqual(
        expect.objectContaining({ message: "failed to disconnect a device" }),
      );
    });

    it("GIVEN a known device that is not connected, WHEN the user removes it, THEN it should remove the known device", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();

      // WHEN
      setup.row(NANO_X_KEY).remove!();

      // THEN
      expect(setup.removeKnownDevice).toHaveBeenCalledWith(knownNanoX);
      expect(setup.disconnect).not.toHaveBeenCalled();
    });

    it("GIVEN a connected known device, WHEN the user removes it, THEN it should disconnect it before removing it", async () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);

      // WHEN
      setup.row(NANO_X_KEY).remove!();

      // THEN
      expect(setup.removeKnownDevice).not.toHaveBeenCalled();

      // WHEN
      await flushPromises();

      // THEN
      expect(setup.disconnect).toHaveBeenCalledWith({ sessionId: "nano-x-session" });
      expect(setup.removeKnownDevice).toHaveBeenCalledWith(knownNanoX);
    });

    it("GIVEN a connected known device whose disconnect fails, WHEN the user removes it, THEN it should still remove it", async () => {
      // GIVEN
      const setup = setupTest({ disconnect: jest.fn().mockRejectedValue(new Error("busy")) });
      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);

      // WHEN
      setup.row(NANO_X_KEY).remove!();
      await flushPromises();

      // THEN
      expect(setup.removeKnownDevice).toHaveBeenCalledWith(knownNanoX);
    });

    it("GIVEN a known device, WHEN the user removes it, THEN it should stay in Discovering", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();

      // WHEN
      setup.row(NANO_X_KEY).remove!();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });
  });

  describe("Pause and resume", () => {
    it("GIVEN a paused machine, WHEN it starts, THEN it should not start discovery", () => {
      // GIVEN
      const setup = setupTest({ isPaused: true });

      // WHEN
      setup.machine.start();

      // THEN
      expect(setup.deviceDiscoveryService.start).not.toHaveBeenCalled();
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toBeDefined();
    });

    it("GIVEN a started machine, WHEN it is paused, THEN it should stop discovery", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();

      // WHEN
      setup.machine.pause();

      // THEN
      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
    });

    it("GIVEN a started machine, WHEN it is paused, THEN it should emit the list without the device actions and without Add", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();

      // WHEN
      setup.machine.pause();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering)).toEqual({
        type: ConnectKnownOrNewDeviceUIStateTypes.Discovering,
        isPaused: true,
        devices: [
          {
            key: NANO_X_KEY,
            device: expect.objectContaining({ id: "nano-x-id" }),
            connectivity: "BLE",
            status: DeviceListItemStatuses.Unavailable,
          },
        ],
      });
    });

    it("GIVEN a paused machine, WHEN it resumes, THEN it should emit the list with the device actions and Add", () => {
      // GIVEN
      const setup = setupTest({ isPaused: true });
      setup.machine.start();

      // WHEN
      setup.machine.resume();

      // THEN
      expect(setup.activeList().addNewDevice).toEqual(expect.any(Function));
      expect(setup.row(NANO_X_KEY).connect).toEqual(expect.any(Function));
    });

    it("GIVEN a connected device, WHEN it is tapped, THEN it should emit the list as paused", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);

      // WHEN
      setup.row(NANO_X_KEY).connect();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering).isPaused).toBe(true);
    });

    it("GIVEN an available device, WHEN the connection to it succeeds, THEN it should emit the list as paused", async () => {
      // GIVEN
      const setup = setupTest();

      // WHEN
      await connectToNanoX(setup);

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering).isPaused).toBe(true);
    });

    it("GIVEN the device actions and Add of a list emitted before the pause, WHEN they are used while paused, THEN it should ignore them", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.discoverDevices([flexUsb]);
      setup.setConnectedDevices([makeConnectedDevice()]);
      const connectedNanoX = connectedRow(setup, NANO_X_KEY);
      const availableFlex = setup.row(FLEX_KEY);
      const { addNewDevice } = setup.activeList();
      setup.machine.pause();

      // WHEN
      connectedNanoX.connect();
      connectedNanoX.disconnect();
      connectedNanoX.remove!();
      availableFlex.connect();
      addNewDevice();

      // THEN
      expect(setup.onConnected).not.toHaveBeenCalled();
      expect(setup.disconnect).not.toHaveBeenCalled();
      expect(setup.removeKnownDevice).not.toHaveBeenCalled();
      expect(setup.connect).not.toHaveBeenCalled();
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Discovering).isPaused).toBe(true);
    });

    it("GIVEN the machine waits for a device, WHEN it is paused, THEN it should emit WaitingForDevice without addNewDevice", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.row(NANO_X_KEY).connect();

      // WHEN
      setup.machine.pause();

      // THEN
      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).addNewDevice,
      ).toBeUndefined();
    });

    it("GIVEN the machine waits for a device while paused, WHEN it resumes, THEN it should emit WaitingForDevice with addNewDevice", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.row(NANO_X_KEY).connect();
      setup.machine.pause();

      // WHEN
      setup.machine.resume();

      // THEN
      expect(
        setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice).addNewDevice,
      ).toEqual(expect.any(Function));
    });

    it("GIVEN the hint of a WaitingForDevice emitted before the pause, WHEN it is tapped while paused, THEN it should ignore it", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.row(NANO_X_KEY).connect();
      const { addNewDevice } = setup.lastState(
        ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice,
      );
      setup.machine.pause();

      // WHEN
      addNewDevice!();

      // THEN
      expect(setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.WaitingForDevice)).toBeDefined();
    });

    it("GIVEN a machine paused in Discovering, WHEN it resumes, THEN it should start discovery again", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.machine.pause();

      // WHEN
      setup.machine.resume();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("GIVEN a machine paused in WaitingForDevice, WHEN it resumes, THEN it should start discovery again", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.row(NANO_X_KEY).connect();
      setup.machine.pause();

      // WHEN
      setup.machine.resume();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("GIVEN a machine paused in Connecting, WHEN it resumes, THEN it should not start discovery", () => {
      // GIVEN
      const setup = setupTest({ connect: jest.fn(() => new Promise(() => undefined)) });
      startWithNanoXAvailable(setup);
      setup.row(NANO_X_KEY).connect();
      setup.machine.pause();

      // WHEN
      setup.machine.resume();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    });

    it("GIVEN a machine paused in Connecting, WHEN the list shows again, THEN it should not start discovery", () => {
      // GIVEN
      const setup = setupTest({ connect: jest.fn(() => new Promise(() => undefined)) });
      startWithNanoXAvailable(setup);
      setup.row(NANO_X_KEY).connect();
      setup.machine.pause();

      // WHEN
      setup.lastState(ConnectKnownOrNewDeviceUIStateTypes.Connecting).close();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    });

    it("GIVEN onConnected was called, WHEN the machine resumes, THEN it should start discovery again", async () => {
      // GIVEN
      const setup = setupTest();
      await connectToNanoX(setup);

      // WHEN
      setup.machine.resume();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("GIVEN a machine paused in the Add mode while it discovers, WHEN it resumes, THEN it should start discovery again", () => {
      // GIVEN
      const setup = setupTest();
      openAddMode(setup);
      setup.machine.pause();

      // WHEN
      setup.machine.resume();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
    });

    it("GIVEN a machine paused in the Add mode while it connects, WHEN it resumes, THEN it should not start discovery", () => {
      // GIVEN
      const setup = setupTest({ connect: jest.fn(() => new Promise(() => undefined)) });
      openAddMode(setup);
      setup.discoverDevices([newNanoS]);
      selectInAddMode(setup, newNanoS);
      setup.machine.pause();

      // WHEN
      setup.machine.resume();

      // THEN
      expect(setup.deviceDiscoveryService.start).toHaveBeenCalledTimes(1);
    });
  });

  describe("stop", () => {
    it("GIVEN a started machine, WHEN it is stopped, THEN it should stop discovery", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();

      // WHEN
      setup.machine.stop();

      // THEN
      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
    });

    it("GIVEN the machine was stopped while it connects, WHEN the connection succeeds, THEN it should neither disconnect nor call onConnected", async () => {
      // GIVEN
      let resolveConnect: (sessionId: string) => void = () => undefined;
      const setup = setupTest({
        connect: jest.fn(() => new Promise<string>(resolve => (resolveConnect = resolve))),
      });
      startWithNanoXAvailable(setup);
      setup.row(NANO_X_KEY).connect();
      await flushPromises();
      setup.machine.stop();

      // WHEN
      resolveConnect("nano-x-session");
      await flushPromises();

      // THEN
      expect(setup.disconnect).not.toHaveBeenCalled();
      expect(setup.onConnected).not.toHaveBeenCalled();
    });

    it("GIVEN the machine was stopped while the Add mode connects, WHEN the connection succeeds, THEN it should neither disconnect nor call onConnected", async () => {
      // GIVEN
      let resolveConnect: (sessionId: string) => void = () => undefined;
      const setup = setupTest({
        connect: jest.fn(() => new Promise<string>(resolve => (resolveConnect = resolve))),
      });
      openAddMode(setup);
      setup.discoverDevices([newNanoS]);
      selectInAddMode(setup, newNanoS);
      setup.machine.stop();

      // WHEN
      resolveConnect("new-nano-s-session");
      await flushPromises();

      // THEN
      expect(setup.disconnect).not.toHaveBeenCalled();
      expect(setup.onConnected).not.toHaveBeenCalled();
    });

    it("GIVEN a stopped machine, WHEN the known devices change, THEN it should emit no state", () => {
      // GIVEN
      const setup = setupTest();
      setup.machine.start();
      setup.machine.stop();
      const statesCount = setup.states.length;

      // WHEN
      setup.knownDevices$.next([knownNanoX, knownStax]);

      // THEN
      expect(setup.states).toHaveLength(statesCount);
    });
  });

  describe("Failures", () => {
    it("GIVEN onConnected throws, WHEN a connected device is tapped, THEN it should send the error to the observer", () => {
      // GIVEN
      const failure = new Error("caller failed");
      const setup = setupTest({
        onConnected: jest.fn(() => {
          throw failure;
        }),
      });
      setup.machine.start();
      setup.setConnectedDevices([makeConnectedDevice()]);

      // WHEN
      setup.row(NANO_X_KEY).connect();

      // THEN
      expect(setup.observer.error).toHaveBeenCalledWith(failure);
    });

    it("GIVEN a started machine, WHEN the connected devices fail, THEN it should send the error to the observer and stop discovery", () => {
      // GIVEN
      const failure = new Error("session state failed");
      const setup = setupTest();
      setup.machine.start();

      // WHEN
      setup.connectedDevices$.error(failure);

      // THEN
      expect(setup.observer.error).toHaveBeenCalledWith(failure);
      expect(setup.deviceDiscoveryService.stop).toHaveBeenCalledTimes(1);
    });
  });
});
