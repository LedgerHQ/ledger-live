import { DeviceModelId } from "@ledgerhq/types-devices";
import { getSpeculosModel } from "../speculosAppVersion";
import type { DeviceConfig } from "@ledgerhq/device-mockserver-client";
import type { MockServerApp } from "./installedApps";

export type MockDevice = Omit<DeviceConfig, "apps"> & {
  modelId: DeviceModelId;
  apps?: MockServerApp[];
};

export const MOCK_STAX: DeviceConfig = {
  name: "Ledger Stax",
  device_type: "stax",
  connectivity_type: "USB",
  onboarded: true,
};

export const MOCK_FLEX: DeviceConfig = {
  name: "Ledger Flex",
  device_type: "flex",
  connectivity_type: "USB",
  onboarded: true,
};

export const MOCK_NANO_GEN_5: DeviceConfig = {
  name: "Ledger Nano Gen5",
  device_type: "apexp",
  connectivity_type: "USB",
  masks: [0x33400000],
  onboarded: true,
};

export const MOCK_NANOX: DeviceConfig = {
  name: "Ledger Nano X",
  device_type: "nanoX",
  connectivity_type: "USB",
  onboarded: true,
};

export const MOCK_NANOSP: DeviceConfig = {
  name: "Ledger Nano S Plus",
  device_type: "nanoSP",
  connectivity_type: "USB",
  onboarded: true,
};

export const MOCK_NANOS: DeviceConfig = {
  name: "Ledger Nano S",
  device_type: "nanoS",
  connectivity_type: "USB",
  onboarded: true,
};

const MOCK_DEVICES: Partial<Record<DeviceModelId, DeviceConfig>> = {
  [DeviceModelId.nanoS]: MOCK_NANOS,
  [DeviceModelId.nanoSP]: MOCK_NANOSP,
  [DeviceModelId.nanoX]: MOCK_NANOX,
  [DeviceModelId.stax]: MOCK_STAX,
  [DeviceModelId.europa]: MOCK_FLEX,
  [DeviceModelId.apex]: MOCK_NANO_GEN_5,
};

export const deviceUnderTest = (): MockDevice => {
  const modelId = getSpeculosModel();
  const device = MOCK_DEVICES[modelId];
  if (!device) throw new Error(`No mock server device for ${modelId}`);
  return { modelId, ...device };
};
