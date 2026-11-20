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
  it("GIVEN a Bluetooth device, WHEN getting its connectivity, THEN it should give BLE", () => {
    // GIVEN / WHEN / THEN
    expect(buildGetConnectivity()(device(rnBleTransportIdentifier))).toBe("BLE");
  });

  it("GIVEN a USB device, WHEN getting its connectivity, THEN it should give USB", () => {
    // GIVEN / WHEN / THEN
    expect(buildGetConnectivity()(device(rnHidTransportIdentifier))).toBe("USB");
  });

  it("GIVEN a Speculos device, WHEN getting its connectivity, THEN it should give USB", () => {
    // GIVEN / WHEN / THEN
    expect(buildGetConnectivity()(device(speculosIdentifier))).toBe("USB");
  });

  it("GIVEN mock devices listed by the mock server, WHEN getting their connectivity, THEN it should give the connectivity type of the mock server", () => {
    // GIVEN
    const getConnectivity = buildGetConnectivity(() => [
      mockServerDevice("mock-usb-id", "USB"),
      mockServerDevice("mock-ble-id", "BLE"),
    ]);

    // WHEN / THEN
    expect(getConnectivity(device(mockserverIdentifier, "mock-usb-id"))).toBe("USB");
    expect(getConnectivity(device(mockserverIdentifier, "mock-ble-id"))).toBe("BLE");
  });

  it("GIVEN a mock device that the mock server does not list, WHEN getting its connectivity, THEN it should give BLE", () => {
    // GIVEN / WHEN / THEN
    expect(buildGetConnectivity(() => [])(device(mockserverIdentifier, "unlisted-mock-id"))).toBe(
      "BLE",
    );
  });

  it("GIVEN a connectivity getter built on the mock server device list, WHEN that list changes, THEN it should read the latest device list of the mock server at each call", () => {
    // GIVEN
    let mockServerDevices = [mockServerDevice("mock-id", "BLE")];
    const getConnectivity = buildGetConnectivity(() => mockServerDevices);

    // WHEN
    mockServerDevices = [mockServerDevice("mock-id", "USB")];

    // THEN
    expect(getConnectivity(device(mockserverIdentifier, "mock-id"))).toBe("USB");
  });
});
