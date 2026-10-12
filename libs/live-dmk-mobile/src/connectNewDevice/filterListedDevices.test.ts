import { DeviceModelId, type DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import type { ListedDevice } from "@ledgerhq/live-dmk-shared";

import { filterListedDevices } from "./filterListedDevices";

const makeListedDevice = (
  key: string,
  transport: DiscoveredDevice["transport"],
  isAvailable = true,
): ListedDevice => ({
  key,
  discoveredDevice: {
    id: `${key}-id`,
    name: "Nano X 1A2B",
    deviceModel: { id: "nanoX", model: DeviceModelId.NANO_X, name: "Ledger Nano X" },
    transport,
  } as DiscoveredDevice,
  isAvailable,
});

const bleDevice = makeListedDevice("ble", rnBleTransportIdentifier);
const unavailableBleDevice = makeListedDevice("unavailable-ble", rnBleTransportIdentifier, false);
const speculosDevice = makeListedDevice("speculos", speculosIdentifier);
const usbDevice = makeListedDevice("usb", rnHidTransportIdentifier);
const unavailableUsbDevice = makeListedDevice("unavailable-usb", rnHidTransportIdentifier, false);

describe("filterListedDevices", () => {
  it("should keep only the available USB devices when a USB device is available", () => {
    expect(
      filterListedDevices([bleDevice, unavailableUsbDevice, speculosDevice, usbDevice]),
    ).toEqual([usbDevice]);
  });

  it("should keep only the other devices, in their order, when no USB device is available", () => {
    expect(
      filterListedDevices([unavailableBleDevice, unavailableUsbDevice, bleDevice, speculosDevice]),
    ).toEqual([unavailableBleDevice, bleDevice, speculosDevice]);
  });

  it("should keep every device when there is no USB device", () => {
    expect(filterListedDevices([bleDevice, unavailableBleDevice])).toEqual([
      bleDevice,
      unavailableBleDevice,
    ]);
  });
});
