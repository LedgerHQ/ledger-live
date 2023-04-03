export type { BleManager } from "react-native-ble-plx";
export type Device = any; // FIXME: should be taken from Transport Device type, which should be at least a union of all Device types
export type Characteristic = any;

export type ReconnectionConfig = {
  pairingThreshold: number;
  delayAfterFirstPairing: number;
};
