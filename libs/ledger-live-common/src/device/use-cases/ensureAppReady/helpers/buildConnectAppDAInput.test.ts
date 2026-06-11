import { DeviceModelId } from "@ledgerhq/device-management-kit";
import { DmkCompatTransport } from "@ledgerhq/live-dmk-shared";
import { getCryptoCurrencyById } from "../../../../currencies";
import getAddress from "../../../../hw/getAddress";
import type { EnsureAppReadyInput } from "../types";
import { buildConnectAppDeviceActionInput } from "./buildConnectAppDAInput";

jest.mock("@ledgerhq/live-dmk-shared", () => ({
  DmkCompatTransport: jest.fn().mockImplementation(function (this: any, dmk, sessionId) {
    this.dmk = dmk;
    this.sessionId = sessionId;
  }),
}));

jest.mock("../../../../currencies", () => ({
  getCryptoCurrencyById: jest.fn((id: string) => ({ id })),
}));

jest.mock("../../../../hw/getAddress", () => ({
  __esModule: true,
  default: jest.fn().mockResolvedValue({
    address: "0xderived",
  }),
}));

const mockDmkCompatTransport = jest.mocked(DmkCompatTransport);
const mockGetDeprecationConfig = jest.fn();
const mockGetMinVersion = jest.fn();
const mockGetCryptoCurrencyById = jest.mocked(getCryptoCurrencyById);
const mockGetAddress = jest.mocked(getAddress);

function makeInput(overrides: Partial<EnsureAppReadyInput> = {}): EnsureAppReadyInput {
  return {
    appName: "Ethereum",
    dependencies: ["1inch"],
    requireLatestFirmware: false,
    allowPartialDependencies: false,
    ...overrides,
  };
}

function makeDmk() {
  return {
    _unsafeBypassIntentQueue: jest.fn(),
  } as any;
}

describe("buildConnectAppDeviceActionInput", () => {
  afterEach(() => {
    jest.clearAllMocks();
    mockGetMinVersion.mockReturnValue(undefined);
    mockGetDeprecationConfig.mockReturnValue(undefined);
    mockGetAddress.mockResolvedValue({ address: "0xderived" } as any);
    mockGetCryptoCurrencyById.mockImplementation((id: string) => ({ id }) as any);
  });

  it("builds application, dependency and firmware requirements", () => {
    // GIVEN
    const dmk = makeDmk();
    mockGetMinVersion.mockImplementation((appName, model) => {
      if (appName === "Ethereum" && model === DeviceModelId.NANO_X) return "1.2.3";
      if (appName === "1inch" && model === DeviceModelId.NANO_S) return "4.5.6";
      return undefined;
    });
    mockGetDeprecationConfig.mockReturnValue([{ deviceModelId: "nanoS" }] as any);

    // WHEN
    const result = buildConnectAppDeviceActionInput({
      dmk,
      sessionId: "session-1",
      ensureAppReadyInput: makeInput({
        requireLatestFirmware: true,
        allowPartialDependencies: true,
      }),
      getDeprecationConfig: mockGetDeprecationConfig,
      getMinVersion: mockGetMinVersion,
      unlockTimeout: 0,
    });

    // THEN
    expect(result).toMatchObject({
      application: {
        name: "Ethereum",
        constraints: [
          {
            minVersion: "1.2.3",
            applicableModels: [DeviceModelId.NANO_X],
          },
        ],
      },
      dependencies: [
        {
          name: "1inch",
          constraints: [
            {
              minVersion: "4.5.6",
              applicableModels: [DeviceModelId.NANO_S],
            },
          ],
        },
      ],
      requireLatestFirmware: true,
      allowMissingApplication: true,
      unlockTimeout: 0,
      deprecationConfig: [{ deviceModelId: "nanoS" }],
    });
    expect(result.requiredDerivation).toBeUndefined();
    expect(mockGetDeprecationConfig).toHaveBeenCalledWith("Ethereum", ["1inch"]);
  });

  it("builds a required derivation callback when derivation is requested", async () => {
    // GIVEN
    const dmk = makeDmk();
    const result = buildConnectAppDeviceActionInput({
      dmk,
      sessionId: "session-1",
      ensureAppReadyInput: makeInput({
        requiresDerivation: {
          currencyId: "ethereum",
          derivationMode: "ethM" as any,
          path: "44'/60'/0'/0/0",
          forceFormat: "eip55",
        },
      }),
      getDeprecationConfig: mockGetDeprecationConfig,
      getMinVersion: mockGetMinVersion,
      unlockTimeout: 0,
    });

    // WHEN / THEN
    await expect(result.requiredDerivation?.()).resolves.toBe("0xderived");
    expect(mockDmkCompatTransport).toHaveBeenCalledWith(dmk, "session-1");
    expect(dmk._unsafeBypassIntentQueue).toHaveBeenNthCalledWith(1, {
      bypass: true,
      sessionId: "session-1",
    });
    expect(dmk._unsafeBypassIntentQueue).toHaveBeenNthCalledWith(2, {
      bypass: false,
      sessionId: "session-1",
    });
    expect(mockGetCryptoCurrencyById).toHaveBeenCalledWith("ethereum");
    expect(mockGetAddress).toHaveBeenCalledWith(expect.anything(), {
      currency: { id: "ethereum" },
      derivationMode: "ethM",
      path: "44'/60'/0'/0/0",
      forceFormat: "eip55",
    });
  });

  it("restores the DMK intent queue bypass when derivation fails", async () => {
    // GIVEN
    const dmk = makeDmk();
    const error = new Error("derivation failed");
    mockGetAddress.mockRejectedValue(error);
    const result = buildConnectAppDeviceActionInput({
      dmk,
      sessionId: "session-1",
      ensureAppReadyInput: makeInput({
        requiresDerivation: {
          currencyId: "ethereum",
          derivationMode: "ethM" as any,
          path: "44'/60'/0'/0/0",
        },
      }),
      getDeprecationConfig: mockGetDeprecationConfig,
      getMinVersion: mockGetMinVersion,
      unlockTimeout: 0,
    });

    // WHEN / THEN
    await expect(result.requiredDerivation?.()).rejects.toBe(error);
    expect(dmk._unsafeBypassIntentQueue).toHaveBeenNthCalledWith(1, {
      bypass: true,
      sessionId: "session-1",
    });
    expect(dmk._unsafeBypassIntentQueue).toHaveBeenNthCalledWith(2, {
      bypass: false,
      sessionId: "session-1",
    });
  });
});
