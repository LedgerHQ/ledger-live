import {
  DeviceModelId,
  type DeviceManagementKit,
  type DiscoveredDevice,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import type { MockServerDevice } from "@features/platform-device-mock-server";
import {
  connectKnownOrNewDeviceUseCase as sharedConnectKnownOrNewDeviceUseCase,
  DefaultDeviceDiscoveryService,
  DeviceListItemStatuses,
  type ConnectKnownOrNewDeviceKnownDevice,
} from "@ledgerhq/live-dmk-shared";
import { DeviceModelId as LedgerDeviceModelId } from "@ledgerhq/types-devices";
import { Platform } from "react-native";
import { BehaviorSubject, NEVER, startWith } from "rxjs";

import {
  connectKnownOrNewDevice,
  type ConnectKnownOrNewDeviceInput,
} from "./connectKnownOrNewDevice";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  type MobileConnectKnownOrNewDeviceUIState,
} from "./types";
import { MockServerDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/MockServerDeviceDiscoverySource";
import { RnHidDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/RnHidDeviceDiscoverySource";
import { buildMobileCompatDeviceId, createConnectionError } from "../connectDevice/utils";
import { filterListedDevices } from "../connectNewDevice/filterListedDevices";
import { getDiscoveredDeviceKey } from "../connectNewDevice/getDiscoveredDeviceKey";
import { findMatchingDevice } from "../utils/findMatchingDevice";

jest.mock("@ledgerhq/live-dmk-shared", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-shared");

  return {
    ...actual,
    connectKnownOrNewDeviceUseCase: jest.fn(actual.connectKnownOrNewDeviceUseCase),
  };
});

jest.mock("../deviceConnectivity/discoveryService/sources/RnBleDeviceDiscoverySource", () => ({
  RnBleDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: () => jest.requireActual("rxjs").NEVER,
    transportId: jest.requireActual("@ledgerhq/device-transport-kit-react-native-ble")
      .rnBleTransportIdentifier,
  })),
}));

jest.mock("../deviceConnectivity/discoveryService/sources/RnHidDeviceDiscoverySource", () => ({
  RnHidDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: () => jest.requireActual("rxjs").NEVER,
    transportId: jest.requireActual("@ledgerhq/device-transport-kit-react-native-hid")
      .rnHidTransportIdentifier,
  })),
}));

jest.mock("../deviceConnectivity/discoveryService/sources/MockServerDeviceDiscoverySource", () => ({
  MockServerDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: () => jest.requireActual("rxjs").NEVER,
    transportId: jest.requireActual("@ledgerhq/device-transport-kit-mockserver")
      .mockserverIdentifier,
  })),
}));

jest.mock("../deviceConnectivity/discoveryService/sources/SpeculosDeviceDiscoverySource", () => ({
  SpeculosDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: () => jest.requireActual("rxjs").NEVER,
    transportId: jest.requireActual("@ledgerhq/device-transport-kit-speculos").speculosIdentifier,
  })),
}));

const mockedSharedUseCase = jest.mocked(sharedConnectKnownOrNewDeviceUseCase);

const setPlatformOS = (platformOS: typeof Platform.OS) => {
  Object.assign(Platform, { OS: platformOS });
};

const discoveredDevice = (transport: TransportIdentifier, id: string): DiscoveredDevice =>
  ({
    id,
    name: id,
    deviceModel: { id: "nanoX", model: DeviceModelId.NANO_X, name: "Ledger Nano X" },
    transport,
  }) as DiscoveredDevice;

const discoverOn = (
  source: typeof RnHidDeviceDiscoverySource | typeof MockServerDeviceDiscoverySource,
  transport: TransportIdentifier,
  devices: Array<DiscoveredDevice>,
) => {
  jest.mocked(source).mockImplementationOnce(
    () =>
      ({
        transportId: transport,
        listen: () => NEVER.pipe(startWith({ type: "devices", devices })),
      }) as unknown as RnHidDeviceDiscoverySource & MockServerDeviceDiscoverySource,
  );
};

const mockServerDevice = (id: string, connectivityType: string) =>
  ({ id, name: id, device_type: "nanoX", connectivity_type: connectivityType }) as MockServerDevice;

const knownMockBleDevice: ConnectKnownOrNewDeviceKnownDevice = {
  transport: mockserverIdentifier,
  deviceModelId: LedgerDeviceModelId.nanoX,
  id: "mock-ble-id",
  name: "My mock Nano X",
};

const setupTest = (overrides: Partial<ConnectKnownOrNewDeviceInput> = {}) => {
  const dmk = {
    listConnectedDevices: () => [],
    listenToConnectedDevice: () => NEVER,
  } as unknown as DeviceManagementKit;
  const input: ConnectKnownOrNewDeviceInput = {
    dmk,
    knownDevices$: new BehaviorSubject<Array<ConnectKnownOrNewDeviceKnownDevice>>([]),
    removeKnownDevice: jest.fn(),
    onConnected: jest.fn(),
    isMockServerEnabled: false,
    ...overrides,
  };
  const states: Array<MobileConnectKnownOrNewDeviceUIState> = [];
  const output = connectKnownOrNewDevice(input);
  const subscription = output.uiStates.subscribe(state => states.push(state));

  const discoveringRows = () => {
    const lastState = states[states.length - 1];
    if (lastState?.type !== ConnectKnownOrNewDeviceUIStateTypes.Discovering) {
      throw new Error(`Expected the discovering state, got ${lastState?.type}`);
    }
    return lastState.devices.map(({ key, status, connectivity }) => ({
      key,
      status,
      connectivity,
    }));
  };

  return { discoveringRows, input, output, subscription };
};

describe("mobile connectKnownOrNewDevice", () => {
  afterEach(() => {
    setPlatformOS(undefined as unknown as typeof Platform.OS);
    jest.clearAllMocks();
  });

  it("should delegate to the shared use case with the mobile dependencies", () => {
    setPlatformOS("android");
    const getMockServerDevices = jest.fn(() => []);

    const { input, subscription } = setupTest({ getMockServerDevices, isPaused: true });

    const { dmk, knownDevices$, removeKnownDevice, onConnected } = input;
    expect(mockedSharedUseCase).toHaveBeenCalledWith({
      dmk,
      knownDevices$,
      removeKnownDevice,
      onConnected,
      isPaused: true,
      deviceDiscoveryService: expect.any(DefaultDeviceDiscoveryService),
      connectedDevices$: expect.anything(),
      findMatchingDevice,
      getConnectivity: expect.any(Function),
      mapConnectionError: createConnectionError,
      getDiscoveredDeviceKey,
      filterListedDevices,
      buildCompatDeviceId: buildMobileCompatDeviceId,
    });
    subscription.unsubscribe();
  });

  it("should give pause and resume to the caller", () => {
    const { output, subscription } = setupTest();

    expect(output).toEqual({
      uiStates: expect.anything(),
      pause: expect.any(Function),
      resume: expect.any(Function),
    });
    subscription.unsubscribe();
  });

  it("should list a discovered USB device as available over USB", () => {
    setPlatformOS("android");
    discoverOn(RnHidDeviceDiscoverySource, rnHidTransportIdentifier, [
      discoveredDevice(rnHidTransportIdentifier, "usb-id"),
    ]);

    const { discoveringRows, subscription } = setupTest();

    expect(discoveringRows()).toEqual([
      {
        key: `discovered:${rnHidTransportIdentifier}:${DeviceModelId.NANO_X}`,
        status: DeviceListItemStatuses.Available,
        connectivity: "USB",
      },
    ]);
    subscription.unsubscribe();
  });

  it("should list the BLE and USB mock devices with the connectivity of the mock server", () => {
    setPlatformOS("ios");
    discoverOn(MockServerDeviceDiscoverySource, mockserverIdentifier, [
      discoveredDevice(mockserverIdentifier, "mock-usb-id"),
      discoveredDevice(mockserverIdentifier, "mock-ble-id"),
      discoveredDevice(mockserverIdentifier, "unknown-mock-ble-id"),
    ]);

    const { discoveringRows, subscription } = setupTest({
      isMockServerEnabled: true,
      knownDevices$: new BehaviorSubject([knownMockBleDevice]),
      getMockServerDevices: () => [
        mockServerDevice("mock-usb-id", "USB"),
        mockServerDevice("mock-ble-id", "BLE"),
        mockServerDevice("unknown-mock-ble-id", "BLE"),
      ],
    });

    expect(discoveringRows()).toEqual([
      {
        key: `discovered:${mockserverIdentifier}:mock-usb-id`,
        status: DeviceListItemStatuses.Available,
        connectivity: "USB",
      },
      {
        key: `known:${mockserverIdentifier}:mock-ble-id`,
        status: DeviceListItemStatuses.Available,
        connectivity: "BLE",
      },
    ]);
    subscription.unsubscribe();
  });

  it("should list a known BLE mock device that the mock server does not report as unavailable", () => {
    setPlatformOS("ios");

    const { discoveringRows, subscription } = setupTest({
      isMockServerEnabled: true,
      knownDevices$: new BehaviorSubject([knownMockBleDevice]),
      getMockServerDevices: () => [mockServerDevice("mock-ble-id", "BLE")],
    });

    expect(discoveringRows()).toEqual([
      {
        key: `known:${mockserverIdentifier}:mock-ble-id`,
        status: DeviceListItemStatuses.Unavailable,
        connectivity: "BLE",
      },
    ]);
    subscription.unsubscribe();
  });
});
