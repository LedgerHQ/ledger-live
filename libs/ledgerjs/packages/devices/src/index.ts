import semver from "semver";

/**
 * The USB product IDs will be defined as MMII, encoding a model (MM) and an interface bitfield (II)
 *
 ** Model
 * Ledger Nano S : 0x10
 * Ledger Blue : 0x00
 * Ledger Nano X : 0x40
 *
 ** Interface support bitfield
 * Generic HID : 0x01
 * Keyboard HID : 0x02
 * U2F : 0x04
 * CCID : 0x08
 * WebUSB : 0x10
 */
export const IIGenericHID = 0x01;
export const IIKeyboardHID = 0x02;
export const IIU2F = 0x04;
export const IICCID = 0x08;
export const IIWebUSB = 0x10;

export enum DeviceModelId {
  blue = "blue",
  nanoS = "nanoS",
  nanoSP = "nanoSP",
  nanoX = "nanoX",
  stax = "stax",
}

const devices: { [key in DeviceModelId]: DeviceModel } = {
  [DeviceModelId.blue]: {
    id: DeviceModelId.blue,
    productName: "Ledger Blue",
    productIdMM: 0x00,
    legacyUsbProductId: 0x0000,
    usbOnly: true,
    memorySize: 480 * 1024,
    masks: [0x31000000, 0x31010000],
    getBlockSize: (_firwareVersion: string): number => 4 * 1024,
  },
  [DeviceModelId.nanoS]: {
    id: DeviceModelId.nanoS,
    productName: "Ledger Nano S",
    productIdMM: 0x10,
    legacyUsbProductId: 0x0001,
    usbOnly: true,
    memorySize: 320 * 1024,
    masks: [0x31100000],
    getBlockSize: (firmwareVersion: string): number =>
      semver.lt(semver.coerce(firmwareVersion) ?? "", "2.0.0")
        ? 4 * 1024
        : 2 * 1024,
  },
  [DeviceModelId.nanoSP]: {
    id: DeviceModelId.nanoSP,
    productName: "Ledger Nano S Plus",
    productIdMM: 0x50,
    legacyUsbProductId: 0x0005,
    usbOnly: true,
    memorySize: 1536 * 1024,
    masks: [0x33100000],
    getBlockSize: (_firmwareVersion: string): number => 32,
  },
  [DeviceModelId.nanoX]: {
    id: DeviceModelId.nanoX,
    productName: "Ledger Nano X",
    productIdMM: 0x40,
    legacyUsbProductId: 0x0004,
    usbOnly: false,
    memorySize: 2 * 1024 * 1024,
    masks: [0x33000000],
    getBlockSize: (_firwareVersion: string): number => 4 * 1024,
    bluetoothSpec: [
      {
        serviceUuid: "13d63400-2c97-0004-0000-4c6564676572",
        notifyUuid: "13d63400-2c97-0004-0001-4c6564676572",
        writeUuid: "13d63400-2c97-0004-0002-4c6564676572",
        writeCmdUuid: "13d63400-2c97-0004-0003-4c6564676572",
      },
    ],
  },
  [DeviceModelId.stax]: {
    id: DeviceModelId.stax,
    productName: "Ledger Stax",
    productIdMM: 0x60,
    legacyUsbProductId: 0x0006,
    usbOnly: false,
    memorySize: 1536 * 1024,
    masks: [0x33200000],
    getBlockSize: (_firmwareVersion: string): number => 32,
    bluetoothSpec: [
      {
        serviceUuid: "13d63400-2c97-6004-0000-4c6564676572",
        notifyUuid: "13d63400-2c97-6004-0001-4c6564676572",
        writeUuid: "13d63400-2c97-6004-0002-4c6564676572",
        writeCmdUuid: "13d63400-2c97-6004-0003-4c6564676572",
      },
    ],
  },
};

const productMap = {
  Blue: DeviceModelId.blue,
  "Nano S": DeviceModelId.nanoS,
  "Nano S Plus": DeviceModelId.nanoSP,
  "Nano X": DeviceModelId.nanoX,
  Stax: DeviceModelId.stax,
};

const devicesList: DeviceModel[] = Object.values(devices);

/**
 *
 */
export const ledgerUSBVendorId = 0x2c97;

/**
 *
 */
export const getDeviceModel = (id: DeviceModelId): DeviceModel => {
  const info = devices[id];
  if (!info) throw new Error("device '" + id + "' does not exist");
  return info;
};

/**
 * Given a `targetId`, return the deviceModel associated to it,
 * based on the first two bytes.
 */
export const identifyTargetId = (
  targetId: number
): DeviceModel | null | undefined => {
  const deviceModel = devicesList.find(({ masks }) =>
    masks.find((mask) => (targetId & 0xffff0000) === mask)
  );

  return deviceModel;
};

/**
 *
 */
export const identifyUSBProductId = (
  usbProductId: number
): DeviceModel | null | undefined => {
  const legacy = devicesList.find((d) => d.legacyUsbProductId === usbProductId);
  if (legacy) return legacy;
  const mm = usbProductId >> 8;
  const deviceModel = devicesList.find((d) => d.productIdMM === mm);
  return deviceModel;
};

export const identifyProductName = (
  productName: string
): DeviceModel | null | undefined => {
  const deviceModel = devicesList.find((d) => d.id === productMap[productName]);
  return deviceModel;
};

const bluetoothServices: string[] = [];
const serviceUuidToInfos: Record<string, BluetoothInfos> = {};

for (const id in devices) {
  const deviceModel = devices[id];
  const { bluetoothSpec } = deviceModel;
  if (bluetoothSpec) {
    for (let i = 0; i < bluetoothSpec.length; i++) {
      const spec = bluetoothSpec[i];
      bluetoothServices.push(spec.serviceUuid);
      serviceUuidToInfos[spec.serviceUuid] = serviceUuidToInfos[
        spec.serviceUuid.replace(/-/g, "")
      ] = {
        deviceModel,
        ...spec,
      };
    }
  }
}

/**
 *
 */
export const getBluetoothServiceUuids = (): string[] => bluetoothServices;

/**
 *
 */
export const getInfosForServiceUuid = (
  uuid: string
): BluetoothInfos | undefined => serviceUuidToInfos[uuid.toLowerCase()];

/**
 *
 */
export interface DeviceModel {
  id: DeviceModelId;
  productName: string;
  productIdMM: number;
  legacyUsbProductId: number;
  usbOnly: boolean;
  memorySize: number;
  masks: number[];
  // blockSize: number, // THIS FIELD IS DEPRECATED, use getBlockSize
  getBlockSize: (firmwareVersion: string) => number;
  bluetoothSpec?: {
    serviceUuid: string;
    writeUuid: string;
    writeCmdUuid: string;
    notifyUuid: string;
  }[];
}

/**
 *
 */
export interface BluetoothInfos {
  deviceModel: DeviceModel;
  serviceUuid: string;
  writeUuid: string;
  writeCmdUuid: string;
  notifyUuid: string;
}
