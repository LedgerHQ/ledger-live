import { usb } from "usb";
import { ledgerUSBVendorId } from "@ledgerhq/devices";
import { log } from "@ledgerhq/logs";

export type Device = {
  locationId: number;
  vendorId: number;
  productId: number;
  deviceName: string;
  manufacturer: string;
  serialNumber: number;
  deviceAddress: number;
};

const deviceToLog = ({
  deviceDescriptor: { idProduct },
  busNumber,
  deviceAddress,
}) =>
  `productId=${idProduct} busNumber=${busNumber} deviceAddress=${deviceAddress}`;

let usbDebounce = 1000;
export const setUsbDebounce = (n: number) => {
  usbDebounce = n;
};

const mapRawDevice = ({
  busNumber: locationId,
  deviceAddress,
  deviceDescriptor: {
    idVendor: vendorId,
    idProduct: productId,
    iSerialNumber: serialNumber,
  },
}: usb.Device): Device => ({
  locationId, // Nb we dont use this but the mapping might be incorrect.
  vendorId,
  productId,
  deviceName: "",
  manufacturer: "",
  serialNumber,
  deviceAddress,
});

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const listenDevices = (
  onAdd: (arg0: Device) => void,
  onRemove: (arg0: Device) => void
) => {
  let timeout;

  const add = (device) => {
    if (device.deviceDescriptor.idVendor !== ledgerUSBVendorId) return;
    log("usb-detection", "add: " + deviceToLog(device));

    if (!timeout) {
      // a time is needed for the device to actually be connectable over HID..
      // we also take this time to not emit the device yet and potentially cancel it if a remove happens.
      timeout = setTimeout(() => {
        onAdd(mapRawDevice(device));
        timeout = null;
      }, usbDebounce);
    }
  };

  const remove = (device) => {
    if (device.deviceDescriptor.idVendor !== ledgerUSBVendorId) return;
    log("usb-detection", "remove: " + deviceToLog(device));

    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    } else {
      onRemove(mapRawDevice(device));
    }
  };

  usb.on("attach", add);
  usb.on("detach", remove);

  return () => {
    if (timeout) clearTimeout(timeout);
    usb.unrefHotplugEvents();
  };
};

process.on("exit", () => {
  usb.unrefHotplugEvents();
});
