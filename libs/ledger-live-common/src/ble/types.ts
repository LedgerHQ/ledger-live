import type { DeviceModel } from "@ledgerhq/types-devices";

// Inspired by Device class from react-native-ble-plx
// Should be exported from somewhere else
// TODO: Update after BIM transport is finished
export type TransportBleDevice = {
  // Device identifier: MAC address on Android and UUID on iOS.
  id: string;
  // Device name
  name: string | null;
  // User friendly name of device.
  localName: string | null;
  // Current Received Signal Strength Indication of device
  rssi: number | null;
  // Current Maximum Transmission Unit for this device.
  // When device is not connected default value of 23 is used.
  mtu: number;
  // List of available services visible during scanning.
  serviceUUIDs: string[] | null;
  // Allows any other properties
  [otherOptions: string]: unknown;
};

// Inspired by BleError class from react-native-ble-plx
// BleError should be an error class which is guaranteed to be thrown by all functions
// by our different implementations of Transport or at least of ble implementation of Transport
// TODO: BleError should probably be a class and update after BIM transport is finished
// HwTransportError exists now, and should be used.
// But we need to map all the errors coming from withDevice to HwTransportError.
export type BleError = Error & {
  // Platform independent error code.
  // It is defined as an enum named BleErrorCode in react-native-ble-plx
  // We should have our own mapping
  errorCode: number;
  // Allows any other properties
  [otherOptions: string]: unknown;
};

export type ScannedDevice = {
  deviceId: string;
  deviceName: string;
  bleRssi: number | null;
  deviceModel: DeviceModel;
};
