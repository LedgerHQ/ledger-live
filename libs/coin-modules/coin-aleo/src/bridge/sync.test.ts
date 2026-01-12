import BigNumber from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { SyncConfig } from "@ledgerhq/types-live";
import { getBalance } from "../logic";
import { getMockedCurrency } from "../test/fixtures/currency.fixture";
import { getMockedAccount } from "../test/fixtures/account.fixture";
import { getAccountShape } from "./sync";

jest.mock("../logic");

const mockGetBalance = getBalance as jest.MockedFunction<typeof getBalance>;

describe("sync.ts", () => {
  const mockCurrency = getMockedCurrency();
  const mockAccount = getMockedAccount();
  const mockDerivationMode = "";
  const mockSyncConfig: SyncConfig = {
    paginationConfig: {},
  };
  const mockInitialAccount = {
    ...getMockedAccount(),
    aleoResources: {
      transparentBalance: new BigNumber(500000),
      privateBalance: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAccountShape", () => {
    it("should create account shape with native balance", async () => {
      mockGetBalance.mockResolvedValue([
        {
          asset: { type: "native" as const },
          value: BigInt(mockAccount.balance.toString()),
        },
      ]);

      const result = await getAccountShape(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: undefined,
        },
        mockSyncConfig,
      );

      const expectedAccountId = encodeAccountId({
        type: "js",
        version: "2",
        currencyId: mockCurrency.id,
        xpubOrAddress: mockAccount.freshAddress,
        derivationMode: mockDerivationMode,
      });

      expect(result).toMatchObject({
        type: "Account",
        id: expectedAccountId,
        balance: mockAccount.balance,
        spendableBalance: mockAccount.spendableBalance,
        blockHeight: 0,
        operations: [],
        operationsCount: 0,
        lastSyncDate: expect.any(Date),
        aleoResources: {
          transparentBalance: mockAccount.balance,
          privateBalance: null,
        },
      });
    });

    it("should handle empty balance array", async () => {
      mockGetBalance.mockResolvedValue([]);

      const result = await getAccountShape(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: undefined,
        },
        mockSyncConfig,
      );

      expect(result.balance).toEqual(new BigNumber(0));
      expect(result.spendableBalance).toEqual(new BigNumber(0));
      expect(result.aleoResources.transparentBalance).toEqual(new BigNumber(0));
    });

    it("should update balance when it changes", async () => {
      const mockUpdatedBalance = 10;
      mockGetBalance.mockResolvedValue([
        {
          asset: { type: "native" as const },
          value: BigInt(mockUpdatedBalance),
        },
      ]);

      const result = await getAccountShape(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: mockInitialAccount,
        },
        mockSyncConfig,
      );

      expect(result).toMatchObject({
        balance: new BigNumber(mockUpdatedBalance),
        aleoResources: {
          transparentBalance: new BigNumber(mockUpdatedBalance),
        },
      });
    });

    it("should preserve viewKey from initial account", async () => {
      mockGetBalance.mockResolvedValue([
        {
          asset: { type: "native" as const },
          value: BigInt(mockAccount.balance.toString()),
        },
      ]);

      const result = await getAccountShape(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: mockInitialAccount,
        },
        mockSyncConfig,
      );

      expect(result).toMatchObject({
        id: mockInitialAccount.id,
      });
    });

    it("should throw error if initial account has no viewKey", async () => {
      const mockInvalidInitialAccount = {
        ...mockInitialAccount,
        id: "js:2:aleo:aleo1zcwqycj02lccfuu57dzjhva7w5dpzc7pngl0sxjhp58t6vlnnqxs6lnp6f:",
      };

      await expect(
        getAccountShape(
          {
            index: mockAccount.index,
            derivationPath: mockAccount.freshAddressPath,
            address: mockAccount.freshAddress,
            currency: mockCurrency,
            derivationMode: mockDerivationMode,
            initialAccount: mockInvalidInitialAccount,
          },
          mockSyncConfig,
        ),
      ).rejects.toThrow(
        `aleo: viewKey is missing in initialAccount ${mockInvalidInitialAccount.id}`,
      );
    });

    it("should propagate errors", async () => {
      mockGetBalance.mockRejectedValue(new Error("Network timeout"));

      await expect(
        getAccountShape(
          {
            index: mockAccount.index,
            derivationPath: mockAccount.freshAddressPath,
            address: mockAccount.freshAddress,
            currency: mockCurrency,
            derivationMode: mockDerivationMode,
            initialAccount: undefined,
          },
          mockSyncConfig,
        ),
      ).rejects.toThrow("Network timeout");
    });
  });
});
