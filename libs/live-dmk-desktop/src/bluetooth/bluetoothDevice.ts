import { webBleIdentifier } from "@ledgerhq/device-transport-kit-web-ble";

export const webBleTransportIdentifier: string = webBleIdentifier;

export const isBluetoothDevice = (device: { transport: string }): boolean =>
  device.transport === webBleTransportIdentifier;
