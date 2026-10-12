import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import type { ConnectNewDeviceFilterListedDevices, ListedDevice } from "@ledgerhq/live-dmk-shared";

const isUsb = ({ discoveredDevice }: ListedDevice): boolean =>
  discoveredDevice.transport === rnHidTransportIdentifier;

/**
 * A device plugged in with a USB cable shows which device the user wants, and the same device can
 * also be discovered over Bluetooth. When a USB device is available, only the available USB devices
 * show. Otherwise, only the devices on the other transports show. An unavailable USB device never
 * shows.
 */
export const filterListedDevices: ConnectNewDeviceFilterListedDevices = listedDevices => {
  const availableUsbDevices = listedDevices.filter(
    listedDevice => isUsb(listedDevice) && listedDevice.isAvailable,
  );

  return availableUsbDevices.length > 0
    ? availableUsbDevices
    : listedDevices.filter(listedDevice => !isUsb(listedDevice));
};
