import { from } from "rxjs";
import calService, { convertCertificateToDeviceData } from "@ledgerhq/ledger-cal-service";
import { DmkSignerHyperliquid } from "@ledgerhq/live-signer-hyperliquid";
import { UserRefusedOnDevice } from "@ledgerhq/ledger-wallet-framework/errors";
import {
  handlers,
  type PerpsDepositParams,
  type PerpsDepositResult,
  type PerpsSignParams,
  type PerpsSignResult,
  type PerpsWithdrawParams,
  type PerpsWithdrawResult,
} from "./server";
import BigNumber from "bignumber.js";
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
  getAccountCurrency: jest.fn(
    (account: { type: string; currency?: { id: string }; token?: { id: string } }) =>
      account.type === "TokenAccount" ? account.token : account.currency,
  ),
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

const baseHyperCoreAccount = createFixtureAccount("hc");
const mockHyperCoreAccount = {
  ...baseHyperCoreAccount,
  id: "js:2:hypercore:0x0hc:",
  currency: { ...baseHyperCoreAccount.currency, id: "hypercore" },
};
const HYPERCORE_WALLET_ACCOUNT_ID = `wallet:${mockHyperCoreAccount.id}`;

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
    "custom.perps.deposit": (params?: PerpsDepositParams) => Promise<PerpsDepositResult>;
    "custom.perps.withdraw": (params?: unknown) => Promise<PerpsWithdrawResult>;
  };

  let mockSignActions: jest.Mock;
  let mockUiSigningExecute: jest.Mock;
  let mockUiDepositExecute: jest.Mock;
  let mockUiWithdrawExecute: jest.Mock;
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
    mockUiSigningExecute = jest
      .fn()
      .mockImplementation(async ({ signFactory, onSuccess, onError }) => {
        try {
          const result = await signFactory(mockDevice);
          onSuccess(result);
        } catch (err) {
          onError(err);
        }
      });

    mockUiDepositExecute = jest.fn();
    mockUiWithdrawExecute = jest.fn();

    serverHandlers = handlers({
      accounts: [mockAccount, mockHyperCoreAccount],
      uiHooks: {
        "signing.execute": mockUiSigningExecute,
        "deposit.execute": mockUiDepositExecute,
        "withdraw.execute": mockUiWithdrawExecute,
      },
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

  describe("custom.perps.deposit", () => {
    const depositParams: PerpsDepositParams = {
      receiverAccountId: WALLET_ACCOUNT_ID,
    };

    it("should call deposit.execute with the resolved receiver account", async () => {
      await serverHandlers["custom.perps.deposit"](depositParams);

      expect(mockUiDepositExecute).toHaveBeenCalledWith({ receiverAccount: mockAccount });
    });

    it("should resolve with the outcome the deposit flow settles with", async () => {
      mockUiDepositExecute.mockResolvedValue({ swapId: "swap-1" });

      const result = await serverHandlers["custom.perps.deposit"](depositParams);

      expect(result).toEqual({ swapId: "swap-1" });
    });

    it("should forward the client's rejection as is", async () => {
      const refusal = new UserRefusedOnDevice();
      mockUiDepositExecute.mockRejectedValue(refusal);
      jest.spyOn(console, "warn").mockImplementation(() => {});

      await expect(serverHandlers["custom.perps.deposit"](depositParams)).rejects.toBe(refusal);
    });

    it("should resolve immediately when the client hook does not report an outcome", async () => {
      mockUiDepositExecute.mockReturnValue(undefined);

      const result = await serverHandlers["custom.perps.deposit"](depositParams);

      expect(result).toEqual({});
    });

    it("should throw a ServerError when params are undefined", async () => {
      await expect(serverHandlers["custom.perps.deposit"]()).rejects.toThrow("ServerError");
      expect(mockUiDepositExecute).not.toHaveBeenCalled();
    });

    it("should throw a ServerError when the client does not implement the deposit hook", async () => {
      const handlersWithoutDeposit = handlers({
        accounts: [mockAccount],
        uiHooks: { "signing.execute": mockUiSigningExecute },
      }) as unknown as MockedHandlers;

      await expect(handlersWithoutDeposit["custom.perps.deposit"](depositParams)).rejects.toThrow(
        "ServerError",
      );
    });

    it("should throw a ServerError when the receiver account is not found", async () => {
      jest
        .mocked(getAccountIdFromWalletAccountId)
        .mockImplementation(id => (id === "wallet:unknown" ? "unknown-id" : ACCOUNT_ID));

      await expect(
        serverHandlers["custom.perps.deposit"]({ receiverAccountId: "wallet:unknown" }),
      ).rejects.toThrow("ServerError");
      expect(mockUiDepositExecute).not.toHaveBeenCalled();
    });
  });
  describe("custom.perps.withdraw", () => {
    const withdrawParams: PerpsWithdrawParams = {
      sourceAccountId: HYPERCORE_WALLET_ACCOUNT_ID,
      availableBalance: "1000.5",
    };

    beforeEach(() => {
      jest
        .mocked(getAccountIdFromWalletAccountId)
        .mockImplementation(id =>
          id === HYPERCORE_WALLET_ACCOUNT_ID ? mockHyperCoreAccount.id : ACCOUNT_ID,
        );
    });

    it("should call withdraw.execute with the source account and its available balance", async () => {
      await serverHandlers["custom.perps.withdraw"](withdrawParams);

      expect(mockUiWithdrawExecute).toHaveBeenCalledWith({
        sourceAccount: mockHyperCoreAccount,
        availableBalance: new BigNumber("1000.5"),
      });
    });

    it("should resolve with the outcome the withdraw flow settles with", async () => {
      mockUiWithdrawExecute.mockResolvedValue({ swapId: "swap-1", amountTo: "0.3" });

      const result = await serverHandlers["custom.perps.withdraw"](withdrawParams);

      expect(result).toEqual({ swapId: "swap-1", amountTo: "0.3" });
    });

    it("should resolve with an empty outcome when the client hook reports none", async () => {
      mockUiWithdrawExecute.mockReturnValue(undefined);

      await expect(serverHandlers["custom.perps.withdraw"](withdrawParams)).resolves.toEqual({});
    });

    it("should forward the client's rejection as is", async () => {
      const refusal = new UserRefusedOnDevice();
      mockUiWithdrawExecute.mockRejectedValue(refusal);
      jest.spyOn(console, "warn").mockImplementation(() => {});

      await expect(serverHandlers["custom.perps.withdraw"](withdrawParams)).rejects.toBe(refusal);
    });

    it.each([
      ["undefined params", undefined],
      ["a missing source account", { availableBalance: "10" }],
      ["a missing balance", { sourceAccountId: HYPERCORE_WALLET_ACCOUNT_ID }],
      ["a non numeric balance", { ...withdrawParams, availableBalance: "abc" }],
      ["a negative balance", { ...withdrawParams, availableBalance: "-1" }],
      ["a zero balance", { ...withdrawParams, availableBalance: "0" }],
      ["an infinite balance", { ...withdrawParams, availableBalance: "Infinity" }],
      ["a hex balance", { ...withdrawParams, availableBalance: "0x10" }],
      ["an exponent balance", { ...withdrawParams, availableBalance: "1e2" }],
      ["a padded balance", { ...withdrawParams, availableBalance: " 10" }],
    ])("should throw a ServerError for %s", async (_, params) => {
      await expect(serverHandlers["custom.perps.withdraw"](params)).rejects.toThrow("ServerError");
      expect(mockUiWithdrawExecute).not.toHaveBeenCalled();
    });

    it("should report the source account as not found when it is not in the wallet", async () => {
      jest
        .mocked(getAccountIdFromWalletAccountId)
        .mockImplementation(id => (id === "wallet:unknown" ? "unknown-id" : ACCOUNT_ID));

      await expect(
        serverHandlers["custom.perps.withdraw"]({
          ...withdrawParams,
          sourceAccountId: "wallet:unknown",
        }),
      ).rejects.toMatchObject({ error: { code: "AccountNotFound", id: "wallet:unknown" } });
      expect(mockUiWithdrawExecute).not.toHaveBeenCalled();
    });

    it("should throw a ServerError when the source is not a HyperCore account", async () => {
      await expect(
        serverHandlers["custom.perps.withdraw"]({
          ...withdrawParams,
          sourceAccountId: WALLET_ACCOUNT_ID,
        }),
      ).rejects.toThrow("ServerError");
      expect(mockUiWithdrawExecute).not.toHaveBeenCalled();
    });

    it("should report the method as not implemented when the client has no withdraw hook", async () => {
      const handlersWithoutWithdraw = handlers({
        accounts: [mockAccount, mockHyperCoreAccount],
        uiHooks: { "signing.execute": mockUiSigningExecute },
      }) as unknown as MockedHandlers;

      await expect(
        handlersWithoutWithdraw["custom.perps.withdraw"](withdrawParams),
      ).rejects.toMatchObject({
        error: expect.objectContaining({ code: "NOT_IMPLEMENTED_BY_WALLET" }),
      });
    });
  });
});
