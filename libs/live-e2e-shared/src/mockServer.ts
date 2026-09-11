import { DeviceModelId } from "@ledgerhq/devices";
import { getSpeculosModel } from "./speculosAppVersion";
import axios from "axios";

export type { DeviceModelId };

/** A device as the mock server's `/import` endpoint expects it. */
export type MockServerDevice = {
  name: string;
  device_type: string;
  connectivity_type: "USB" | "BLE";
  firmware_version?: string;
  apps?: { name: string; version: string }[];
  masks?: number[];
  mocks?: { prefix: string; responses: string[] }[];
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

/** Matches the `MOCK_SERVER_TRANSPORT_URL` env default. */
const DEFAULT_MOCK_SERVER_URL = "https://device-mock-server.aws.ldg-ps-default.ldg-tech.com";

export const mockServerBaseUrl = (): string =>
  (process.env.MOCK_SERVER_TRANSPORT_URL || DEFAULT_MOCK_SERVER_URL).replace(/\/+$/, "");

export type ApduMock = { prefix: string; responses: string[] };

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
   * Release it again with `mockFirstDevice([])`.
   */
  async pinOnboardingStep(step: number, onboarded = false): Promise<void> {
    const [deviceId] = await this.deviceIds();
    if (!deviceId) throw new Error("mock server session has no devices");

    const reply = await this.sendApdu(deviceId, GET_VERSION_APDU);
    await this.setApduMocks(deviceId, [
      { prefix: GET_VERSION_PREFIX, responses: [withOnboardingFlags(reply, step, onboarded)] },
    ]);
  }

  /** Convenience for the common single-device session. */
  async mockFirstDevice(mocks: ApduMock[]): Promise<void> {
    const [deviceId] = await this.deviceIds();
    if (!deviceId) throw new Error("mock server session has no devices");
    await this.setApduMocks(deviceId, mocks);
  }
}

const GET_VERSION_APDU = "e001000000";
const GET_VERSION_PREFIX = "e001";

/** Onboarding steps, as encoded in the fourth flag byte of a GET_VERSION reply. */
export const ONBOARDING_STEP = {
  pin: 0x06,
  newDevice: 0x07,
  newDeviceConfirming: 0x08,
  restoreSeed: 0x09,
  ready: 0x0b,
} as const;

/**
 * Rewrites the onboarding flags inside a real GET_VERSION reply.
 *
 * The reply is `targetId | seVersion | flags | …`, each length-prefixed, so the flags
 * are located by walking it rather than assumed — their offset moves with the length
 * of the firmware string, and the targetId differs per model.
 */
export function withOnboardingFlags(
  getVersionReply: string,
  step: number,
  onboarded: boolean,
): string {
  const reply = Buffer.from(getVersionReply, "hex");

  const seVersionLength = reply[4]; // after the 4-byte targetId
  const flagsOffset = 5 + seVersionLength + 1;
  const flagsLength = reply[flagsOffset - 1];
  if (!flagsLength) {
    throw new Error(`Could not locate the flag bytes in GET_VERSION reply "${getVersionReply}"`);
  }

  reply[flagsOffset] = onboarded ? reply[flagsOffset] | 0x04 : reply[flagsOffset] & ~0x04;
  reply[flagsOffset + flagsLength - 1] = step;

  return reply.toString("hex");
}
