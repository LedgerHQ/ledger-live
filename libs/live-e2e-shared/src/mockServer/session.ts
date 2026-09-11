import axios from "axios";
import type { ApduMock } from "./types";
import { GET_VERSION_APDU, GET_VERSION_PREFIX, withOnboardingFlags } from "./onboardingFlags";

/** Matches the `MOCK_SERVER_TRANSPORT_URL` env default. */
const DEFAULT_MOCK_SERVER_URL = "https://device-mock-server.aws.ldg-ps-default.ldg-tech.com";

export const mockServerBaseUrl = (): string =>
  (process.env.MOCK_SERVER_TRANSPORT_URL || DEFAULT_MOCK_SERVER_URL).replace(/\/+$/, "");

/**
 * A handle on the mock server session the app provisioned at boot, so a test can keep
 * editing the devices — swapping APDU mocks mid-flow to drive the device where it needs
 * to go. The token is read back from the running app.
 */
export class MockServerSessionHandle {
  constructor(
    readonly baseUrl: string,
    readonly token: string,
  ) {}

  private get auth() {
    return { Authorization: `Bearer ${this.token}` };
  }

  /** Ids of the seeded devices, in the order the session imported them. */
  async deviceIds(): Promise<string[]> {
    const { data } = await axios.get<{ id: string }[]>(`${this.baseUrl}/devices`, {
      headers: this.auth,
    });
    return data.map(({ id }) => id);
  }

  /** Replaces a device's APDU mocks. Pass `[]` to hand it back to the emulated device. */
  async setApduMocks(deviceId: string, mocks: ApduMock[]): Promise<void> {
    await axios.delete(`${this.baseUrl}/devices/${deviceId}/mocks`, { headers: this.auth });
    for (const mock of mocks) {
      await axios.post(`${this.baseUrl}/devices/${deviceId}/mocks`, mock, { headers: this.auth });
    }
  }

  /** Sends an APDU to a device and returns the raw hex reply. */
  async sendApdu(deviceId: string, apdu: string): Promise<string> {
    const { data } = await axios.post<{ response: string }>(
      `${this.baseUrl}/devices/${deviceId}/apdu`,
      { apdu },
      { headers: this.auth },
    );
    return data.response;
  }

  /**
   * Freezes the first device on an onboarding step by pinning GET_VERSION. Only the
   * flag bytes are rewritten — the rest of the reply is whatever the device actually
   * returned, so this needs no per-model frame and survives firmware changes.
   *
   * Drive it onwards with another step rather than releasing the mock: released, the
   * device resumes from where it was and has to re-traverse the steps.
   */
  async pinOnboardingStep(step: number, onboarded = false): Promise<void> {
    const deviceId = await this.firstDeviceId();
    const reply = await this.sendApdu(deviceId, GET_VERSION_APDU);

    await this.setApduMocks(deviceId, [
      { prefix: GET_VERSION_PREFIX, responses: [withOnboardingFlags(reply, step, onboarded)] },
    ]);
  }

  /** Convenience for the common single-device session. */
  async mockFirstDevice(mocks: ApduMock[]): Promise<void> {
    await this.setApduMocks(await this.firstDeviceId(), mocks);
  }

  private async firstDeviceId(): Promise<string> {
    const [deviceId] = await this.deviceIds();
    if (!deviceId) throw new Error("mock server session has no devices");
    return deviceId;
  }
}

/** Attaches to a session by token, on whichever server the run points at. */
export const attachMockServerSession = (token: string): MockServerSessionHandle =>
  new MockServerSessionHandle(mockServerBaseUrl(), token);
