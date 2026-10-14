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
} from "./server";
import type { PerpsMigrationParams, PerpsMigrationResult } from "./migration";
import { getMainAccount, getParentAccount } from "../../account";
import { withDevice } from "../../hw/deviceAccess";
import { isDmkTransport } from "../../hw/dmkUtils";
import { getAccountIdFromWalletAccountId } from "../converters";
import type { Account } from "@ledgerhq/types-live";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
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
  getWalletApiIdFromAccountId: jest.fn((id: string) => `wallet:${id}`),
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
    "custom.perps.migrateAccount": (params?: PerpsMigrationParams) => Promise<PerpsMigrationResult>;
  };

  let mockSignActions: jest.Mock;
  let mockUiSigningExecute: jest.Mock;
  let mockUiDepositExecute: jest.Mock;
  let mockUiMigrationExecute: jest.Mock;
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
    mockUiMigrationExecute = jest.fn();

    serverHandlers = handlers({
      accounts: [mockAccount],
      uiHooks: {
        "signing.execute": mockUiSigningExecute,
        "deposit.execute": mockUiDepositExecute,
        "migration.execute": mockUiMigrationExecute,
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

  describe("custom.perps.migrateAccount", () => {
    const hypercoreCurrency = getCryptoCurrencyById("hypercore");
    const legacyAccount = createFixtureAccount("legacy", getCryptoCurrencyById("arbitrum"));
    const newAccount = {
      ...createFixtureAccount("hc-new", hypercoreCurrency),
      freshAddress: legacyAccount.freshAddress,
      index: legacyAccount.index,
    };
    const otherNewAccount = {
      ...createFixtureAccount("hc-other", hypercoreCurrency),
      freshAddress: "0x02",
      index: 1,
    };
    const migrationParams: PerpsMigrationParams = { legacyAccountId: `wallet:${legacyAccount.id}` };

    const buildHandlers = (accounts: Account[]) => {
      jest
        .mocked(getAccountIdFromWalletAccountId)
        .mockImplementation(id => id.replace("wallet:", ""));
      return handlers({
        accounts,
        uiHooks: {
          "signing.execute": mockUiSigningExecute,
          "migration.execute": mockUiMigrationExecute,
        },
      }) as unknown as MockedHandlers;
    };

    it("runs the discovery flow with the legacy account as context", async () => {
      mockUiMigrationExecute.mockResolvedValue([newAccount]);
      const migrationHandlers = buildHandlers([legacyAccount]);

      await migrationHandlers["custom.perps.migrateAccount"](migrationParams);

      expect(mockUiMigrationExecute).toHaveBeenCalledWith({ legacyAccount, existingAccounts: [] });
    });

    it("reports accounts added by the flow as created", async () => {
      mockUiMigrationExecute.mockResolvedValue([newAccount]);
      const migrationHandlers = buildHandlers([legacyAccount]);

      const result = await migrationHandlers["custom.perps.migrateAccount"](migrationParams);

      expect(result).toEqual({
        accounts: [{ accountId: `wallet:${newAccount.id}`, created: true }],
      });
    });

    it("hands the Hyperliquid accounts already in the wallet to the flow", async () => {
      mockUiMigrationExecute.mockResolvedValue([newAccount]);
      const migrationHandlers = buildHandlers([legacyAccount, newAccount]);

      await migrationHandlers["custom.perps.migrateAccount"](migrationParams);

      expect(mockUiMigrationExecute).toHaveBeenCalledWith({
        legacyAccount,
        existingAccounts: [newAccount],
      });
    });

    it("reports an account that was already in the wallet as not created", async () => {
      mockUiMigrationExecute.mockResolvedValue([newAccount]);
      const migrationHandlers = buildHandlers([legacyAccount, newAccount]);

      const result = await migrationHandlers["custom.perps.migrateAccount"](migrationParams);

      expect(result).toEqual({
        accounts: [{ accountId: `wallet:${newAccount.id}`, created: false }],
      });
    });

    it("reports a known account rescanned under another id as not created", async () => {
      const rescanned = { ...newAccount, id: "js:2:hypercore:rescanned:" };
      mockUiMigrationExecute.mockResolvedValue([rescanned]);
      const migrationHandlers = buildHandlers([legacyAccount, newAccount]);

      const result = await migrationHandlers["custom.perps.migrateAccount"](migrationParams);

      expect(result).toEqual({
        accounts: [{ accountId: `wallet:${rescanned.id}`, created: false }],
      });
    });

    it("returns every account the user selected", async () => {
      mockUiMigrationExecute.mockResolvedValue([newAccount, otherNewAccount]);
      const migrationHandlers = buildHandlers([legacyAccount]);

      const result = await migrationHandlers["custom.perps.migrateAccount"](migrationParams);

      expect(result.accounts.map(({ accountId }) => accountId)).toEqual([
        `wallet:${newAccount.id}`,
        `wallet:${otherNewAccount.id}`,
      ]);
    });

    it("forwards a cancellation as is", async () => {
      const refusal = new UserRefusedOnDevice();
      mockUiMigrationExecute.mockRejectedValue(refusal);
      jest.spyOn(console, "warn").mockImplementation(() => {});
      const migrationHandlers = buildHandlers([legacyAccount]);

      await expect(migrationHandlers["custom.perps.migrateAccount"](migrationParams)).rejects.toBe(
        refusal,
      );
    });

    it("forwards a discovery failure as is", async () => {
      const failure = new Error("discovery failed");
      mockUiMigrationExecute.mockRejectedValue(failure);
      jest.spyOn(console, "warn").mockImplementation(() => {});
      const migrationHandlers = buildHandlers([legacyAccount]);

      await expect(migrationHandlers["custom.perps.migrateAccount"](migrationParams)).rejects.toBe(
        failure,
      );
    });

    it("can be retried from the start after a device disconnection", async () => {
      mockUiMigrationExecute
        .mockRejectedValueOnce(new Error("device disconnected"))
        .mockResolvedValueOnce([newAccount]);
      jest.spyOn(console, "warn").mockImplementation(() => {});
      const migrationHandlers = buildHandlers([legacyAccount]);

      await expect(
        migrationHandlers["custom.perps.migrateAccount"](migrationParams),
      ).rejects.toThrow("device disconnected");
      const result = await migrationHandlers["custom.perps.migrateAccount"](migrationParams);

      expect(result.accounts).toHaveLength(1);
      expect(mockUiMigrationExecute).toHaveBeenCalledTimes(2);
    });

    it("throws a ServerError when params are undefined", async () => {
      const migrationHandlers = buildHandlers([legacyAccount]);

      await expect(migrationHandlers["custom.perps.migrateAccount"]()).rejects.toThrow(
        "ServerError",
      );
      expect(mockUiMigrationExecute).not.toHaveBeenCalled();
    });

    it("throws a ServerError when the client does not implement the migration hook", async () => {
      const handlersWithoutMigration = handlers({
        accounts: [legacyAccount],
        uiHooks: { "signing.execute": mockUiSigningExecute },
      }) as unknown as MockedHandlers;

      await expect(
        handlersWithoutMigration["custom.perps.migrateAccount"](migrationParams),
      ).rejects.toThrow("ServerError");
    });

    it("throws a ServerError when the legacy account is not on Arbitrum", async () => {
      const ethereumAccount = createFixtureAccount("legacy-eth", getCryptoCurrencyById("ethereum"));
      const migrationHandlers = buildHandlers([ethereumAccount]);

      await expect(
        migrationHandlers["custom.perps.migrateAccount"]({
          legacyAccountId: `wallet:${ethereumAccount.id}`,
        }),
      ).rejects.toThrow("ServerError");
      expect(mockUiMigrationExecute).not.toHaveBeenCalled();
    });

    it("throws a ServerError when the legacy account is not found", async () => {
      const migrationHandlers = buildHandlers([]);

      await expect(
        migrationHandlers["custom.perps.migrateAccount"](migrationParams),
      ).rejects.toThrow("ServerError");
      expect(mockUiMigrationExecute).not.toHaveBeenCalled();
    });
  });
});
