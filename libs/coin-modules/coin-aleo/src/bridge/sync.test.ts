import BigNumber from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { SyncConfig } from "@ledgerhq/types-live";
import { getBalance, lastBlock, listOperations } from "../logic";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedAccount } from "../__tests__/fixtures/account.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { accessProvableApi } from "../logic/accessProvableApi";
import { getAccountShape } from "./sync";

jest.mock("../logic");
jest.mock("../logic/accessProvableApi");

const mockGetBalance = getBalance as jest.MockedFunction<typeof getBalance>;
const mockLastBlock = lastBlock as jest.MockedFunction<typeof lastBlock>;
const mockListOperations = listOperations as jest.MockedFunction<typeof listOperations>;
const mockAccessProvableApi = accessProvableApi as jest.MockedFunction<typeof accessProvableApi>;

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
      provableApi: null,
      lastPrivateSyncDate: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockLastBlock.mockResolvedValue({ height: 100, hash: "mock", time: new Date() });
    mockListOperations.mockResolvedValue({ operations: [], nextCursor: null });
    mockGetBalance.mockResolvedValue([
      {
        asset: { type: "native" as const },
        value: BigInt(mockAccount.balance.toString()),
      },
    ]);
    mockAccessProvableApi.mockResolvedValue(null);
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
      expect(result.aleoResources?.transparentBalance).toEqual(new BigNumber(0));
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

    it("should pass correct pagination parameters when syncing from scratch", async () => {
      await getAccountShape(
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

      expect(mockListOperations).toHaveBeenCalledWith({
        currency: mockCurrency,
        address: mockAccount.freshAddress,
        ledgerAccountId: expect.any(String),
        fetchAllPages: true,
        pagination: {
          minHeight: 0,
          order: "asc",
        },
      });
    });

    it("should pass lastPagingToken from latest operation block height when resuming sync", async () => {
      const mockOperation = getMockedOperation({
        blockHeight: 12345,
        accountId: mockInitialAccount.id,
      });

      const accountWithOperations = {
        ...mockInitialAccount,
        operations: [mockOperation],
      };

      await getAccountShape(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithOperations,
        },
        mockSyncConfig,
      );

      expect(mockListOperations).toHaveBeenCalledWith({
        currency: mockCurrency,
        address: mockAccount.freshAddress,
        ledgerAccountId: mockInitialAccount.id,
        fetchAllPages: true,
        pagination: {
          minHeight: 0,
          order: "asc",
          lastPagingToken: mockOperation.blockHeight?.toString(),
        },
      });
    });

    it("should correctly merge new operations with existing operations", async () => {
      const oldOperation = getMockedOperation({
        id: "op1",
        hash: "hash1",
        type: "OUT",
        blockHeight: 100,
        accountId: mockInitialAccount.id,
        senders: [mockAccount.freshAddress],
        date: new Date("2023-01-02"),
      });

      const newOperation = getMockedOperation({
        id: "op2",
        hash: "hash2",
        type: "IN",
        value: new BigNumber(200),
        blockHeight: 200,
        accountId: mockInitialAccount.id,
        senders: ["aleo1sender"],
        recipients: [mockAccount.freshAddress],
        date: new Date("2024-01-02"),
      });

      const accountWithOperations = {
        ...mockInitialAccount,
        operations: [oldOperation],
      };

      mockGetBalance.mockResolvedValue([
        {
          asset: { type: "native" as const },
          value: BigInt(1000),
        },
      ]);

      mockListOperations.mockResolvedValue({
        operations: [newOperation],
        nextCursor: null,
      });

      const result = await getAccountShape(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithOperations,
        },
        mockSyncConfig,
      );

      expect(result.operationsCount).toBe(2);
      expect(result.operations).toEqual([
        expect.objectContaining({ id: "op2", blockHeight: 200 }),
        expect.objectContaining({ id: "op1", blockHeight: 100 }),
      ]);
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
