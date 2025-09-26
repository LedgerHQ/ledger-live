import { Device } from "@ledgerhq/types-devices";

export type BleScanningState = {
  scannedDevices: Device[];
  scanningBleError: Error | null;
  isScanning: boolean;
};
