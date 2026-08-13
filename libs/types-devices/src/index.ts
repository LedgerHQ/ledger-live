/**
 * DeviceModelId is a unique identifier to identify the model of a Ledger hardware wallet.
 */
export const DeviceModelId = {
  /** Ledger Blue */
  blue: "blue",
  /** Ledger Nano S */
  nanoS: "nanoS",
  /** Ledger Nano S Plus */
  nanoSP: "nanoSP",
  /** Ledger Nano X */
  nanoX: "nanoX",
  /** Ledger Stax */
  stax: "stax",
  /** Ledger Flex ("europa" is the internal name) */
  europa: "europa", // DO NOT CHANGE TO FLEX or handle all migration issues, things will break
  /** Ledger Nano Gen5  (Apex) */
  apex: "apex", // DO NOT CHANGE TO A NEW VALUE or handle all migration issues, things will break
} as const;

export type DeviceModelId = (typeof DeviceModelId)[keyof typeof DeviceModelId];

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
