import { DeviceModelId } from "@ledgerhq/devices";
import { getSpeculosModel } from "./speculosAppVersion";

export type { DeviceModelId };

/** A device as the mock server's `/import` endpoint expects it. */
export type MockServerDevice = {
  name: string;
  device_type: string;
  connectivity_type: "USB" | "BLE";
  firmware_version?: string;
  apps?: { name: string; version: string }[];
  masks?: number[];
  onboarded?: boolean;
  modelId: DeviceModelId;
};

export type MockServerSession = { devices: MockServerDevice[] };

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

/** Fills in the latest firmware for any device that does not pin one. */
export async function withResolvedFirmware(device: MockServerDevice): Promise<MockServerDevice> {
  if (device.firmware_version) return device;
  return { ...device, firmware_version: process.env.SPECULOS_FIRMWARE_VERSION };
}

/** The launch env that points an app's DMK at the mock server with this session seeded. */
export async function mockServerEnv(session: MockServerSession): Promise<Record<string, string>> {
  const devices = await Promise.all(session.devices.map(withResolvedFirmware));

  return {
    MOCK_SERVER_TRANSPORT: "1",
    MOCK_SERVER_SESSION: JSON.stringify({ ...session, devices }),
    ...(process.env.MOCK_SERVER_TRANSPORT_URL
      ? { MOCK_SERVER_TRANSPORT_URL: process.env.MOCK_SERVER_TRANSPORT_URL }
      : {}),
  };
}
