import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  connectDeviceUseCase as sharedConnectDeviceUseCase,
  DefaultDeviceDiscoveryService,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { EMPTY } from "rxjs";

import { connectDevice } from "./connectDevice";
import { RnBleDeviceDiscoverySource } from "./discoveryService/sources/RnBleDeviceDiscoverySource";
import { RnHidDeviceDiscoverySource } from "./discoveryService/sources/RnHidDeviceDiscoverySource";
import { createConnectionError, filterMatchedDevices } from "./utils";

jest.mock("@ledgerhq/live-dmk-shared", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-shared");

  return {
    ...actual,
    connectDeviceUseCase: jest.fn(() => EMPTY),
  };
});

jest.mock("./discoveryService/sources/RnBleDeviceDiscoverySource", () => ({
  RnBleDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: jest.fn(),
    transportId: "ble",
  })),
}));

jest.mock("./discoveryService/sources/RnHidDeviceDiscoverySource", () => ({
  RnHidDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: jest.fn(),
    transportId: "hid",
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
    });
    expect(mockedSharedConnectDeviceUseCase.mock.calls[0][0]).not.toHaveProperty(
      "mapUnexpectedDiscoveryError",
    );
  });
});
