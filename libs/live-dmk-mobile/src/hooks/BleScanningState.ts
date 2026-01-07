import { ScannedDevice } from "./ScannedDevice";

export type BleScanningState = {
  scannedDevices: ScannedDevice[];
  scanningBleError: Error | null;
  isScanning: boolean;
};
