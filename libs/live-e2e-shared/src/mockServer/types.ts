import type { DeviceModelId } from "@ledgerhq/types-devices";

/** An app on a mocked device. Without `hash` it reads as sideloaded (DSDK-1475). */
export type MockServerApp = { name: string; version: string; hash?: string };

/** A device as the mock server's `/import` endpoint expects it. */
export type MockServerDevice = {
  name: string;
  device_type: string;
  connectivity_type: "USB" | "BLE";
  firmware_version?: string;
  apps?: MockServerApp[];
  masks?: number[];
  mocks?: ApduMock[];
  onboarded?: boolean;
  modelId: DeviceModelId;
};

export type MockServerSession = { devices: MockServerDevice[] };

export type ApduMock = { prefix: string; responses: string[] };
