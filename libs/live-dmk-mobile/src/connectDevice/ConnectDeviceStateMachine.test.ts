import {
  type ConnectedDevice,
  DeviceModelId as DMKDeviceModelId,
  type DeviceManagementKit,
  type DiscoveredDevice,
} from "@ledgerhq/device-management-kit";
import {
  PairingRefusedError,
  rnBleTransportIdentifier,
} from "@ledgerhq/device-transport-kit-react-native-ble";
import { DeviceModelId } from "@ledgerhq/devices";
import { PeerRemovedPairing } from "@ledgerhq/errors";
import { Subject, type Observer } from "rxjs";
import { KnownDevice, dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";

import { DefaultConnectDeviceStateMachine } from "./ConnectDeviceStateMachine";
import {
  ConnectDeviceUIStateTypes,
  ConnectionError,
  ConnectionErrorTypes,
  DiscoveryErrorTypes,
  DisplayedDevice,
  type ConnectDeviceConnectionService,
  type ConnectDeviceUIState,
  type DeviceDiscoveryService,
  type DiscoveryError,
} from "./types";

// Test helpers
const knownDeviceA: KnownDevice = {
  transport: "RN_BLE",
  deviceModelId: DeviceModelId.nanoX,
  id: "known-device-a",
  name: "Ledger Nano X",
};

const knownDeviceB: KnownDevice = {
  transport: "RN_BLE",
  deviceModelId: DeviceModelId.nanoSP,
  id: "known-device-b",
  name: "Ledger Nano S Plus",
};

const knownDeviceC: KnownDevice = {
  transport: "RN_BLE",
  deviceModelId: DeviceModelId.stax,
  id: "known-device-c",
  name: "Ledger Stax",
};

const deviceModelByKnownDeviceModelId: Partial<Record<DeviceModelId, DiscoveredDevice["deviceModel"]>> = {
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
    transport: rnBleTransportIdentifier,
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
    transport: "RN_BLE",
    ...overrides,
  }) as ConnectedDevice;

type UnknownDiscoveryError = Extract<DiscoveryError, { type: DiscoveryErrorTypes.Unknown }>;

const makeDiscoveryError = (
  overrides: Partial<Omit<UnknownDiscoveryError, "type">> = {},
): DiscoveryError => ({
  type: DiscoveryErrorTypes.Unknown,
  transportId: "RN_BLE",
  ...overrides,
});

type SetupTestOptions = {
  readonly knownDevices?: Array<KnownDevice>;
  readonly dmk?: DeviceManagementKit;
  readonly sessionId?: string | null;
  readonly connect?: jest.MockedFunction<ConnectDeviceConnectionService["connect"]>;
  readonly onConnected?: jest.Mock;
};

const setupTest = (options: SetupTestOptions = {}) => {
  const {
    knownDevices = [
      {
        transport: "RN_BLE",
        deviceModelId: DeviceModelId.nanoX,
        id: "known-device-a",
        name: "Ledger Nano X",
      },
    ],
    sessionId = null,
    connect = jest.fn().mockResolvedValue("session-id"),
    onConnected = jest.fn(),
  } = options;
  const discoveredDevices = new Subject<Array<DiscoveredDevice>>();
  const errors = new Subject<DiscoveryError>();
  const dmk =
    options.dmk ??
    ({
      connect,
      getConnectedDevice: jest.fn(() => makeConnectedDevice()),
    } as unknown as DeviceManagementKit);

  const states: Array<ConnectDeviceUIState> = [];
  const observer: Observer<ConnectDeviceUIState> = {
    next: state => states.push(state),
    error: jest.fn(),
    complete: jest.fn(),
  };

  const deviceDiscoveryService: DeviceDiscoveryService = {
    start: jest.fn(),
    stop: jest.fn(),
    discoveredDevices,
    errors,
  };

  const machine: DefaultConnectDeviceStateMachine = new DefaultConnectDeviceStateMachine({
    knownDevices,
    dmk,
    sessionId,
    observer,
    deviceDiscoveryService,
    onConnected,
  });

  const discoverDevices = (devices: Array<DiscoveredDevice>) => discoveredDevices.next(devices);
  const emitDiscoveryError = (error: DiscoveryError) => errors.next(error);

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
      expect(states).toEqual([{ type: ConnectDeviceUIStateTypes.NoKnownDevice }]);
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
      expect(states).toEqual([{ type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice, device: knownDeviceA }]);
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
            type: ConnectDeviceUIStateTypes.Discovering;
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
            type: ConnectDeviceUIStateTypes.Discovering;
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
            type: ConnectDeviceUIStateTypes.Discovering;
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
            type: ConnectDeviceUIStateTypes.Discovering;
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
            type: ConnectDeviceUIStateTypes.Discovering;
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
          type: ConnectDeviceUIStateTypes.Connecting;
          device: KnownDevice;
        }
      ).device;
      expect(connectingStateDevice).toEqual(expect.objectContaining(knownDeviceA));
      expect(connect).toHaveBeenCalledWith({
        device: discoveredDevice,
        sessionRefresherOptions: { isRefresherDisabled: true },
      });
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
        compatDeviceModelId: dmkToLedgerDeviceIdMap[connectedDevice.modelId],
        compatDeviceName: connectedDevice.name,
        compatDeviceWired: false,
      });
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
          type: ConnectDeviceUIStateTypes.Discovering;
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
          type: ConnectDeviceUIStateTypes.Connecting;
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
          type: ConnectDeviceUIStateTypes.Discovering;
          devices: Array<DisplayedDevice>;
        }
      ).devices[0];
      unavailableDevice.onSelect();

      // Assert
      const waitingState = states[states.length - 1];
      expect(waitingState.type).toBe(ConnectDeviceUIStateTypes.WaitingForSelectedDevice);
      const waitingStateDevice = (
        waitingState as {
          type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice;
          device: KnownDevice;
        }
      ).device;
      expect(waitingStateDevice).toEqual(
        expect.objectContaining(knownDeviceA),
      );
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
          type: ConnectDeviceUIStateTypes.Discovering;
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
          type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice;
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
          type: ConnectDeviceUIStateTypes.Discovering;
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
          type: ConnectDeviceUIStateTypes.Connecting;
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
          type: ConnectDeviceUIStateTypes.Discovering;
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
          type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice;
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
          type: ConnectDeviceUIStateTypes.Discovering;
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
          type: ConnectDeviceUIStateTypes.Connecting;
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
          type: ConnectDeviceUIStateTypes.Discovering;
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
        type: ConnectDeviceUIStateTypes.WaitingForSelectedDevice;
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
            type: ConnectDeviceUIStateTypes.DiscoveryError;
            error: DiscoveryError;
          }
        ).error,
      ).toBe(discoveryError);
    });

    it("stops discovery and emits a DiscoveryError with retry when available", () => {
      // Arrange
      const { deviceDiscoveryService, emitDiscoveryError, machine, states } = setupTest({
        knownDevices: [knownDeviceA, knownDeviceB],
      });
      const retryableError = makeDiscoveryError({ resolution: { type: "prompt", retry: jest.fn() } });

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
            type: ConnectDeviceUIStateTypes.DiscoveryError;
            error: DiscoveryError;
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
        (nonRetryableState as { type: ConnectDeviceUIStateTypes.DiscoveryError; retry: undefined })
          .retry,
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
          type: ConnectDeviceUIStateTypes.DiscoveryError;
          ignore: () => void;
        }
      ).ignore;
      discoveryErrorIgnore();

      // Assert
      expect(deviceDiscoveryService.start).toHaveBeenLastCalledWith({ ignoreTransportIdentifiers: ["ble-transport"] });
      const discoveringState = states[states.length - 1];
      expect(discoveringState.type).toBe(ConnectDeviceUIStateTypes.Discovering);
      const discoveringStateDevices = (
        discoveringState as {
          type: ConnectDeviceUIStateTypes.Discovering;
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
        discoveryErrorState as { type: ConnectDeviceUIStateTypes.DiscoveryError; retry: () => void }
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
          type: ConnectDeviceUIStateTypes.Discovering;
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
        discoveryErrorState as { type: ConnectDeviceUIStateTypes.DiscoveryError; retry: () => void }
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
        retryState as { type: ConnectDeviceUIStateTypes.DiscoveryError; error: DiscoveryError }
      ).error;
      expect(retryStateError).toBe(retryError);
    });

    it("emits a DiscoveryError when retry fails with an unknown error", async () => {
      // Arrange
      const unknownError = new Error("unknown error");
      const onRetry = jest.fn().mockRejectedValue(unknownError);
      const { emitDiscoveryError, machine, states } = setupTest();

      // Act
      machine.start();
      const waitingForSelectedDeviceState = states[states.length - 1];
      emitDiscoveryError(makeDiscoveryError({ resolution: { type: "prompt", retry: onRetry } }));
      const discoveryErrorState = states[states.length - 1];
      const discoveryErrorRetry = (
        discoveryErrorState as { type: ConnectDeviceUIStateTypes.DiscoveryError; retry: () => void }
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
        unknownErrorState as { type: ConnectDeviceUIStateTypes.DiscoveryError; error: DiscoveryError }
      ).error;
      expect(unknownErrorError).toEqual(
        expect.objectContaining({ type: DiscoveryErrorTypes.Unknown, error: unknownError }),
      );
    });
  });

  describe("Connection errors", () => {
    it("emits a BLE pairing-refused ConnectionError when connection fails", async () => {
      // Arrange
      const connect = jest
        .fn<
          ReturnType<ConnectDeviceConnectionService["connect"]>,
          Parameters<ConnectDeviceConnectionService["connect"]>
        >()
        .mockRejectedValue(new PairingRefusedError());
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
          type: ConnectDeviceUIStateTypes.ConnectionError;
          error: ConnectionError;
        }
      ).error;
      expect(connectionErrorError).toEqual({
        type: ConnectionErrorTypes.BlePairingRefused,
      });
      expect(connectionErrorState).toEqual(expect.objectContaining({ device: knownDeviceA }));
    });

    it("emits a BLE peer-removed-pairing ConnectionError when connection fails", async () => {
      // Arrange
      const connect = jest
        .fn<
          ReturnType<ConnectDeviceConnectionService["connect"]>,
          Parameters<ConnectDeviceConnectionService["connect"]>
        >()
        .mockRejectedValue(new PeerRemovedPairing());
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
          type: ConnectDeviceUIStateTypes.ConnectionError;
          error: ConnectionError;
        }
      ).error;
      expect(connectionErrorError).toEqual({
        type: ConnectionErrorTypes.BlePairingPeerRemovedPairing,
      });
      expect(connectionErrorState).toEqual(expect.objectContaining({ device: knownDeviceA }));
    });

    it("retries the connection when the ConnectionError retry action is used", async () => {
      // Arrange
      const connect = jest
        .fn<
          ReturnType<ConnectDeviceConnectionService["connect"]>,
          Parameters<ConnectDeviceConnectionService["connect"]>
        >()
        .mockRejectedValueOnce(new PeerRemovedPairing());
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
          type: ConnectDeviceUIStateTypes.ConnectionError;
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
          ReturnType<ConnectDeviceConnectionService["connect"]>,
          Parameters<ConnectDeviceConnectionService["connect"]>
        >()
        .mockRejectedValue(new PeerRemovedPairing());
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
          type: ConnectDeviceUIStateTypes.ConnectionError;
          ignore: () => void;
        }
      ).ignore;
      connectionErrorIgnore();

      // Assert
      expect(deviceDiscoveryService.stop).toHaveBeenCalled();
      const connectionErrorStateError = (
        connectionErrorState as {
          type: ConnectDeviceUIStateTypes.ConnectionError;
          error: ConnectionError;
        }
      ).error;
      expect(connectionErrorStateError).toEqual({
        type: ConnectionErrorTypes.BlePairingPeerRemovedPairing,
      });
    });
  });
});
