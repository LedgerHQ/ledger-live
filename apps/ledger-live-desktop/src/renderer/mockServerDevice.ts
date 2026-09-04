import { getEnv } from "@shared/env";
import { DeviceModelId } from "@ledgerhq/device-management-kit";

export interface MockServerDeviceModel {
  readonly label: string;
  readonly name: string;
  /** Latest stable build published for the model in the coin-apps catalogue. */
  readonly defaultOsVersion: string;
  readonly mask: number;
}

export const MOCK_SERVER_DEVICE_MODELS: Record<DeviceModelId, MockServerDeviceModel> = {
  [DeviceModelId.NANO_S]: {
    label: "Nano S",
    name: "Ledger Nano S",
    defaultOsVersion: "2.1.0",
    mask: 0x31100000,
  },
  [DeviceModelId.NANO_SP]: {
    label: "Nano S Plus",
    name: "Ledger Nano S Plus",
    defaultOsVersion: "1.6.1",
    mask: 0x33100000,
  },
  [DeviceModelId.NANO_X]: {
    label: "Nano X",
    name: "Ledger Nano X",
    defaultOsVersion: "2.7.1",
    mask: 0x33000000,
  },
  [DeviceModelId.STAX]: {
    label: "Stax",
    name: "Ledger Stax",
    defaultOsVersion: "1.10.1",
    mask: 0x33200000,
  },
  [DeviceModelId.FLEX]: {
    label: "Flex",
    name: "Ledger Flex",
    defaultOsVersion: "1.6.1",
    mask: 0x33300000,
  },
  [DeviceModelId.APEX]: {
    label: "Apex",
    name: "Ledger Apex",
    defaultOsVersion: "1.1.1",
    mask: 0x33400000,
  },
};

export const MOCK_SERVER_DEVICE_MODEL_IDS = Object.keys(
  MOCK_SERVER_DEVICE_MODELS,
) as DeviceModelId[];

export type MockServerDeviceSelection = {
  readonly model: DeviceModelId;
  /** `false` starts the mock server's step-by-step onboarding simulation. */
  readonly onboarded: boolean;
  /** Set below the model's latest to leave an OS update available. */
  readonly osVersion: string;
};

export const defaultMockServerDeviceSelection = (
  model: DeviceModelId = DeviceModelId.STAX,
): MockServerDeviceSelection => ({
  model,
  onboarded: true,
  osVersion: MOCK_SERVER_DEVICE_MODELS[model].defaultOsVersion,
});

export const MOCK_SERVER_DEVICE_STORAGE_KEY = "MOCK_SERVER_DEVICE";

const isDeviceModelId = (value: unknown): value is DeviceModelId =>
  typeof value === "string" && value in MOCK_SERVER_DEVICE_MODELS;

export const readMockServerDevice = (): MockServerDeviceSelection | null => {
  const raw = window.localStorage.getItem(MOCK_SERVER_DEVICE_STORAGE_KEY);
  if (!raw) return null;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;

    const { model, onboarded, osVersion } = parsed as {
      model?: unknown;
      onboarded?: unknown;
      osVersion?: unknown;
    };
    if (!isDeviceModelId(model)) return null;

    return {
      model,
      onboarded: onboarded !== false,
      osVersion:
        typeof osVersion === "string" && osVersion.trim()
          ? osVersion.trim()
          : MOCK_SERVER_DEVICE_MODELS[model].defaultOsVersion,
    };
  } catch {
    return null;
  }
};

export const writeMockServerDevice = (selection: MockServerDeviceSelection): void => {
  window.localStorage.setItem(MOCK_SERVER_DEVICE_STORAGE_KEY, JSON.stringify(selection));
};

/**
 * Carries no APDU mock on purpose: the mock server derives the handshake and OS
 * APDUs from this metadata itself, and a mock pinned on one of those prefixes
 * freezes the reported device state.
 */
export const buildMockServerDeviceConfig = (
  selection: MockServerDeviceSelection,
): Record<string, unknown> => {
  const model = MOCK_SERVER_DEVICE_MODELS[selection.model];

  return {
    name: model.name,
    device_type: selection.model,
    connectivity_type: "USB",
    firmware_version: selection.osVersion,
    apps: [{ name: "BOLOS", version: selection.osVersion }],
    masks: [model.mask],
    onboarded: selection.onboarded,
  };
};

export const mockServerSessionImport = (): unknown => {
  const selection = readMockServerDevice();
  if (!selection) return getEnv("MOCK_SERVER_SESSION");

  return { devices: [buildMockServerDeviceConfig(selection)] };
};
