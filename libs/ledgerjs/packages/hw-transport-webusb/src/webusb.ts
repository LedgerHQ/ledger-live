import { ledgerUSBVendorId } from "@ledgerhq/devices";

const ledgerDevices = [
  {
    vendorId: ledgerUSBVendorId,
  },
];

export async function requestLedgerDevice(): Promise<USBDevice> {
  const device = await navigator.usb.requestDevice({
    filters: ledgerDevices,
  });
  return device;
}

export async function getLedgerDevices(): Promise<USBDevice[]> {
  const devices = await navigator.usb.getDevices();
  return devices.filter((d) => d.vendorId === ledgerUSBVendorId);
}

export async function getFirstLedgerDevice(): Promise<USBDevice> {
  const existingDevices = await getLedgerDevices();
  if (existingDevices.length > 0) return existingDevices[0];
  return requestLedgerDevice();
}

export const isSupported = (): Promise<boolean> =>
  Promise.resolve(
    !!navigator &&
      !!navigator.usb &&
      typeof navigator.usb.getDevices === "function"
  );
