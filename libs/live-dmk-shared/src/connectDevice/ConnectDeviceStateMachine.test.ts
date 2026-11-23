import {
  type ConnectedDevice,
  DeviceModelId as DMKDeviceModelId,
  type DeviceManagementKit,
  type DiscoveredDevice,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { Subject, type Observer } from "rxjs";

import { DefaultConnectDeviceStateMachine } from "./ConnectDeviceStateMachine";
import {
  ConnectDeviceUIStateTypes,
  DisplayedDevice,
  type ConnectDeviceConnectNewDeviceInput,
  type ConnectDeviceMapConnectionError,
  type ConnectDeviceMatchDiscoveredDevices,
  type ConnectDeviceUIState,
  type KnownDevice,
  type MatchedDevice,
} from "./types";
import { dmkToLedgerDeviceIdMap } from "../config/dmkToLedgerDeviceIdMap";
import { DEFAULT_DEVICE_NOT_FOUND_DELAY } from "../connectKnownOrNewDevice/constants";
import { DEFAULT_SUCCESS_DELAY } from "../connectNewDevice/constants";
import { ConnectNewDeviceUIStateTypes, type SelectableDevice } from "../connectNewDevice/types";
import {
  BaseConnectionErrorTypes,
  BaseDiscoveryErrorTypes,
  type UnknownConnectionError,
  type UnknownDiscoveryError,
} from "../deviceConnectivity/types";
import { createFakeDeviceDiscoveryService } from "../deviceConnectivity/discoveryService/__test-utils__/createFakeDeviceDiscoveryService";

// Test helpers
const testTransport = "RN_BLE" as TransportIdentifier;

const knownDeviceA: KnownDevice = {
  transport: testTransport,
  deviceModelId: DeviceModelId.nanoX,
  id: "known-device-a",
  name: "Ledger Nano X",
};

const knownDeviceB: KnownDevice = {
  transport: testTransport,
  deviceModelId: DeviceModelId.nanoSP,
  id: "known-device-b",
  name: "Ledger Nano S Plus",
};

const knownDeviceC: KnownDevice = {
  transport: testTransport,
  deviceModelId: DeviceModelId.stax,
  id: "known-device-c",
  name: "Ledger Stax",
};

const deviceModelByKnownDeviceModelId: Partial<
  Record<DeviceModelId, DiscoveredDevice["deviceModel"]>
> = {
  [DeviceModelId.nanoX]: {
    id: DeviceModelId.nanoX,
    model: DMKDeviceModelId.NANO_X,
    name: "Ledger Nano X",
  },
  [DeviceModelId.nanoSP]: {
    id: DeviceModelId.nanoSP,
    model: DMKDeviceModelId.NANO_SP,
    name: "Ledger Nano S Plus",
  },
  [DeviceModelId.stax]: {
    id: DeviceModelId.stax,
    model: DMKDeviceModelId.STAX,
    name: "Ledger Stax",
  },
};

const makeDiscoveredDevice = (overrides: Partial<DiscoveredDevice> = {}): DiscoveredDevice =>
  ({
    id: "discovered-device-a",
    name: "Ledger Nano X",
    deviceModel: {
      id: DeviceModelId.nanoX,
      model: DMKDeviceModelId.NANO_X,
      name: "Ledger Nano X",
    },
    transport: testTransport,
    ...overrides,
  }) as DiscoveredDevice;

const makeDiscoveredDeviceFromKnownDevice = (
  knownDevice: KnownDevice,
  overrides: Partial<DiscoveredDevice> = {},
): DiscoveredDevice => {
  const deviceModel = deviceModelByKnownDeviceModelId[knownDevice.deviceModelId];

  return makeDiscoveredDevice({
    id: knownDevice.id,
    name: knownDevice.name ?? "Discovered Device",
    ...(deviceModel ? { deviceModel } : {}),
    ...overrides,
  });
};

const makeConnectedDevice = (overrides: Partial<ConnectedDevice> = {}): ConnectedDevice =>
  ({
    id: "connected-device-a",
    sessionId: "session-id",
    modelId: DMKDeviceModelId.NANO_X,
    name: "Ledger Nano X",
    type: "BLE",
    transport: testTransport,
    ...overrides,
  }) as ConnectedDevice;

const addFlowInput: ConnectDeviceConnectNewDeviceInput = {
  getDiscoveredDeviceKey: ({ transport, id }) => `${transport}:${id}`,
  filterListedDevices: listedDevices => listedDevices,
};

const lastState = <TType extends ConnectDeviceUIState["type"]>(
  states: Array<ConnectDeviceUIState>,
  type: TType,
) => {
  const state = states[states.length - 1];
  expect(state?.type).toBe(type);
  return state as Extract<ConnectDeviceUIState, { type: TType }>;
};

const lastEmbeddedState = (states: Array<ConnectDeviceUIState>) =>
  lastState(states, ConnectDeviceUIStateTypes.ConnectNewDevice).connectNewDeviceUIState;

const listedDeviceIds = (states: Array<ConnectDeviceUIState>) => {
  const embeddedState = lastEmbeddedState(states);
  expect(embeddedState.type).toBe(ConnectNewDeviceUIStateTypes.Discovering);
  return (embeddedState as { devices: Array<SelectableDevice> }).devices.map(
    ({ device }) => device.id,
  );
};

const makeDiscoveryError = (
  overrides: Partial<Omit<UnknownDiscoveryError, "type">> = {},
): UnknownDiscoveryError => ({
  type: BaseDiscoveryErrorTypes.Unknown,
  transportId: testTransport,
  ...overrides,
});

type SetupTestOptions = {
  readonly knownDevices?: Array<KnownDevice>;
  readonly dmk?: DeviceManagementKit;
  readonly sessionId?: string | null;
  readonly connect?: jest.MockedFunction<DeviceManagementKit["connect"]>;
  readonly mapConnectionError?: ConnectDeviceMapConnectionError;
  readonly matchDiscoveredDevices?: ConnectDeviceMatchDiscoveredDevices;
  readonly onConnected?: jest.Mock;
  readonly buildCompatDeviceId?: (device: ConnectedDevice) => string;
  readonly connectNewDevice?: ConnectDeviceConnectNewDeviceInput | null;
  readonly acceptedDeviceModelIds?: Array<DeviceModelId>;
};

const defaultMatchDiscoveredDevices: ConnectDeviceMatchDiscoveredDevices = (
  discoveredDevices,
  knownDevices,
) =>
  discoveredDevices
    .map(discoveredDevice => {
      const knownDevice = knownDevices.find(
        knownDevice =>
          knownDevice.transport === discoveredDevice.transport &&
          knownDevice.id === discoveredDevice.id &&
          dmkToLedgerDeviceIdMap[discoveredDevice.deviceModel.model] === knownDevice.deviceModelId,
      );

      return knownDevice ? { knownDevice, discoveredDevice } : null;
    })
    .filter((matchedDevice): matchedDevice is MatchedDevice => matchedDevice !== null);

const setupTest = (options: SetupTestOptions = {}) => {
  const {
    knownDevices = [
      {
        transport: testTransport,
        deviceModelId: DeviceModelId.nanoX,
        id: "known-device-a",
        name: "Ledger Nano X",
      },
    ],
    sessionId = null,
    connect = jest.fn().mockResolvedValue("session-id"),
    mapConnectionError = jest.fn(error => ({ type: BaseConnectionErrorTypes.Unknown, error })),
    matchDiscoveredDevices = defaultMatchDiscoveredDevices,
    onConnected = jest.fn(),
    buildCompatDeviceId,
    connectNewDevice = null,
    acceptedDeviceModelIds,
  } = options;
  const discoveredDevices = new Subject<Array<DiscoveredDevice>>();
  const errors = new Subject<UnknownDiscoveryError>();
  const dmk =
    options.dmk ??
    ({
      connect,
      getConnectedDevice: jest.fn(() => makeConnectedDevice()),
      listConnectedDevices: jest.fn(() => []),
    } as unknown as DeviceManagementKit);

  const states: Array<ConnectDeviceUIState> = [];
  const observer: Observer<ConnectDeviceUIState> = {
    next: state => states.push(state),
    error: jest.fn(),
    complete: jest.fn(),
  };

  const deviceDiscoveryService = createFakeDeviceDiscoveryService({
    transportIds: [testTransport],
    discoveredDevices,
    errors,
  });

  const machine: DefaultConnectDeviceStateMachine = new DefaultConnectDeviceStateMachine({
    knownDevices,
    dmk,
    sessionId,
    observer,
    deviceDiscoveryService,
    mapConnectionError,
    matchDiscoveredDevices,
    onConnected,
    connectNewDevice,
    ...(buildCompatDeviceId ? { buildCompatDeviceId } : {}),
    ...(acceptedDeviceModelIds ? { acceptedDeviceModelIds } : {}),
  });

  const discoverDevices = (devices: Array<DiscoveredDevice>) => discoveredDevices.next(devices);
  const emitDiscoveryError = (error: UnknownDiscoveryError) => errors.next(error);

  return {
    connect,
    discoverDevices,
    deviceDiscoveryService,
    emitDiscoveryError,
    machine,
    onConnected,
    states,
  };
};

// Tests
describe("ConnectDeviceStateMachine", () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  describe("Startup", () => {
    it("emits NoKnownDevice and does not start discovery when there are no known devices", () => {
      // Arrange
      const { deviceDiscoveryService, machine, states } = setupTest({ knownDevices: [] });

      // Act
      machine.start();

      // Assert
      expect(states).toEqual([
        { type: ConnectDeviceUIStateTypes.NoKnownDevice, addNewDevice: null },
      ]);
      expect(deviceDiscoveryService.start).not.toHaveBeenCalled();
    });

    it("emits Connected and does not start discovery when a session already exists", () => {
      // Arrange
      const { deviceDiscoveryService, machine, onConnected, states } = setupTest({
        sessionId: "existing-session-id",
      });

      // Act
      machine.start();

      // Assert
      expect(states).toEqual([{ type: ConnectDeviceUIStateTypes.Connected }]);
      expect(deviceDiscoveryService.start).not.toHaveBeenCalled();
      expect(onConnected).toHaveBeenCalled();
    });

    it("emits WaitingForSelectedDevice and starts waiting for the selected device when there is only one known device", () => {
      // Arrange
      const { deviceDiscoveryService, machine, states } = setupTest({
        knownDevices: [knownDeviceA],
      });

      // Act
      machine.start();

      // Assert
      expect(states).toEqual([
        {
          type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice,
          device: knownDeviceA,
          showDeviceNotFound: false,
          addNewDevice: null,
        },
      ]);
      expect(deviceDiscoveryService.start).toHaveBeenCalledWith({ ignoreTransportIdentifiers: [] });
    });

    it("starts discovery and emits known devices as unavailable without a session", () => {
      // Arrange
      const { deviceDiscoveryService, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });

      // Act
      machine.start();

      // Assert
      expect(deviceDiscoveryService.start).toHaveBeenCalledWith({ ignoreTransportIdentifiers: [] });
      const discoveringState = states[states.length - 1];
      expect(discoveringState.type).toBe(ConnectDeviceUIStateTypes.Discovering);
      expect(
        (
          discoveringState as {
            type: typeof ConnectDeviceUIStateTypes.Discovering;
            devices: Array<DisplayedDevice>;
          }
        ).devices,
      ).toEqual([
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceA }),
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceB }),
      ]);
    });
  });

  describe("Discovery", () => {
    it("keeps devices unavailable when discovery reports no device", () => {
      // Arrange
      const { discoverDevices, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });

      // Act
      machine.start();
      discoverDevices([]);

      // Assert
      const discoveringState = states[states.length - 1];
      expect(discoveringState.type).toBe(ConnectDeviceUIStateTypes.Discovering);
      expect(
        (
          discoveringState as {
            type: typeof ConnectDeviceUIStateTypes.Discovering;
            devices: Array<DisplayedDevice>;
          }
        ).devices,
      ).toEqual([
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceA }),
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceB }),
      ]);
    });

    it("keeps devices unavailable when discovery reports no matching device", () => {
      // Arrange
      const { discoverDevices, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });

      // Act
      machine.start();
      discoverDevices([
        makeDiscoveredDevice({
          id: "unknown-device",
          name: "Unknown device",
        }),
      ]);

      // Assert
      const discoveringState = states[states.length - 1];
      expect(discoveringState.type).toBe(ConnectDeviceUIStateTypes.Discovering);
      expect(
        (
          discoveringState as {
            type: typeof ConnectDeviceUIStateTypes.Discovering;
            devices: Array<DisplayedDevice>;
          }
        ).devices,
      ).toEqual([
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceA }),
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceB }),
      ]);
    });

    it("marks matching known devices as available when discovery reports many matching devices", () => {
      // Arrange
      const { discoverDevices, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });

      // Act
      machine.start();
      discoverDevices([
        makeDiscoveredDeviceFromKnownDevice(knownDeviceA),
        makeDiscoveredDeviceFromKnownDevice(knownDeviceB),
      ]);

      // Assert
      const discoveringState = states[states.length - 1];
      expect(discoveringState.type).toBe(ConnectDeviceUIStateTypes.Discovering);
      expect(
        (
          discoveringState as {
            type: typeof ConnectDeviceUIStateTypes.Discovering;
            devices: Array<DisplayedDevice>;
          }
        ).devices,
      ).toEqual([
        expect.objectContaining({ type: "available", knownDevice: knownDeviceA }),
        expect.objectContaining({ type: "available", knownDevice: knownDeviceB }),
      ]);
    });

    it("marks only matching known devices as available when discovery reports many matches", () => {
      // Arrange
      const { discoverDevices, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB, knownDeviceC],
      });
      const discoveredDeviceA = makeDiscoveredDeviceFromKnownDevice(knownDeviceA, {
        name: "Renamed Nano X",
      });
      const discoveredDeviceB = makeDiscoveredDeviceFromKnownDevice(knownDeviceB, {
        name: "Renamed Nano S Plus",
      });

      // Act
      machine.start();
      discoverDevices([discoveredDeviceA, discoveredDeviceB]);

      // Assert
      const discoveringState = states[states.length - 1];
      expect(discoveringState.type).toBe(ConnectDeviceUIStateTypes.Discovering);
      expect(
        (
          discoveringState as {
            type: typeof ConnectDeviceUIStateTypes.Discovering;
            devices: Array<DisplayedDevice>;
          }
        ).devices,
      ).toEqual([
        expect.objectContaining({ type: "available", knownDevice: knownDeviceA }),
        expect.objectContaining({ type: "available", knownDevice: knownDeviceB }),
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceC }),
      ]);
    });
  });

  describe("Connection", () => {
    it("stops discovery, emits Connecting, and connects when one matching device is discovered", () => {
      // Arrange
      const { connect, deviceDiscoveryService, discoverDevices, machine, states } = setupTest();
      const discoveredDevice = makeDiscoveredDeviceFromKnownDevice(knownDeviceA);

      // Act
      machine.start();
      discoverDevices([discoveredDevice]);

      // Assert
      expect(deviceDiscoveryService.stop).toHaveBeenCalled();
      const connectingState = states[states.length - 1];
      expect(connectingState.type).toBe(ConnectDeviceUIStateTypes.Connecting);
      const connectingStateDevice = (
        connectingState as {
          type: typeof ConnectDeviceUIStateTypes.Connecting;
          device: KnownDevice;
        }
      ).device;
      expect(connectingStateDevice).toEqual(expect.objectContaining(knownDeviceA));
      expect(connect).toHaveBeenCalledWith({
        device: discoveredDevice,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
    });

    it("disconnects a session that connects after the machine stops", async () => {
      let finishConnect: (sessionId: string) => void = () => undefined;
      const connect = jest.fn(
        () =>
          new Promise<string>(resolve => {
            finishConnect = resolve;
          }),
      );
      const disconnect = jest.fn().mockResolvedValue(undefined);
      const dmk = {
        connect,
        disconnect,
        getConnectedDevice: jest.fn(),
        listConnectedDevices: jest.fn(() => []),
      } as unknown as DeviceManagementKit;
      const { discoverDevices, machine, onConnected } = setupTest({ dmk });

      machine.start();
      discoverDevices([makeDiscoveredDeviceFromKnownDevice(knownDeviceA)]);
      expect(connect).toHaveBeenCalledTimes(1);

      machine.stop();
      finishConnect("session-late");
      await Promise.resolve();
      await Promise.resolve();

      expect(disconnect).toHaveBeenCalledWith({ sessionId: "session-late" });
      expect(onConnected).not.toHaveBeenCalled();
    });

    it("emits Connected after a successful connection", async () => {
      // Arrange
      const { discoverDevices, machine, states, onConnected } = setupTest();

      // Act
      machine.start();
      discoverDevices([makeDiscoveredDeviceFromKnownDevice(knownDeviceA)]);

      // Wait for the connection to complete
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      const connectedState = states[states.length - 1];
      expect(connectedState.type).toBe(ConnectDeviceUIStateTypes.Connected);
    });

    it("calls onConnected with the connected device result after a successful connection", async () => {
      // Arrange
      const connectedDevice = makeConnectedDevice();
      const dmk = {
        connect: jest.fn().mockResolvedValue("session-id"),
        getConnectedDevice: jest.fn(() => connectedDevice),
        listConnectedDevices: jest.fn(() => []),
      } as unknown as DeviceManagementKit;
      const { discoverDevices, machine, onConnected } = setupTest({ dmk });

      // Act
      machine.start();
      discoverDevices([makeDiscoveredDeviceFromKnownDevice(knownDeviceA)]);

      // Wait for the connection to complete
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(dmk.getConnectedDevice).toHaveBeenCalledWith({ sessionId: "session-id" });
      expect(onConnected).toHaveBeenCalledTimes(1);
      expect(onConnected).toHaveBeenCalledWith({
        dmk,
        sessionId: "session-id",
        connectedDevice,
        compatDeviceId: connectedDevice.id,
        compatDeviceName: connectedDevice.name,
        compatDeviceWired: false,
      });
    });

    it("uses the configured compat device id builder for the connected device result", async () => {
      // Arrange
      const connectedDevice = makeConnectedDevice({ id: "usb_1002", type: "USB" });
      const buildCompatDeviceId = jest.fn(() => "custom-compat-id");
      const dmk = {
        connect: jest.fn().mockResolvedValue("session-id"),
        getConnectedDevice: jest.fn(() => connectedDevice),
        listConnectedDevices: jest.fn(() => []),
      } as unknown as DeviceManagementKit;
      const { discoverDevices, machine, onConnected } = setupTest({ dmk, buildCompatDeviceId });

      // Act
      machine.start();
      discoverDevices([makeDiscoveredDeviceFromKnownDevice(knownDeviceA)]);

      // Wait for the connection to complete
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(buildCompatDeviceId).toHaveBeenCalledWith(connectedDevice);
      expect(onConnected).toHaveBeenCalledWith(
        expect.objectContaining({
          compatDeviceId: "custom-compat-id",
          compatDeviceWired: true,
        }),
      );
    });

    it("connects to the selected available displayed device", () => {
      // Arrange
      const { connect, discoverDevices, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });
      const discoveredDeviceA = makeDiscoveredDeviceFromKnownDevice(knownDeviceA);
      const discoveredDeviceB = makeDiscoveredDeviceFromKnownDevice(knownDeviceB);

      // Act
      machine.start();
      discoverDevices([discoveredDeviceA, discoveredDeviceB]);
      const discoveringState = states[states.length - 1];
      const availableDevice = (
        discoveringState as {
          type: typeof ConnectDeviceUIStateTypes.Discovering;
          devices: Array<DisplayedDevice>;
        }
      ).devices[1];
      availableDevice.onSelect();

      // Assert
      expect(connect).toHaveBeenCalledWith({
        device: discoveredDeviceB,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      const connectingState = states[states.length - 1];
      expect(connectingState.type).toBe(ConnectDeviceUIStateTypes.Connecting);
      const connectingStateDevice = (
        connectingState as {
          type: typeof ConnectDeviceUIStateTypes.Connecting;
          device: KnownDevice;
        }
      ).device;
      expect(connectingStateDevice).toEqual(expect.objectContaining(knownDeviceB));
    });

    it("waits for a selected unavailable displayed device", () => {
      // Arrange
      const { machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });

      // Act
      machine.start();
      const discoveringState = states[states.length - 1];
      const unavailableDevice = (
        discoveringState as {
          type: typeof ConnectDeviceUIStateTypes.Discovering;
          devices: Array<DisplayedDevice>;
        }
      ).devices[0];
      unavailableDevice.onSelect();

      // Assert
      const waitingState = states[states.length - 1];
      expect(waitingState.type).toBe(ConnectDeviceUIStateTypes.WaitingForSelectedDevice);
      const waitingStateDevice = (
        waitingState as {
          type: typeof ConnectDeviceUIStateTypes.WaitingForSelectedDevice;
          device: KnownDevice;
        }
      ).device;
      expect(waitingStateDevice).toEqual(expect.objectContaining(knownDeviceA));
    });

    it("stays waiting when discovered many devices does not include the selected device", () => {
      // Arrange
      const { connect, discoverDevices, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB, knownDeviceC],
      });

      // Act
      machine.start();
      const discoveringState = states[states.length - 1];
      const unavailableDevice = (
        discoveringState as {
          type: typeof ConnectDeviceUIStateTypes.Discovering;
          devices: Array<DisplayedDevice>;
        }
      ).devices[0];
      unavailableDevice.onSelect();
      discoverDevices([
        makeDiscoveredDeviceFromKnownDevice(knownDeviceB),
        makeDiscoveredDeviceFromKnownDevice(knownDeviceC),
      ]);

      // Assert
      expect(connect).not.toHaveBeenCalled();
      const waitingState = states[states.length - 1];
      expect(waitingState.type).toBe(ConnectDeviceUIStateTypes.WaitingForSelectedDevice);
      const waitingStateDevice = (
        waitingState as {
          type: typeof ConnectDeviceUIStateTypes.WaitingForSelectedDevice;
          device: KnownDevice;
        }
      ).device;
      expect(waitingStateDevice).toEqual(expect.objectContaining(knownDeviceA));
    });

    it("connects when discovered many devices includes the selected device while waiting", () => {
      // Arrange
      const { connect, discoverDevices, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });
      const discoveredDeviceA = makeDiscoveredDeviceFromKnownDevice(knownDeviceA);
      const discoveredDeviceB = makeDiscoveredDeviceFromKnownDevice(knownDeviceB);

      // Act
      machine.start();
      const discoveringState = states[states.length - 1];
      expect(discoveringState.type).toBe(ConnectDeviceUIStateTypes.Discovering);
      const unavailableDevice = (
        discoveringState as {
          type: typeof ConnectDeviceUIStateTypes.Discovering;
          devices: Array<DisplayedDevice>;
        }
      ).devices[0];
      unavailableDevice.onSelect();
      discoverDevices([discoveredDeviceA, discoveredDeviceB]);

      // Assert
      expect(connect).toHaveBeenCalledWith({
        device: discoveredDeviceA,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      const connectingState = states[states.length - 1];
      expect(connectingState.type).toBe(ConnectDeviceUIStateTypes.Connecting);
      const connectingStateDevice = (
        connectingState as {
          type: typeof ConnectDeviceUIStateTypes.Connecting;
          device: KnownDevice;
        }
      ).device;
      expect(connectingStateDevice).toEqual(expect.objectContaining(knownDeviceA));
    });

    it("stays waiting when discovered one device does not include the selected device", () => {
      // Arrange
      const { connect, discoverDevices, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });

      // Act
      machine.start();
      const discoveringState = states[states.length - 1];
      const unavailableDevice = (
        discoveringState as {
          type: typeof ConnectDeviceUIStateTypes.Discovering;
          devices: Array<DisplayedDevice>;
        }
      ).devices[0];
      unavailableDevice.onSelect();
      discoverDevices([makeDiscoveredDeviceFromKnownDevice(knownDeviceB)]);

      // Assert
      expect(connect).not.toHaveBeenCalled();
      const waitingState = states[states.length - 1];
      expect(waitingState.type).toBe(ConnectDeviceUIStateTypes.WaitingForSelectedDevice);
      const waitingStateDevice = (
        waitingState as {
          type: typeof ConnectDeviceUIStateTypes.WaitingForSelectedDevice;
          device: KnownDevice;
        }
      ).device;
      expect(waitingStateDevice).toEqual(expect.objectContaining(knownDeviceA));
    });

    it("connects when discovered one device includes the selected device while waiting", () => {
      // Arrange
      const { connect, discoverDevices, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });
      const discoveredDevice = makeDiscoveredDeviceFromKnownDevice(knownDeviceA);

      // Act
      machine.start();
      const discoveringState = states[states.length - 1];
      expect(discoveringState.type).toBe(ConnectDeviceUIStateTypes.Discovering);
      const unavailableDevice = (
        discoveringState as {
          type: typeof ConnectDeviceUIStateTypes.Discovering;
          devices: Array<DisplayedDevice>;
        }
      ).devices[0];
      unavailableDevice.onSelect();
      discoverDevices([discoveredDevice]);

      // Assert
      expect(connect).toHaveBeenCalledWith({
        device: discoveredDevice,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
      const connectingState = states[states.length - 1];
      expect(connectingState.type).toBe(ConnectDeviceUIStateTypes.Connecting);
      const connectingStateDevice = (
        connectingState as {
          type: typeof ConnectDeviceUIStateTypes.Connecting;
          device: KnownDevice;
        }
      ).device;
      expect(connectingStateDevice).toEqual(expect.objectContaining(knownDeviceA));
    });

    it("returns to Discovering after selected device timeout when there are more than one known device", () => {
      // Arrange
      jest.useFakeTimers();
      const { machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });

      // Act
      machine.start();
      jest.advanceTimersByTime(30000);

      // Assert
      const discoveringState = states[states.length - 1];
      expect(discoveringState.type).toBe(ConnectDeviceUIStateTypes.Discovering);
      const discoveringStateDevices = (
        discoveringState as {
          type: typeof ConnectDeviceUIStateTypes.Discovering;
          devices: Array<DisplayedDevice>;
        }
      ).devices;
      expect(discoveringStateDevices).toEqual([
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceA }),
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceB }),
      ]);
    });
  });

  it("stays waiting after selected device timeout when there is only one known device", () => {
    // Arrange
    jest.useFakeTimers();
    const { machine, states } = setupTest({
      knownDevices: [knownDeviceA],
    });

    // Act
    machine.start();
    jest.advanceTimersByTime(30000);

    // Assert
    const waitingState = states[states.length - 1];
    expect(waitingState.type).toBe(ConnectDeviceUIStateTypes.WaitingForSelectedDevice);
    const waitingStateDevice = (
      waitingState as {
        type: typeof ConnectDeviceUIStateTypes.WaitingForSelectedDevice;
        device: KnownDevice;
      }
    ).device;
    expect(waitingStateDevice).toEqual(expect.objectContaining(knownDeviceA));
  });

  describe("Discovery errors", () => {
    it("stops discovery and emits DiscoveryError when the errors observable emits an error", () => {
      // Arrange
      const { deviceDiscoveryService, emitDiscoveryError, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });
      const discoveryError = makeDiscoveryError();

      // Act
      machine.start();
      emitDiscoveryError(discoveryError);

      // Assert
      expect(deviceDiscoveryService.stop).toHaveBeenCalled();
      const discoveryErrorState = states[states.length - 1];
      expect(discoveryErrorState.type).toBe(ConnectDeviceUIStateTypes.DiscoveryError);
      expect(
        (
          discoveryErrorState as {
            type: typeof ConnectDeviceUIStateTypes.DiscoveryError;
            error: UnknownDiscoveryError;
          }
        ).error,
      ).toBe(discoveryError);
    });

    it("stops discovery and emits a DiscoveryError with retry when available", () => {
      // Arrange
      const { deviceDiscoveryService, emitDiscoveryError, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });
      const retryableError = makeDiscoveryError({
        resolution: { type: "prompt", retry: jest.fn() },
      });

      // Act
      machine.start();
      emitDiscoveryError(retryableError);

      // Assert
      const retryableState = states[states.length - 1];
      expect(retryableState.type).toBe(ConnectDeviceUIStateTypes.DiscoveryError);
      expect(deviceDiscoveryService.stop).toHaveBeenCalled();
      expect(
        (
          retryableState as {
            type: typeof ConnectDeviceUIStateTypes.DiscoveryError;
            error: UnknownDiscoveryError;
          }
        ).error,
      ).toBe(retryableError);
    });

    it("omits retry from DiscoveryError when the error is not retryable", () => {
      // Arrange
      const { emitDiscoveryError, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });

      // Act
      machine.start();
      emitDiscoveryError(makeDiscoveryError({ resolution: { type: "none" } }));

      // Assert
      const nonRetryableState = states[states.length - 1];
      expect(nonRetryableState.type).toBe(ConnectDeviceUIStateTypes.DiscoveryError);
      expect(
        (
          nonRetryableState as {
            type: typeof ConnectDeviceUIStateTypes.DiscoveryError;
            retry: undefined;
          }
        ).retry,
      ).toBeUndefined();
    });

    it("ignores a discovery error transport and restarts discovery with it skipped", () => {
      // Arrange
      const { deviceDiscoveryService, emitDiscoveryError, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });

      // Act
      machine.start();
      emitDiscoveryError(makeDiscoveryError({ transportId: "ble-transport" }));
      const discoveryErrorState = states[states.length - 1];
      const discoveryErrorIgnore = (
        discoveryErrorState as {
          type: typeof ConnectDeviceUIStateTypes.DiscoveryError;
          ignore: () => void;
        }
      ).ignore;
      discoveryErrorIgnore();

      // Assert
      expect(deviceDiscoveryService.start).toHaveBeenLastCalledWith({
        ignoreTransportIdentifiers: ["ble-transport"],
      });
      const discoveringState = states[states.length - 1];
      expect(discoveringState.type).toBe(ConnectDeviceUIStateTypes.Discovering);
      const discoveringStateDevices = (
        discoveringState as {
          type: typeof ConnectDeviceUIStateTypes.Discovering;
          devices: Array<DisplayedDevice>;
        }
      ).devices;
      expect(discoveringStateDevices).toEqual([
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceA }),
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceB }),
      ]);
    });

    it("restarts discovery when retry resolves to true", async () => {
      // Arrange
      const onRetry = jest.fn().mockResolvedValue(true);
      const { deviceDiscoveryService, emitDiscoveryError, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });

      // Act
      machine.start();
      emitDiscoveryError(makeDiscoveryError({ resolution: { type: "prompt", retry: onRetry } }));
      const discoveryErrorState = states[states.length - 1];
      const discoveryErrorRetry = (
        discoveryErrorState as {
          type: typeof ConnectDeviceUIStateTypes.DiscoveryError;
          retry: () => void;
        }
      ).retry;
      discoveryErrorRetry();

      // Wait for the retry to complete
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(onRetry).toHaveBeenCalled();
      expect(deviceDiscoveryService.start).toHaveBeenCalledTimes(2);
      const discoveringState = states[states.length - 1];
      expect(discoveringState.type).toBe(ConnectDeviceUIStateTypes.Discovering);
      const discoveringStateDevices = (
        discoveringState as {
          type: typeof ConnectDeviceUIStateTypes.Discovering;
          devices: Array<DisplayedDevice>;
        }
      ).devices;
      expect(discoveringStateDevices).toEqual([
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceA }),
        expect.objectContaining({ type: "not-available", knownDevice: knownDeviceB }),
      ]);
    });

    it("emits the returned DiscoveryError when retry fails", async () => {
      // Arrange
      const retryError = makeDiscoveryError({ transportId: "retry-transport" });
      const onRetry = jest.fn().mockResolvedValue(retryError);
      const { emitDiscoveryError, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });

      // Act
      machine.start();
      emitDiscoveryError(makeDiscoveryError({ resolution: { type: "prompt", retry: onRetry } }));
      const discoveryErrorState = states[states.length - 1];
      const discoveryErrorRetry = (
        discoveryErrorState as {
          type: typeof ConnectDeviceUIStateTypes.DiscoveryError;
          retry: () => void;
        }
      ).retry;
      discoveryErrorRetry();

      // Wait for the retry to complete
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      const retryState = states[states.length - 1];
      expect(retryState.type).toBe(ConnectDeviceUIStateTypes.DiscoveryError);
      const retryStateError = (
        retryState as {
          type: typeof ConnectDeviceUIStateTypes.DiscoveryError;
          error: UnknownDiscoveryError;
        }
      ).error;
      expect(retryStateError).toBe(retryError);
    });

    it("emits an unknown DiscoveryError when retry rejects unexpectedly", async () => {
      // Arrange
      const unknownError = new Error("unknown error");
      const onRetry = jest.fn().mockRejectedValue(unknownError);
      const { emitDiscoveryError, machine, states } = setupTest();
      const retryableError = makeDiscoveryError({ resolution: { type: "prompt", retry: onRetry } });

      // Act
      machine.start();
      emitDiscoveryError(retryableError);
      const discoveryErrorState = states[states.length - 1];
      const discoveryErrorRetry = (
        discoveryErrorState as {
          type: typeof ConnectDeviceUIStateTypes.DiscoveryError;
          retry: () => void;
        }
      ).retry;
      discoveryErrorRetry();

      // Wait for the retry to complete
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      const unknownErrorState = states[states.length - 1];
      expect(unknownErrorState.type).toBe(ConnectDeviceUIStateTypes.DiscoveryError);
      const unknownErrorError = (
        unknownErrorState as {
          type: typeof ConnectDeviceUIStateTypes.DiscoveryError;
          error: UnknownDiscoveryError;
        }
      ).error;
      expect(unknownErrorError).toEqual({
        type: BaseDiscoveryErrorTypes.Unknown,
        error: unknownError,
      });
    });
  });

  describe("Connection errors", () => {
    it("emits the mapped ConnectionError when connection fails", async () => {
      // Arrange
      const connectionError = new Error("connection failed");
      const mapConnectionError: ConnectDeviceMapConnectionError = jest.fn(() => ({
        type: "mapped-connection-error",
      }));
      const connect = jest
        .fn<
          ReturnType<DeviceManagementKit["connect"]>,
          Parameters<DeviceManagementKit["connect"]>
        >()
        .mockRejectedValue(connectionError);
      const { discoverDevices, machine, states } = setupTest({ connect, mapConnectionError });

      // Act
      machine.start();
      discoverDevices([makeDiscoveredDeviceFromKnownDevice(knownDeviceA)]);

      // Wait for the connection to complete
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      const connectionErrorState = states[states.length - 1];
      expect(connectionErrorState.type).toBe(ConnectDeviceUIStateTypes.ConnectionError);
      const connectionErrorError = (
        connectionErrorState as {
          type: typeof ConnectDeviceUIStateTypes.ConnectionError;
          error: UnknownConnectionError;
        }
      ).error;
      expect(connectionErrorError).toEqual({
        type: "mapped-connection-error",
      });
      expect(mapConnectionError).toHaveBeenCalledWith(connectionError);
      expect(connectionErrorState).toEqual(expect.objectContaining({ device: knownDeviceA }));
    });

    it("emits an unknown ConnectionError by default when connection fails", async () => {
      // Arrange
      const connectionError = new Error("connection failed");
      const connect = jest
        .fn<
          ReturnType<DeviceManagementKit["connect"]>,
          Parameters<DeviceManagementKit["connect"]>
        >()
        .mockRejectedValue(connectionError);
      const { discoverDevices, machine, states } = setupTest({ connect });

      // Act
      machine.start();
      discoverDevices([makeDiscoveredDeviceFromKnownDevice(knownDeviceA)]);

      // Wait for the connection to complete
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      const connectionErrorState = states[states.length - 1];
      expect(connectionErrorState.type).toBe(ConnectDeviceUIStateTypes.ConnectionError);
      const connectionErrorError = (
        connectionErrorState as {
          type: typeof ConnectDeviceUIStateTypes.ConnectionError;
          error: UnknownConnectionError;
        }
      ).error;
      expect(connectionErrorError).toEqual({
        type: BaseConnectionErrorTypes.Unknown,
        error: connectionError,
      });
      expect(connectionErrorState).toEqual(expect.objectContaining({ device: knownDeviceA }));
    });

    it("retries the connection when the ConnectionError retry action is used", async () => {
      // Arrange
      const connect = jest
        .fn<
          ReturnType<DeviceManagementKit["connect"]>,
          Parameters<DeviceManagementKit["connect"]>
        >()
        .mockRejectedValueOnce(new Error("connection failed"));
      const { discoverDevices, machine, states } = setupTest({ connect });

      // Act
      machine.start();
      discoverDevices([makeDiscoveredDeviceFromKnownDevice(knownDeviceA)]);

      // Wait for the connection to complete
      await Promise.resolve();
      await Promise.resolve();

      const connectionErrorState = states[states.length - 1];
      const connectionErrorRetry = (
        connectionErrorState as {
          type: typeof ConnectDeviceUIStateTypes.ConnectionError;
          retry: () => void;
        }
      ).retry;
      connectionErrorRetry();

      // Wait for the retry to complete
      await Promise.resolve();
      await Promise.resolve();

      // Assert
      expect(connect).toHaveBeenCalledTimes(2);
      const connectedState = states[states.length - 1];
      expect(connectedState.type).toBe(ConnectDeviceUIStateTypes.Connected);
    });

    it("reaches the final state and stops discovery when the ConnectionError is ignored", async () => {
      // Arrange
      const connect = jest
        .fn<
          ReturnType<DeviceManagementKit["connect"]>,
          Parameters<DeviceManagementKit["connect"]>
        >()
        .mockRejectedValue(new Error("connection failed"));
      const { deviceDiscoveryService, discoverDevices, machine, states } = setupTest({ connect });

      // Act
      machine.start();
      discoverDevices([makeDiscoveredDeviceFromKnownDevice(knownDeviceA)]);

      // Wait for the connection to complete
      await Promise.resolve();
      await Promise.resolve();

      const connectionErrorState = states[states.length - 1];
      const connectionErrorIgnore = (
        connectionErrorState as {
          type: typeof ConnectDeviceUIStateTypes.ConnectionError;
          ignore: () => void;
        }
      ).ignore;
      connectionErrorIgnore();

      // Assert
      expect(deviceDiscoveryService.stop).toHaveBeenCalled();
      const connectionErrorStateError = (
        connectionErrorState as {
          type: typeof ConnectDeviceUIStateTypes.ConnectionError;
          error: UnknownConnectionError;
        }
      ).error;
      expect(connectionErrorStateError).toEqual({
        type: BaseConnectionErrorTypes.Unknown,
        error: expect.any(Error),
      });
    });
  });

  describe("Add flow", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    it("GIVEN connectNewDevice is null, WHEN the device not found delay elapses, THEN it should not show the hint", () => {
      // GIVEN
      const { machine, states } = setupTest({ knownDevices: [knownDeviceA] });
      machine.start();

      // WHEN
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);

      // THEN
      expect(lastState(states, ConnectDeviceUIStateTypes.WaitingForSelectedDevice)).toEqual(
        expect.objectContaining({ showDeviceNotFound: false, addNewDevice: null }),
      );
    });

    it("GIVEN no known device, WHEN the user taps add, THEN it should start the embedded flow and its discovery", () => {
      // GIVEN
      const { deviceDiscoveryService, machine, states } = setupTest({
        knownDevices: [],
        connectNewDevice: addFlowInput,
      });
      machine.start();

      // WHEN
      lastState(states, ConnectDeviceUIStateTypes.NoKnownDevice).addNewDevice!();

      // THEN
      expect(lastEmbeddedState(states).type).toBe(ConnectNewDeviceUIStateTypes.Discovering);
      expect(deviceDiscoveryService.start).toHaveBeenCalled();
    });

    it("GIVEN the add flow opened from no known device, WHEN the user taps back, THEN it should go back to no known device and stop discovery", () => {
      // GIVEN
      const { deviceDiscoveryService, machine, states } = setupTest({
        knownDevices: [],
        connectNewDevice: addFlowInput,
      });
      machine.start();
      lastState(states, ConnectDeviceUIStateTypes.NoKnownDevice).addNewDevice!();

      // WHEN
      lastState(states, ConnectDeviceUIStateTypes.ConnectNewDevice).back();

      // THEN
      lastState(states, ConnectDeviceUIStateTypes.NoKnownDevice);
      expect(deviceDiscoveryService.isRunning).toBe(false);
    });

    it("GIVEN several known devices, WHEN the user taps add then back, THEN it should go back to the list", () => {
      // GIVEN
      const { machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
        connectNewDevice: addFlowInput,
      });
      machine.start();

      // WHEN
      lastState(states, ConnectDeviceUIStateTypes.Discovering).addNewDevice!();

      // THEN
      expect(states[states.length - 1].type).toBe(ConnectDeviceUIStateTypes.ConnectNewDevice);

      // WHEN
      lastState(states, ConnectDeviceUIStateTypes.ConnectNewDevice).back();

      // THEN
      expect(states[states.length - 1].type).toBe(ConnectDeviceUIStateTypes.Discovering);
    });

    it("GIVEN one known device, WHEN the device not found delay elapses, THEN it should show the hint", () => {
      // GIVEN
      const { machine, states } = setupTest({
        knownDevices: [knownDeviceA],
        connectNewDevice: addFlowInput,
      });
      machine.start();

      // WHEN
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY - 1);

      // THEN
      expect(
        lastState(states, ConnectDeviceUIStateTypes.WaitingForSelectedDevice).showDeviceNotFound,
      ).toBe(false);

      // WHEN
      jest.advanceTimersByTime(1);

      // THEN
      expect(
        lastState(states, ConnectDeviceUIStateTypes.WaitingForSelectedDevice).showDeviceNotFound,
      ).toBe(true);
    });

    it("GIVEN the add flow opened from the waiting state, WHEN the user taps back, THEN it should wait for the same device again", () => {
      // GIVEN
      const { machine, states } = setupTest({
        knownDevices: [knownDeviceA],
        connectNewDevice: addFlowInput,
      });
      machine.start();
      jest.advanceTimersByTime(DEFAULT_DEVICE_NOT_FOUND_DELAY);
      lastState(states, ConnectDeviceUIStateTypes.WaitingForSelectedDevice).addNewDevice!();

      // WHEN
      lastState(states, ConnectDeviceUIStateTypes.ConnectNewDevice).back();

      // THEN
      expect(lastState(states, ConnectDeviceUIStateTypes.WaitingForSelectedDevice)).toEqual(
        expect.objectContaining({ device: knownDeviceA, showDeviceNotFound: false }),
      );
    });

    it("GIVEN the add flow, WHEN discovery finds a known device, THEN it should not connect to it", () => {
      // GIVEN
      const { connect, discoverDevices, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
        connectNewDevice: addFlowInput,
      });
      machine.start();
      lastState(states, ConnectDeviceUIStateTypes.Discovering).addNewDevice!();

      // WHEN
      discoverDevices([makeDiscoveredDeviceFromKnownDevice(knownDeviceA)]);

      // THEN
      expect(listedDeviceIds(states)).toEqual([knownDeviceA.id]);
      expect(connect).not.toHaveBeenCalled();
    });

    it("GIVEN accepted device models, WHEN the add flow discovers other models, THEN it should list only the accepted models", () => {
      // GIVEN
      const { discoverDevices, machine, states } = setupTest({
        knownDevices: [],
        connectNewDevice: addFlowInput,
        acceptedDeviceModelIds: [DeviceModelId.stax],
      });
      machine.start();
      lastState(states, ConnectDeviceUIStateTypes.NoKnownDevice).addNewDevice!();

      // WHEN
      discoverDevices([
        makeDiscoveredDeviceFromKnownDevice(knownDeviceA),
        makeDiscoveredDeviceFromKnownDevice(knownDeviceC),
      ]);

      // THEN
      expect(listedDeviceIds(states)).toEqual([knownDeviceC.id]);
    });

    it("GIVEN the add flow, WHEN the user connects a new device, THEN it should show the embedded success, then emit connected and call onConnected with the new session", async () => {
      // GIVEN
      const { connect, discoverDevices, machine, onConnected, states } = setupTest({
        knownDevices: [],
        connectNewDevice: addFlowInput,
        connect: jest.fn().mockResolvedValue("new-session-id"),
      });
      machine.start();
      lastState(states, ConnectDeviceUIStateTypes.NoKnownDevice).addNewDevice!();
      discoverDevices([makeDiscoveredDeviceFromKnownDevice(knownDeviceA)]);

      // WHEN
      const embeddedState = lastEmbeddedState(states) as { devices: Array<SelectableDevice> };
      const selectableDevice = embeddedState.devices[0];
      if (!selectableDevice.isAvailable) throw new Error("the device is not available");
      selectableDevice.onSelect();
      await jest.advanceTimersByTimeAsync(0);

      // THEN
      expect(connect).toHaveBeenCalled();
      expect(lastEmbeddedState(states).type).toBe(ConnectNewDeviceUIStateTypes.Connected);
      expect(onConnected).not.toHaveBeenCalled();

      // WHEN
      await jest.advanceTimersByTimeAsync(DEFAULT_SUCCESS_DELAY);

      // THEN
      lastState(states, ConnectDeviceUIStateTypes.Connected);
      expect(onConnected).toHaveBeenCalledWith(
        expect.objectContaining({ sessionId: "new-session-id" }),
      );
    });
  });
});
