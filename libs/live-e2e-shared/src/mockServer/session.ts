import { DmkNetworkClient } from "@ledgerhq/device-management-kit";
import { MockClient, type Device, type MockConfig } from "@ledgerhq/device-mockserver-client";

import { GET_VERSION_APDU, GET_VERSION_PREFIX, withOnboardingFlags } from "./onboardingFlags";

const REQUEST_TIMEOUT_MS = 10_000;

/** Matches the `MOCK_SERVER_TRANSPORT_URL` env default. */
const DEFAULT_MOCK_SERVER_URL = "https://device-mock-server.aws.ldg-ps-default.ldg-tech.com";
const REACHABILITY_TIMEOUT_MS = 5_000;

const stripTrailingSlashes = (value: string): string => {
  let end = value.length;
  while (end > 0 && value[end - 1] === "/") end--;
  return value.slice(0, end);
};

export const mockServerBaseUrl = (): string =>
  stripTrailingSlashes(process.env.MOCK_SERVER_TRANSPORT_URL || DEFAULT_MOCK_SERVER_URL);

/** `MockClient` never forwards a request timeout, so one is applied to the fetch under it. */
const timeoutAfter =
  (timeoutMs: number): typeof fetch =>
  (input: string | URL | Request, init?: RequestInit) =>
    fetch(input, { ...init, signal: init?.signal ?? AbortSignal.timeout(timeoutMs) });

export async function assertMockServerReachable(): Promise<void> {
  const baseUrl = mockServerBaseUrl();
  try {
    await new DmkNetworkClient({ baseUrl }).get("health", { timeoutMs: REACHABILITY_TIMEOUT_MS });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`Mock server unreachable at ${baseUrl} (${reason}).`);
  }
}

/**
 * A handle on the mock server session the app provisioned at boot, so a test can keep
 * editing the device — swapping APDU mocks mid-flow to drive it where it needs to go.
 * The token is read back from the running app.
 */
export class MockServerSessionHandle {
  private readonly client: MockClient;

  constructor(baseUrl: string, token: string) {
    this.client = new MockClient(baseUrl, {
      token,
      httpClient: new DmkNetworkClient({ baseUrl, fetch: timeoutAfter(REQUEST_TIMEOUT_MS) }),
    });
  }

  /** Apps the device reports as installed, which is not what the install UI shows. */
  async installedApps(): Promise<string[]> {
    const { apps = [] } = await this.firstDevice();
    return apps.map(({ name }) => name);
  }

  /**
   * Freezes the device on an onboarding step by pinning GET_VERSION. Only the flag bytes
   * are rewritten — the rest of the reply is whatever the device actually returned, so
   * this needs no per-model frame and survives firmware changes.
   *
   * Drive it onwards with another step rather than releasing the mock: released, the
   * device resumes from where it was and has to re-traverse the steps.
   */
  async pinOnboardingStep(step: number, onboarded = false): Promise<void> {
    const { id } = await this.firstDevice();
    const { response } = await this.client.sendApdu(id, GET_VERSION_APDU);

    await this.pinApdu(id, {
      prefix: GET_VERSION_PREFIX,
      responses: [withOnboardingFlags(response, step, onboarded)],
    });
  }

  /**
   * Edits the mock covering a prefix in place rather than clearing and re-adding it:
   * `addMock` does not replace a prefix it already holds, and dropping the mock first
   * leaves a window in which the emulated device answers.
   */
  private async pinApdu(deviceId: string, mock: MockConfig): Promise<void> {
    const existing = await this.client.listMocks(deviceId);
    const current = existing.find(({ prefix }) => prefix === mock.prefix);

    if (current) {
      await this.client.editMock(deviceId, current.id, mock);
    } else {
      await this.client.addMock(deviceId, mock);
    }
  }

  private async firstDevice(): Promise<Device> {
    const [device] = await this.client.listDevices();
    if (!device) throw new Error("mock server session has no devices");
    return device;
  }
}
