import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { webHidIdentifier as webHidTransportIdentifier } from "@ledgerhq/device-transport-kit-web-hid";
import {
  connectDeviceUseCase as sharedConnectDeviceUseCase,
  DefaultDeviceDiscoveryService,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { EMPTY } from "rxjs";

import { connectDevice } from "./connectDevice";
import { SpeculosDeviceDiscoverySource } from "./discoveryService/sources/SpeculosDeviceDiscoverySource";
import { WebHidDeviceDiscoverySource } from "./discoveryService/sources/WebHidDeviceDiscoverySource";
import { createConnectionError, filterMatchedDevices } from "./utils";

const mockWebHidListen = jest.fn(() => EMPTY);
const mockSpeculosListen = jest.fn(() => EMPTY);

jest.mock("@ledgerhq/live-dmk-shared", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-shared");

  return {
    ...actual,
    connectDeviceUseCase: jest.fn(() => EMPTY),
  };
});

jest.mock("./discoveryService/sources/WebHidDeviceDiscoverySource", () => ({
  WebHidDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: mockWebHidListen,
    transportId: "WEB-HID",
  })),
}));

jest.mock("./discoveryService/sources/SpeculosDeviceDiscoverySource", () => ({
  SpeculosDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: mockSpeculosListen,
    transportId: "SPECULOS",
  })),
}));

const mockedSharedConnectDeviceUseCase = jest.mocked(sharedConnectDeviceUseCase);

const knownDevice: KnownDevice = {
  transport: webHidTransportIdentifier,
  deviceModelId: DeviceModelId.nanoX,
  id: "",
  name: "Ledger Nano X",
};

describe("desktop connectDevice", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("GIVEN connect input, WHEN connecting on desktop, THEN it should delegate to the shared use case with WebHID dependencies", () => {
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
    expect(WebHidDeviceDiscoverySource).toHaveBeenCalledWith(dmk);
    expect(mockedSharedConnectDeviceUseCase).toHaveBeenCalledWith({
      acceptedDeviceModelIds,
      dmk,
      knownDevices: [knownDevice],
      onConnected,
      deviceDiscoveryService: expect.any(DefaultDeviceDiscoveryService),
      matchDiscoveredDevices: filterMatchedDevices,
      mapConnectionError: createConnectionError,
    });
  });

  it("GIVEN a started discovery, WHEN devices are discovered, THEN it should listen to both WebHID and Speculos", () => {
    // GIVEN
    const dmk = {} as DeviceManagementKit;
    connectDevice({
      acceptedDeviceModelIds: [DeviceModelId.nanoX],
      dmk,
      knownDevices: [knownDevice],
      onConnected: jest.fn(),
    });

    // WHEN
    mockedSharedConnectDeviceUseCase.mock.calls[0][0].deviceDiscoveryService.start();

    // THEN
    expect(SpeculosDeviceDiscoverySource).toHaveBeenCalledWith(dmk);
    expect(mockWebHidListen).toHaveBeenCalled();
    expect(mockSpeculosListen).toHaveBeenCalled();
  });
});
