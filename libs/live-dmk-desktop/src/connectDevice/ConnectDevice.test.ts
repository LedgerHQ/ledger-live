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
import { WebHidDeviceDiscoverySource } from "./discoveryService/sources/WebHidDeviceDiscoverySource";
import { createConnectionError, filterMatchedDevices } from "./utils";

jest.mock("@ledgerhq/live-dmk-shared", () => {
  const actual = jest.requireActual("@ledgerhq/live-dmk-shared");

  return {
    ...actual,
    connectDeviceUseCase: jest.fn(() => EMPTY),
  };
});

jest.mock("./discoveryService/sources/WebHidDeviceDiscoverySource", () => ({
  WebHidDeviceDiscoverySource: jest.fn().mockImplementation(() => ({
    listen: jest.fn(),
    transportId: "WEB-HID",
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
});
