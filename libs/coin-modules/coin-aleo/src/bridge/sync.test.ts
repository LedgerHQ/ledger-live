import BigNumber from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { SyncConfig } from "@ledgerhq/types-live";
import { getBalance, lastBlock, listOperations } from "../logic";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedAccount, mockAleoResources } from "../__tests__/fixtures/account.fixture";
import { AleoAccount } from "../types";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { getMockedRecord } from "../__tests__/fixtures/api.fixture";
import { accessProvableApi } from "../network/utils";
import { apiClient } from "../network/api";
import { listPrivateOperations } from "../logic/listPrivateOperations";
import { getPrivateBalance } from "../logic/getPrivateBalance";
import { getAccountShape } from "./sync";

jest.mock("../logic");
jest.mock("../network/utils");
jest.mock("../network/api");
jest.mock("../logic/listPrivateOperations");
jest.mock("../logic/getPrivateBalance");

const mockGetBalance = jest.mocked(getBalance);
const mockLastBlock = jest.mocked(lastBlock);
const mockListOperations = jest.mocked(listOperations);
const mockAccessProvableApi = jest.mocked(accessProvableApi);
const mockGetAccountOwnedRecords = jest.mocked(apiClient.getAccountOwnedRecords);
const mockListPrivateOperations = jest.mocked(listPrivateOperations);
const mockGetPrivateBalance = jest.mocked(getPrivateBalance);

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
      provableApi: null,
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

    mockListOperations.mockResolvedValue({
      operations: [],
      nextCursor: null,
    });
    mockAccessProvableApi.mockResolvedValue(null);
    mockGetAccountOwnedRecords.mockResolvedValue([]);
    mockListPrivateOperations.mockResolvedValue([]);
    mockGetPrivateBalance.mockResolvedValue({ balance: new BigNumber(0), unspentRecords: [] });
  });

  describe("getAccountShape", () => {
    it("should preserve viewKey from initial account", async () => {
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

      expect(result).toMatchObject({ id: mockInitialAccount.id });
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
      ).rejects.toThrow();
    });

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
          provableApi: null,
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

      expect(mockListOperations).toHaveBeenCalledTimes(1);
      expect(mockListOperations).toHaveBeenCalledWith({
        currency: mockCurrency,
        address: mockAccount.freshAddress,
        ledgerAccountId: expect.any(String),
        mode: "bridge",
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

      expect(mockListOperations).toHaveBeenCalledTimes(1);
      expect(mockListOperations).toHaveBeenCalledWith({
        currency: mockCurrency,
        address: mockAccount.freshAddress,
        ledgerAccountId: mockInitialAccount.id,
        mode: "bridge",
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

  describe("accessProvableApi handling", () => {
    it("should not call accessProvableApi when there is no initialAccount", async () => {
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

      expect(mockAccessProvableApi).not.toHaveBeenCalled();
    });

    it("should call accessProvableApi with correct args from initialAccount", async () => {
      const accountWithProvableApi = getMockedAccount();

      await getAccountShape(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithProvableApi,
        },
        mockSyncConfig,
      );

      expect(mockAccessProvableApi).toHaveBeenCalledTimes(1);
      expect(mockAccessProvableApi).toHaveBeenCalledWith({
        currency: mockCurrency,
        viewKey: "AViewKey123",
        address: mockAccount.freshAddress,
        provableApi: accountWithProvableApi.aleoResources?.provableApi,
      });
    });

    it("should fall back to existing provableApi when accessProvableApi throws", async () => {
      const accountWithProvableApi = getMockedAccount();
      mockAccessProvableApi.mockRejectedValueOnce(new Error("Network failure"));

      const result = await getAccountShape(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithProvableApi,
        },
        mockSyncConfig,
      );

      expect(result.aleoResources?.provableApi).toEqual(
        accountWithProvableApi.aleoResources?.provableApi,
      );
    });

    it("should store the updated provableApi returned by accessProvableApi in aleoResources", async () => {
      const updatedProvableApi = {
        ...mockAleoResources.provableApi,
        scannerStatus: { synced: true, percentage: 100 },
      };
      mockAccessProvableApi.mockResolvedValueOnce(updatedProvableApi);

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

      expect(result.aleoResources?.provableApi).toEqual(updatedProvableApi);
    });
  });

  describe("private sync path", () => {
    const configuredProvableApi = mockAleoResources.provableApi!;

    it("should skip private sync when there is no initialAccount", async () => {
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

      expect(mockGetAccountOwnedRecords).not.toHaveBeenCalled();
      expect(mockListPrivateOperations).not.toHaveBeenCalled();
      expect(mockGetPrivateBalance).not.toHaveBeenCalled();
    });

    it("should skip private sync when accessProvableApi returns null", async () => {
      // mockAccessProvableApi returns null by default
      await getAccountShape(
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

      expect(mockGetAccountOwnedRecords).not.toHaveBeenCalled();
      expect(mockListPrivateOperations).not.toHaveBeenCalled();
      expect(mockGetPrivateBalance).not.toHaveBeenCalled();
    });

    it("should run private sync and call all private APIs when provableApi is configured", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      const mockPrivateRecords = [getMockedRecord()];
      const mockUnspentRecords = [getMockedRecord({ record_ciphertext: "unspent_cipher" })];
      const mockPrivateOps = [
        getMockedOperation({
          extra: { transactionType: "private", functionId: "transfer_private" },
        }),
      ];
      const mockUnspentResult = [
        {
          ...getMockedRecord(),
          microcredits: "50000",
          decryptedData: { owner: "", data: {}, nonce: "", version: 0 },
        },
      ];

      mockGetAccountOwnedRecords
        .mockResolvedValueOnce(mockPrivateRecords)
        .mockResolvedValueOnce(mockUnspentRecords);
      mockListPrivateOperations.mockResolvedValueOnce(mockPrivateOps);
      mockGetPrivateBalance.mockResolvedValueOnce({
        balance: new BigNumber(50000),
        unspentRecords: mockUnspentResult,
      });

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

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(2);
      expect(mockGetAccountOwnedRecords).toHaveBeenCalledWith({
        currency: mockCurrency,
        jwtToken: configuredProvableApi.jwt!.token,
        uuid: configuredProvableApi.uuid,
        apiKey: configuredProvableApi.apiKey,
        start: 0,
      });
      expect(mockGetAccountOwnedRecords).toHaveBeenCalledWith({
        currency: mockCurrency,
        jwtToken: configuredProvableApi.jwt!.token,
        uuid: configuredProvableApi.uuid,
        apiKey: configuredProvableApi.apiKey,
        unspent: true,
      });
      expect(mockListPrivateOperations).toHaveBeenCalledTimes(1);
      expect(mockListPrivateOperations).toHaveBeenCalledWith({
        currency: mockCurrency,
        viewKey: "AViewKey123",
        address: mockAccount.freshAddress,
        ledgerAccountId: expect.any(String),
        privateRecords: mockPrivateRecords,
      });
      expect(mockGetPrivateBalance).toHaveBeenCalledTimes(1);
      expect(mockGetPrivateBalance).toHaveBeenCalledWith({
        currency: mockCurrency,
        viewKey: "AViewKey123",
        privateRecords: mockUnspentRecords,
      });
      expect(result.aleoResources?.privateBalance).toEqual(new BigNumber(50000));
      expect(result.aleoResources?.unspentPrivateRecords).toEqual(mockUnspentResult);
      expect(result.aleoResources?.lastPrivateSyncDate).toBeInstanceOf(Date);
    });

    it("should use latest private operation blockHeight as start cursor for getAccountOwnedRecords", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      const privateOp = getMockedOperation({
        blockHeight: 9999,
        extra: { transactionType: "private", functionId: "transfer_private" },
      });
      const accountWithPrivateOps = { ...mockInitialAccount, operations: [privateOp] };

      await getAccountShape(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithPrivateOps,
        },
        mockSyncConfig,
      );

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledWith(
        expect.objectContaining({ start: 9999 }),
      );
    });

    it("should use public operation blockHeight for listOperations cursor, not the private op height", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      const privateOp = getMockedOperation({
        blockHeight: 9999,
        extra: { transactionType: "private", functionId: "transfer_private" },
      });
      const publicOp = getMockedOperation({
        blockHeight: 500,
        extra: { transactionType: "public", functionId: "transfer_public" },
      });
      const accountWithMixedOps = { ...mockInitialAccount, operations: [privateOp, publicOp] };

      await getAccountShape(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithMixedOps,
        },
        mockSyncConfig,
      );

      expect(mockListOperations).toHaveBeenCalledWith(
        expect.objectContaining({
          pagination: expect.objectContaining({ lastPagingToken: "500" }),
        }),
      );
    });

    it("should compute totalBalance as transparentBalance plus privateBalance", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      mockGetBalance.mockResolvedValue([
        { asset: { type: "native" as const }, value: BigInt(1000000) },
      ]);
      mockGetPrivateBalance.mockResolvedValueOnce({
        balance: new BigNumber(500000),
        unspentRecords: [],
      });

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

      expect(result.balance).toEqual(new BigNumber(1500000));
      expect(result.spendableBalance).toEqual(new BigNumber(1500000));
    });

    it("should merge public and private operations in result sorted by date descending", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      const oldPublicOp = getMockedOperation({
        id: "pub_old",
        date: new Date("2023-01-01"),
        blockHeight: 100,
      });
      const newPublicOp = getMockedOperation({
        id: "pub_new",
        date: new Date("2024-01-01"),
        blockHeight: 200,
      });
      const newPrivateOp = getMockedOperation({
        id: "priv_new",
        date: new Date("2024-06-01"),
        blockHeight: 300,
        extra: { transactionType: "private", functionId: "transfer_private" },
      });

      const accountWithOps = { ...mockInitialAccount, operations: [oldPublicOp] };
      mockListOperations.mockResolvedValueOnce({ operations: [newPublicOp], nextCursor: null });
      mockListPrivateOperations.mockResolvedValueOnce([newPrivateOp]);

      const result = await getAccountShape(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithOps,
        },
        mockSyncConfig,
      );

      expect(result.operationsCount).toBe(3);
      expect(result.operations).toEqual([
        expect.objectContaining({ id: "priv_new" }),
        expect.objectContaining({ id: "pub_new" }),
        expect.objectContaining({ id: "pub_old" }),
      ]);
    });

    it("should set lastPrivateSyncDate to null when private sync does not run", async () => {
      // provableApi is null by default — private sync skipped
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

      expect(result.aleoResources?.lastPrivateSyncDate).toBeNull();
    });
  });
});
