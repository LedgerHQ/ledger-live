/**
 * DeviceModelId is a unique identifier to identify the model of a Ledger hardware wallet.
 */
export enum DeviceModelId {
  blue = "blue",
  nanoS = "nanoS",
  nanoSP = "nanoSP",
  nanoX = "nanoX",
  stax = "stax",
  europa = "europa",
  apex = "apex",
}

/**
 * a DeviceModel contains all the information of a specific Ledger hardware wallet model.
 */
export interface DeviceModel {
  id: DeviceModelId;
  productName: string;
  productIdMM: number;
  legacyUsbProductId: number;
  usbOnly: boolean;
  memorySize: number;
  masks: number[];
  getBlockSize: (firmwareVersion: string) => number;
  bluetoothSpec?: {
    serviceUuid: string;
    writeUuid: string;
    writeCmdUuid: string;
    notifyUuid: string;
  }[];
}

/**
 * data about the device. not yet typed
 */
export type Device = any; // Should be a union type of all possible Device object's shape
