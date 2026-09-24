import type { DeviceModelId } from "@ledgerhq/types-devices";

/** A device as the mock server's `/import` endpoint expects it. */
export type MockServerDevice = {
  name: string;
  device_type: string;
  connectivity_type: "USB" | "BLE";
  firmware_version?: string;
  apps?: { name: string; version: string }[];
  masks?: number[];
  mocks?: ApduMock[];
  onboarded?: boolean;
  modelId: DeviceModelId;
};

export type MockServerSession = { devices: MockServerDevice[] };

export type ApduMock = { prefix: string; responses: string[] };
