import { DeviceModelId } from "@ledgerhq/devices";
import { Device } from "@ledgerhq/live-common/hw/actions/types";

export const knownDevice = {
  name: "Nano X de test",
  id: "mock_1",
  modelId: DeviceModelId.nanoX,
};

export type ModelId = "nanoX" | "nanoSP" | "nanoS" | "stax";

export function getUSBDevice(model: ModelId): DeviceUSB {
  return { nanoX: nanoX_USB, nanoSP: nanoSP_USB, nanoS: nanoS_USB, stax: stax_USB }[model];
}

export interface DeviceUSB extends Device {
  deviceName: string;
  productId: number;
  vendorId: number;
}
export const nanoX_USB: DeviceUSB = {
  deviceId: "1002",
  deviceName: "Ledger\u00a0Nano\u00a0X",
  productId: 16401,
  vendorId: 11415,
  wired: true,
  modelId: DeviceModelId.nanoX,
};

export const nanoSP_USB: DeviceUSB = {
  deviceId: "1002",
  deviceName: "Ledger Nano S Plus",
  productId: 20497,
  vendorId: 11415,
  wired: true,
  modelId: DeviceModelId.nanoSP,
};
export const nanoS_USB: DeviceUSB = {
  deviceId: "1002",
  deviceName: "Ledger\u00a0Nano\u00a0S",
  productId: 4113,
  vendorId: 11415,
  wired: true,
  modelId: DeviceModelId.nanoS,
};
export const stax_USB: DeviceUSB = {
  deviceId: "1002",
  deviceName: "Ledger\u00a0Stax",
  productId: 24593,
  vendorId: 11415,
  wired: true,
  modelId: DeviceModelId.stax,
};
