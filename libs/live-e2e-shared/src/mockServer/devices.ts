import { DeviceModelId } from "@ledgerhq/devices";
import { getSpeculosModel } from "../speculosAppVersion";
import type { MockServerDevice } from "./types";

export const MOCK_STAX: MockServerDevice = {
  name: "Ledger Stax",
  device_type: "stax",
  connectivity_type: "USB",
  onboarded: true,
  modelId: DeviceModelId.stax,
};

export const MOCK_FLEX: MockServerDevice = {
  name: "Ledger Flex",
  device_type: "flex",
  connectivity_type: "USB",
  onboarded: true,
  modelId: DeviceModelId.europa,
};

export const MOCK_NANO_GEN_5: MockServerDevice = {
  name: "Ledger Nano Gen5",
  device_type: "apexp",
  connectivity_type: "USB",
  masks: [0x33400000],
  onboarded: true,
  modelId: DeviceModelId.apex,
};

export const MOCK_NANOX: MockServerDevice = {
  name: "Ledger Nano X",
  device_type: "nanox",
  connectivity_type: "USB",
  onboarded: true,
  modelId: DeviceModelId.nanoX,
};

export const MOCK_NANOSP: MockServerDevice = {
  name: "Ledger Nano S Plus",
  device_type: "nanosp",
  connectivity_type: "USB",
  onboarded: true,
  modelId: DeviceModelId.nanoSP,
};

export const MOCK_NANOS: MockServerDevice = {
  name: "Ledger Nano S",
  device_type: "nanos",
  connectivity_type: "USB",
  onboarded: true,
  modelId: DeviceModelId.nanoS,
};

export const MOCK_DEVICES: MockServerDevice[] = [
  MOCK_NANOSP,
  MOCK_NANOX,
  MOCK_NANOS,
  MOCK_STAX,
  MOCK_FLEX,
  MOCK_NANO_GEN_5,
];

export const deviceUnderTest = (): MockServerDevice => {
  const speculosModel = getSpeculosModel();
  return MOCK_DEVICES.find(({ modelId }) => modelId === speculosModel) || MOCK_DEVICES[0];
};
