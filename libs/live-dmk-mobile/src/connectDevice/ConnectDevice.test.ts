import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  connectDeviceUseCase as sharedConnectDeviceUseCase,
  DefaultDeviceDiscoveryService,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { EMPTY } from "rxjs";

import { connectDevice } from "./connectDevice";
import {
  configureMockServerTransport,
  resetMockServerTransport,
} from "../mockServerTransportConfig";
import { MockServerDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/MockServerDeviceDiscoverySource";
import { RnBleDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/RnBleDeviceDiscoverySource";
import { RnHidDeviceDiscoverySource } from "../deviceConnectivity/discoveryService/sources/RnHidDeviceDiscoverySource";
import { buildMobileCompatDeviceId, createConnectionError, filterMatchedDevices } from "./utils";

jest.mock("@ledgerhq/live-dmk-shared", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-shared");

  return {
    ...actual,
    connectDeviceUseCase: jest.fn(() => EMPTY),
  };
});

jest.mock("../deviceConnectivity/discoveryService/sources/RnBleDeviceDiscoverySource", () => ({
  RnBleDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: jest.fn(),
    transportId: "ble",
  })),
}));

jest.mock("../deviceConnectivity/discoveryService/sources/RnHidDeviceDiscoverySource", () => ({
  RnHidDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: jest.fn(),
    transportId: "hid",
  })),
}));

jest.mock("../deviceConnectivity/discoveryService/sources/MockServerDeviceDiscoverySource", () => ({
  MockServerDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: jest.fn(),
    transportId: "mockserver",
  })),
}));

const mockedSharedConnectDeviceUseCase = jest.mocked(sharedConnectDeviceUseCase);

const knownDevice: KnownDevice = {
  transport: "RN_BLE",
  deviceModelId: DeviceModelId.nanoX,
  id: "known-device-a",
  name: "Ledger Nano X",
};

describe("mobile connectDevice", () => {
  afterEach(() => {
    resetMockServerTransport();
    jest.clearAllMocks();
  });

  it("should delegate to the shared use case with mobile discovery and mapping dependencies", () => {
    // GIVEN
    const dmk = {} as DeviceManagementKit;
    const onConnected = jest.fn();
    const acceptedDeviceModelIds = [DeviceModelId.nanoX];

    // WHEN
    const result = connectDevice({
      acceptedDeviceModelIds,
      dmk,
      knownDevices: [knownDevice],
      onConnected,
    });

    // THEN
    expect(result).toBe(EMPTY);
    expect(RnBleDeviceDiscoverySource).toHaveBeenCalledWith(dmk);
    expect(RnHidDeviceDiscoverySource).toHaveBeenCalledWith(dmk);
    expect(mockedSharedConnectDeviceUseCase).toHaveBeenCalledWith({
      acceptedDeviceModelIds,
      dmk,
      knownDevices: [knownDevice],
      onConnected,
      deviceDiscoveryService: expect.any(DefaultDeviceDiscoveryService),
      matchDiscoveredDevices: filterMatchedDevices,
      mapConnectionError: createConnectionError,
      buildCompatDeviceId: buildMobileCompatDeviceId,
    });
    expect(mockedSharedConnectDeviceUseCase.mock.calls[0][0]).not.toHaveProperty(
      "mapUnexpectedDiscoveryError",
    );
    expect(MockServerDeviceDiscoverySource).not.toHaveBeenCalled();
  });

  it("should register the mock server source when that transport is enabled", () => {
    const dmk = {} as DeviceManagementKit;
    configureMockServerTransport({ url: "https://mock.example", token: "session" });

    connectDevice({
      dmk,
      knownDevices: [knownDevice],
      onConnected: jest.fn(),
    });

    expect(MockServerDeviceDiscoverySource).toHaveBeenCalledWith(dmk);
    expect(RnBleDeviceDiscoverySource).not.toHaveBeenCalled();
    expect(RnHidDeviceDiscoverySource).not.toHaveBeenCalled();
  });
});
