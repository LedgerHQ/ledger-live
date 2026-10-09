import {
  DeviceModelId,
  type DeviceManagementKit,
  type DiscoveredDevice,
  type TransportIdentifier,
} from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import {
  connectNewDeviceUseCase as sharedConnectNewDeviceUseCase,
  DefaultDeviceDiscoveryService,
} from "@ledgerhq/live-dmk-shared";
import { Platform } from "react-native";
import { NEVER, startWith } from "rxjs";

import { connectNewDevice, type ConnectNewDeviceInput } from "./connectNewDevice";
import { ConnectNewDeviceUIStateTypes, type MobileConnectNewDeviceUIState } from "./types";
import { RnBleDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/RnBleDeviceDiscoverySource";
import { RnHidDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/RnHidDeviceDiscoverySource";
import { SpeculosDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/SpeculosDeviceDiscoverySource";
import { buildMobileCompatDeviceId, createConnectionError } from "../connectDevice/utils";
import { filterListedDevices } from "./filterListedDevices";
import { getDiscoveredDeviceKey } from "./getDiscoveredDeviceKey";

jest.mock("@ledgerhq/live-dmk-shared", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-shared");

  return {
    ...actual,
    connectNewDeviceUseCase: jest.fn(actual.connectNewDeviceUseCase),
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

jest.mock("../deviceConnectivity/discoveryService/sources/SpeculosDeviceDiscoverySource", () => ({
  SpeculosDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: () => jest.requireActual("rxjs").NEVER,
    transportId: jest.requireActual("@ledgerhq/device-transport-kit-speculos").speculosIdentifier,
  })),
}));

const mockedSharedConnectNewDeviceUseCase = jest.mocked(sharedConnectNewDeviceUseCase);

const setPlatformOS = (platformOS: typeof Platform.OS) => {
  Object.assign(Platform, { OS: platformOS });
};

const discoverOn = (
  source: typeof RnBleDeviceDiscoverySource | typeof RnHidDeviceDiscoverySource,
  transport: TransportIdentifier,
  id: string,
) => {
  const discoveredDevice = {
    id,
    name: "Nano X 1A2B",
    deviceModel: { id: "nanoX", model: DeviceModelId.NANO_X, name: "Ledger Nano X" },
    transport,
  } as DiscoveredDevice;

  jest.mocked(source).mockImplementationOnce(
    () =>
      ({
        transportId: transport,
        listen: () => NEVER.pipe(startWith({ type: "devices", devices: [discoveredDevice] })),
      }) as unknown as RnBleDeviceDiscoverySource & RnHidDeviceDiscoverySource,
  );
};

const setupTest = () => {
  const input: ConnectNewDeviceInput = {
    dmk: {} as DeviceManagementKit,
    onConnected: jest.fn(),
    onClose: jest.fn(),
  };
  const states: Array<MobileConnectNewDeviceUIState> = [];
  const subscription = connectNewDevice(input).subscribe(state => states.push(state));

  return { input, states, subscription };
};

describe("mobile connectNewDevice", () => {
  afterEach(() => {
    setPlatformOS(undefined as unknown as typeof Platform.OS);
    jest.clearAllMocks();
  });

  it("should delegate to the shared use case with mobile discovery and mapping dependencies", () => {
    // GIVEN
    setPlatformOS("android");

    // WHEN
    const { input, subscription } = setupTest();

    // THEN
    expect(RnBleDeviceDiscoverySource).toHaveBeenCalledWith(input.dmk);
    expect(RnHidDeviceDiscoverySource).toHaveBeenCalledWith(input.dmk);
    expect(SpeculosDeviceDiscoverySource).toHaveBeenCalledWith(input.dmk);
    expect(mockedSharedConnectNewDeviceUseCase).toHaveBeenCalledWith({
      ...input,
      deviceDiscoveryService: expect.any(DefaultDeviceDiscoveryService),
      mapConnectionError: createConnectionError,
      getDiscoveredDeviceKey,
      filterListedDevices,
      buildCompatDeviceId: buildMobileCompatDeviceId,
    });

    subscription.unsubscribe();
  });

  it("should list only the available USB devices when a device is discovered over USB and Bluetooth", () => {
    // GIVEN
    setPlatformOS("android");
    discoverOn(RnBleDeviceDiscoverySource, rnBleTransportIdentifier, "ble-id");
    discoverOn(RnHidDeviceDiscoverySource, rnHidTransportIdentifier, "usb-id");

    // WHEN
    const { states, subscription } = setupTest();

    // THEN
    const lastState = states[states.length - 1];
    expect(lastState?.type).toBe(ConnectNewDeviceUIStateTypes.Discovering);
    expect(
      lastState?.type === ConnectNewDeviceUIStateTypes.Discovering &&
        lastState.devices.map(({ device }) => device.id),
    ).toEqual(["usb-id"]);

    subscription.unsubscribe();
  });

  it("should pass the optional delays to the shared use case", () => {
    // GIVEN
    setPlatformOS("android");
    const input: ConnectNewDeviceInput = {
      dmk: {} as DeviceManagementKit,
      onConnected: jest.fn(),
      onClose: jest.fn(),
      deviceNotFoundDelay: 3_000,
      successDelay: 500,
    };

    // WHEN
    connectNewDevice(input);

    // THEN
    expect(mockedSharedConnectNewDeviceUseCase).toHaveBeenCalledWith(
      expect.objectContaining({ deviceNotFoundDelay: 3_000, successDelay: 500 }),
    );
  });

  it("should scan RN_BLE and Speculos, and never RN_HID, on iOS", () => {
    // GIVEN
    setPlatformOS("ios");

    // WHEN
    const { states, subscription } = setupTest();

    // THEN
    expect(RnHidDeviceDiscoverySource).not.toHaveBeenCalled();
    expect(states[states.length - 1]).toEqual(
      expect.objectContaining({
        type: ConnectNewDeviceUIStateTypes.Discovering,
        scanningTransports: [rnBleTransportIdentifier, speculosIdentifier],
      }),
    );

    subscription.unsubscribe();
  });

  it("should scan RN_BLE, RN_HID and Speculos on Android", () => {
    // GIVEN
    setPlatformOS("android");

    // WHEN
    const { states, subscription } = setupTest();

    // THEN
    expect(states[states.length - 1]).toEqual(
      expect.objectContaining({
        type: ConnectNewDeviceUIStateTypes.Discovering,
        scanningTransports: [
          rnBleTransportIdentifier,
          rnHidTransportIdentifier,
          speculosIdentifier,
        ],
      }),
    );

    subscription.unsubscribe();
  });
});
