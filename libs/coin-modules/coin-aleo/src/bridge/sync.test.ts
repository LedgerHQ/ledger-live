import BigNumber from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { SyncConfig } from "@ledgerhq/types-live";
import { getBalance, lastBlock } from "../logic";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { AleoAccount } from "../types";
import { getAccountShape } from "./sync";

jest.mock("../logic");

const mockGetBalance = jest.mocked(getBalance);
const mockLastBlock = jest.mocked(lastBlock);

describe("sync.ts", () => {
  const mockCurrency = getMockedCurrency();
  const mockAccount = getMockedAccount();
  const mockDerivationMode = "";
  const mockSyncConfig: SyncConfig = {
    paginationConfig: {},
  };
  const mockInitialAccount: AleoAccount = {
    ...getMockedAccount(),
    aleoResources: {
      transparentBalance: new BigNumber(500000),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockGetBalance.mockResolvedValue([
      {
        asset: { type: "native" as const },
        value: BigInt(mockAccount.balance.toString()),
      },
    ]);

    mockLastBlock.mockResolvedValue({
      height: 100,
      hash: "mock-block-hash",
      time: new Date("2024-01-01"),
    });
  });

  describe("getAccountShape", () => {
    it("should create account shape with native balance", async () => {
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
        blockHeight: 100,
        operations: [],
        operationsCount: 0,
        lastSyncDate: expect.any(Date),
        aleoResources: {
          transparentBalance: mockAccount.balance,
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
