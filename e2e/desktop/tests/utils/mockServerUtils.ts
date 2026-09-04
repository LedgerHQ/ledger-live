import { getEnvDefault } from "@shared/env";

/**
 * Synthetic genuine-verdict APDU relayed at the end of the mock server's
 * genuine script. Its response *data* is the verdict: `0000` means genuine, so
 * any other value makes the device report as not genuine.
 *
 * See device-sdk-ts `apps/device-mock-server/src/internal/secure-channel/service/secureChannelApdus.ts`.
 */
const GENUINE_VERDICT_PREFIX = "e0f1";
const NOT_GENUINE_VERDICT_RESPONSE = "00019000";

const HEALTH_TIMEOUT_MS = 4000;

type MockServerApp = { name: string; version: string };
type MockServerApduMock = { prefix: string; response: string };

export type MockServerDeviceConfig = {
  name: string;
  device_type: string;
  connectivity_type: string;
  firmware_version: string;
  apps: MockServerApp[];
  masks: number[];
  onboarded: boolean;
  mocks?: MockServerApduMock[];
};

const STAX = {
  name: "Ledger Stax",
  device_type: "stax",
  connectivity_type: "USB",
  firmware_version: "1.10.1",
  mask: 0x33200000,
};

/**
 * An onboarded Stax whose genuine check passes, or fails when `genuine` is
 * false. Everything else about the two devices is identical, so a failing
 * genuine check is the only difference between the two flows.
 */
export function staxDevice({ genuine }: { genuine: boolean }): MockServerDeviceConfig {
  const { mask, ...device } = STAX;

  return {
    ...device,
    apps: [{ name: "BOLOS", version: device.firmware_version }],
    masks: [mask],
    onboarded: true,
    ...(genuine
      ? {}
      : {
          mocks: [{ prefix: GENUINE_VERDICT_PREFIX, response: NOT_GENUINE_VERDICT_RESPONSE }],
        }),
  };
}

/**
 * The shared deployment, which is what these tests run against. Set
 * `MOCK_SERVER_TRANSPORT_URL` to point them at a local instance instead.
 */
export function mockServerBaseUrl(): string {
  return process.env.MOCK_SERVER_TRANSPORT_URL || getEnvDefault("MOCK_SERVER_TRANSPORT_URL");
}

export async function isMockServerReachable(baseUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${baseUrl}/health`, {
      signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS),
    });
    return response.ok;
  } catch {
    return false;
  }
}
