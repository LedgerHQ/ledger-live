import { DeviceModelId } from "@ledgerhq/devices";

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

/**
 * A canned reply, matched by hex `prefix`. The server returns the next entry of
 * `responses` per matching APDU and loops when exhausted — so one entry pins a state
 * and several script a progression. Unmatched prefixes reach the emulated device.
 */
export type ApduMock = { prefix: string; responses: string[] };
