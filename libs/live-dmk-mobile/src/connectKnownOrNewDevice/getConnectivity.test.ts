import type { TransportIdentifier } from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import type { MockServerDevice } from "@features/platform-device-mock-server";
import { DeviceModelId } from "@ledgerhq/types-devices";

import { buildGetConnectivity } from "./getConnectivity";

const device = (transport: TransportIdentifier, id = "device-id") => ({
  transport,
  id,
  name: "Nano X",
  deviceModelId: DeviceModelId.nanoX,
});

const mockServerDevice = (id: string, connectivityType: string) =>
  ({ id, name: id, device_type: "nanoX", connectivity_type: connectivityType }) as MockServerDevice;

describe("buildGetConnectivity", () => {
  it("should give BLE for a Bluetooth device", () => {
    expect(buildGetConnectivity()(device(rnBleTransportIdentifier))).toBe("BLE");
  });

  it("should give USB for a USB device", () => {
    expect(buildGetConnectivity()(device(rnHidTransportIdentifier))).toBe("USB");
  });

  it("should give USB for a Speculos device", () => {
    expect(buildGetConnectivity()(device(speculosIdentifier))).toBe("USB");
  });

  it("should give the connectivity type of the mock server for a mock device", () => {
    const getConnectivity = buildGetConnectivity(() => [
      mockServerDevice("mock-usb-id", "USB"),
      mockServerDevice("mock-ble-id", "BLE"),
    ]);

    expect(getConnectivity(device(mockserverIdentifier, "mock-usb-id"))).toBe("USB");
    expect(getConnectivity(device(mockserverIdentifier, "mock-ble-id"))).toBe("BLE");
  });

  it("should give BLE for a mock device that the mock server does not list", () => {
    expect(buildGetConnectivity(() => [])(device(mockserverIdentifier, "unlisted-mock-id"))).toBe(
      "BLE",
    );
  });

  it("should read the latest device list of the mock server at each call", () => {
    let mockServerDevices = [mockServerDevice("mock-id", "BLE")];
    const getConnectivity = buildGetConnectivity(() => mockServerDevices);

    mockServerDevices = [mockServerDevice("mock-id", "USB")];

    expect(getConnectivity(device(mockserverIdentifier, "mock-id"))).toBe("USB");
  });
});
