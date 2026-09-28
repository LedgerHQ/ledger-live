import type { MockServerDevice, MockServerSession } from "./types";

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
