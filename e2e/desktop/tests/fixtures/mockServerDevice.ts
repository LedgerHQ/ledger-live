import base from "tests/fixtures/common";

export type MockServerDevice = {
  name: string;
  device_type: string;
  connectivity_type: "USB" | "BLE";
  firmware_version: string;
  apps: { name: string; version: string }[];
  onboarded?: boolean;
};

export type MockServerSession = { devices: MockServerDevice[] };

export const LATEST_FIRMWARE = "1.10.1";
export const OUTDATED_FIRMWARE = "1.9.1";

export const STAX_DEVICE: MockServerDevice = {
  name: "Ledger Stax",
  device_type: "stax",
  connectivity_type: "USB",
  firmware_version: OUTDATED_FIRMWARE,
  apps: [{ name: "BOLOS", version: "1.4.0" }],
  onboarded: false,
};

type MockServerFixtures = {
  mockServerSession: MockServerSession;
};

/**
 * Drives onboarding against an emulated device served by the Device Management Kit
 * mock server (see `renderer/mockServerTransport.ts`) rather than Speculos: the app
 * provisions a session at boot and the transport discovers the seeded device.
 */
export const test = base.extend<MockServerFixtures>({
  mockServerSession: [{ devices: [STAX_DEVICE] }, { option: true }],

  env: async ({ mockServerSession }, use) => {
    await use({
      MOCK_SERVER_TRANSPORT: "1",
      MOCK_SERVER_SESSION: JSON.stringify(mockServerSession),
      ...(process.env.MOCK_SERVER_TRANSPORT_URL
        ? { MOCK_SERVER_TRANSPORT_URL: process.env.MOCK_SERVER_TRANSPORT_URL }
        : {}),
    });
  },
});

export default test;
