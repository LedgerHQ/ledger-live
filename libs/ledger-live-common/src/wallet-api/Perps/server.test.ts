import { from } from "rxjs";
import calService, { convertCertificateToDeviceData } from "@ledgerhq/ledger-cal-service";
import { DmkSignerHyperliquid } from "@ledgerhq/live-signer-hyperliquid";
import { handlers, type PerpsSignParams, type PerpsSignResult } from "./server";
import { getMainAccount, getParentAccount } from "../../account";
import { withDevice } from "../../hw/deviceAccess";
import { isDmkTransport } from "../../hw/dmkUtils";
import { getAccountIdFromWalletAccountId } from "../converters";
import { createFixtureAccount } from "../../mock/fixtures/cryptoCurrencies";

jest.mock("@ledgerhq/wallet-api-server", () => ({
  customWrapper: jest.fn(handler => handler),
}));

jest.mock("@ledgerhq/wallet-api-core", () => ({
  ...jest.requireActual("@ledgerhq/wallet-api-core"),
  createAccountNotFound: jest.fn(id => ({ code: "AccountNotFound", id })),
  createUnknownError: jest.fn(opts => ({ code: "UnknownError", ...opts })),
  ServerError: class ServerError extends Error {
    constructor(public error: unknown) {
      super("ServerError");
    }
  },
}));

jest.mock("@ledgerhq/ledger-cal-service", () => ({
  __esModule: true,
  default: { getCertificate: jest.fn() },
  convertCertificateToDeviceData: jest.fn(),
}));

jest.mock("@ledgerhq/live-signer-hyperliquid", () => ({
  DmkSignerHyperliquid: jest.fn(),
}));

jest.mock("../converters", () => ({
  getAccountIdFromWalletAccountId: jest.fn(),
}));

jest.mock("../../account", () => ({
  getMainAccount: jest.fn(),
  getParentAccount: jest.fn(),
}));

jest.mock("../../hw/deviceAccess", () => ({
  withDevice: jest.fn(),
}));

jest.mock("../../hw/dmkUtils", () => ({
  isDmkTransport: jest.fn(),
}));

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockAccount = createFixtureAccount("abcd");
const ACCOUNT_ID = mockAccount.id;
const WALLET_ACCOUNT_ID = `wallet:${ACCOUNT_ID}`;
const DERIVATION_PATH = mockAccount.freshAddressPath;
const DEVICE_ID = "mock-device-id";

const mockCertificate = { descriptor: "aabbcc", signature: "ddeeff" };
const mockDeviceData = new Uint8Array([0xaa, 0xbb, 0xcc, 0x15, 0x03, 0xdd, 0xee, 0xff]);

const mockDevice = { modelId: "stax", deviceId: DEVICE_ID, deviceName: undefined };

const baseParams = {
  accountId: WALLET_ACCOUNT_ID,
  metadataWithSignature: "0102030405",
  actions: [{ action: { type: "cancel" as const, cancels: [{ a: 1, o: 42 }] }, nonce: 1 }],
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("Perps handlers", () => {
  type MockedHandlers = {
    "custom.perps.signActions": (params?: PerpsSignParams) => Promise<PerpsSignResult>;
  };

  let mockSignActions: jest.Mock;
  let mockUiSigningExecute: jest.Mock;
  let serverHandlers: MockedHandlers;

  beforeEach(() => {
    jest.clearAllMocks();

    // Converters
    jest.mocked(getAccountIdFromWalletAccountId).mockReturnValue(ACCOUNT_ID);

    // Coin-framework
    jest.mocked(getParentAccount).mockReturnValue(mockAccount);
    jest.mocked(getMainAccount).mockReturnValue(mockAccount as never);

    // CAL service
    jest.mocked(calService.getCertificate).mockResolvedValue(mockCertificate);
    jest.mocked(convertCertificateToDeviceData).mockReturnValue(mockDeviceData);

    // DMK signer
    mockSignActions = jest.fn();
    jest
      .mocked(DmkSignerHyperliquid)
      .mockImplementation(() => ({ signActions: mockSignActions }) as never);

    // deviceAccess + dmkUtils
    jest.mocked(isDmkTransport).mockReturnValue(true);
    jest
      .mocked(withDevice)
      .mockReturnValue(job => from(job({ dmk: {}, sessionId: "session-1" } as never)));

    // UI hook — simulates the modal calling signFactory(device) then onSuccess/onError
    mockUiSigningExecute = jest.fn().mockImplementation(async ({ signFactory, onSuccess, onError }) => {
      try {
        const result = await signFactory(mockDevice);
        onSuccess(result);
      } catch (err) {
        onError(err);
      }
    });

    serverHandlers = handlers({
      accounts: [mockAccount],
      uiHooks: { "signing.execute": mockUiSigningExecute },
    }) as unknown as MockedHandlers;
  });

  describe("custom.perps.signActions", () => {
    it("should return signatures on success", async () => {
      // GIVEN
      const expectedSignatures = [{ r: "0xr", s: "0xs", v: 27 }];
      mockSignActions.mockResolvedValue(expectedSignatures);

      // WHEN
      const result = await serverHandlers["custom.perps.signActions"](baseParams);

      // THEN
      expect(result).toEqual({ signatures: expectedSignatures });
    });

    it("should call calService.getCertificate with the device modelId", async () => {
      // GIVEN
      mockSignActions.mockResolvedValue([]);

      // WHEN
      await serverHandlers["custom.perps.signActions"](baseParams);

      // THEN
      expect(calService.getCertificate).toHaveBeenCalledWith(mockDevice.modelId, "perps_data");
    });

    it("should call signActions with the correct parameters", async () => {
      // GIVEN
      mockSignActions.mockResolvedValue([]);

      // WHEN
      await serverHandlers["custom.perps.signActions"](baseParams);

      // THEN
      expect(mockSignActions).toHaveBeenCalledWith(
        DERIVATION_PATH,
        mockDeviceData,
        new Uint8Array(Buffer.from(baseParams.metadataWithSignature, "hex")),
        [{ type: "cancel", cancels: [{ a: 1, o: 42 }], nonce: 1 }],
      );
    });

    it("should throw a ServerError when params is undefined", async () => {
      // WHEN & THEN
      await expect(serverHandlers["custom.perps.signActions"](undefined)).rejects.toThrow(
        "ServerError",
      );
    });

    it("should throw a ServerError when account is not found", async () => {
      // GIVEN
      jest.mocked(getAccountIdFromWalletAccountId).mockReturnValue("unknown-id");

      // WHEN & THEN
      await expect(serverHandlers["custom.perps.signActions"](baseParams)).rejects.toThrow(
        "ServerError",
      );
    });

    it("should throw a ServerError when the derivation path is missing", async () => {
      // GIVEN
      jest
        .mocked(getMainAccount)
        .mockReturnValue({ ...mockAccount, freshAddressPath: "" } as never);

      // WHEN & THEN
      await expect(serverHandlers["custom.perps.signActions"](baseParams)).rejects.toThrow(
        "ServerError",
      );
    });

    it("should reject when the user cancels signing", async () => {
      // GIVEN
      mockUiSigningExecute.mockImplementation(({ onCancel }) => onCancel());

      // WHEN & THEN
      await expect(serverHandlers["custom.perps.signActions"](baseParams)).rejects.toThrow(
        "User cancelled signing",
      );
    });

    it("should throw when the transport is not a DMK transport", async () => {
      // GIVEN
      jest.mocked(isDmkTransport).mockReturnValue(false);

      // WHEN & THEN
      await expect(serverHandlers["custom.perps.signActions"](baseParams)).rejects.toThrow(
        "Not DMK transport",
      );
    });
  });
});
