import { DeviceModelId, type DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";

import { getDiscoveredDeviceKey } from "./getDiscoveredDeviceKey";

const makeDiscoveredDevice = (overrides: Partial<DiscoveredDevice>) =>
  ({
    id: "device-id",
    name: "Nano X 1A2B",
    deviceModel: { id: "nanoX", model: DeviceModelId.NANO_X, name: "Ledger Nano X" },
    transport: rnBleTransportIdentifier,
    ...overrides,
  }) as DiscoveredDevice;

describe("getDiscoveredDeviceKey", () => {
  it("should identify a Bluetooth device by its id", () => {
    expect(getDiscoveredDeviceKey(makeDiscoveredDevice({ id: "ble-id" }))).toBe(
      `${rnBleTransportIdentifier}:ble-id`,
    );
  });

  it("should identify a USB device by its model, because its id changes at each discovery", () => {
    const usbDevice = makeDiscoveredDevice({ id: "usb-id-1", transport: rnHidTransportIdentifier });

    expect(getDiscoveredDeviceKey(usbDevice)).toBe(`${rnHidTransportIdentifier}:nanoX`);
    expect(getDiscoveredDeviceKey({ ...usbDevice, id: "usb-id-2" })).toBe(
      getDiscoveredDeviceKey(usbDevice),
    );
  });

  it("should identify a Speculos device by its id", () => {
    expect(
      getDiscoveredDeviceKey(
        makeDiscoveredDevice({ id: "speculos-id", transport: speculosIdentifier }),
      ),
    ).toBe(`${speculosIdentifier}:speculos-id`);
  });

  it("should give different keys to the same id on different transports", () => {
    const bleDevice = makeDiscoveredDevice({ id: "same-id" });
    const speculosDevice = makeDiscoveredDevice({ id: "same-id", transport: speculosIdentifier });

    expect(getDiscoveredDeviceKey(bleDevice)).not.toBe(getDiscoveredDeviceKey(speculosDevice));
  });
});
