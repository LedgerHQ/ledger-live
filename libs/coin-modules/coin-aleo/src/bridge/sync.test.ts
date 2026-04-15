import BigNumber from "bignumber.js";
import { encodeAccountId } from "@ledgerhq/ledger-wallet-framework/account/accountId";
import { SyncConfig, DerivationMode } from "@ledgerhq/types-live";
import { firstValueFrom, toArray, type Observable } from "rxjs";
import { SYNC_TYPE_TRANSPARENT, SYNC_TYPE_SHIELDED } from "@ledgerhq/types-live";
import { getBalance, lastBlock, listOperations } from "../logic";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { getMockedAccount, mockAleoResources } from "../__tests__/fixtures/account.fixture";
import { AleoAccount } from "../types";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { getMockedRecord } from "../__tests__/fixtures/api.fixture";
import { accessProvableApi, fetchAllOwnedRecords, patchPublicOperations } from "../network/utils";
import { listPrivateOperations } from "../logic/listPrivateOperations";
import { getPrivateBalance } from "../logic/getPrivateBalance";
import {
  performPublicSync,
  performPrivateSync,
  createPrivateSyncObservable,
  createPublicSyncObservable,
  postSync,
} from "./sync";
import { buildSyncObservables, makeGetAccountShape } from "./sync";

jest.mock("../logic");
jest.mock("../network/utils");
jest.mock("../network/api");
jest.mock("../logic/listPrivateOperations");
jest.mock("../logic/getPrivateBalance");

const mockGetBalance = jest.mocked(getBalance);
const mockLastBlock = jest.mocked(lastBlock);
const mockListOperations = jest.mocked(listOperations);
const mockAccessProvableApi = jest.mocked(accessProvableApi);
const mockFetchAllOwnedRecords = jest.mocked(fetchAllOwnedRecords);
const mockListPrivateOperations = jest.mocked(listPrivateOperations);
const mockGetPrivateBalance = jest.mocked(getPrivateBalance);
const mockPatchPublicOperations = jest.mocked(patchPublicOperations);

describe("sync.ts", () => {
  const mockCurrency = getMockedCurrency();
  const mockAccount = getMockedAccount();
  const mockDerivationMode: DerivationMode = "";
  const mockSyncConfig: SyncConfig = {
    paginationConfig: {},
  };
  const mockInitialAccount: AleoAccount = {
    ...getMockedAccount(),
    aleoResources: {
      transparentBalance: new BigNumber(500000),
      provableApi: null,
      privateBalance: null,
      unspentPrivateRecords: null,
      lastPrivateSyncDate: null,
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
    mockFetchAllOwnedRecords.mockResolvedValue([]);
    mockListPrivateOperations.mockResolvedValue({ operations: [], consumedRecordTags: new Set() });
    mockGetPrivateBalance.mockResolvedValue({ balance: new BigNumber(0), unspentRecords: [] });
    mockPatchPublicOperations.mockResolvedValue([]);
  });

  describe("performPublicSync", () => {
    it("should preserve viewKey from initial account", async () => {
      const result = await performPublicSync(
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

    it("should create account shape with native balance", async () => {
      const result = await performPublicSync(
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

      const result = await performPublicSync(
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

      const result = await performPublicSync(
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
      await performPublicSync(
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
        options: {
          minHeight: 0,
          order: "asc",
        },
      });
    });

    it("should pass cursor from latest operation block height when resuming sync", async () => {
      const mockOperation = getMockedOperation({
        blockHeight: 12345,
        accountId: mockInitialAccount.id,
      });

      const accountWithOperations = {
        ...mockInitialAccount,
        operations: [mockOperation],
      };

      await performPublicSync(
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
        options: {
          minHeight: 0,
          order: "asc",
          cursor: mockOperation.blockHeight?.toString(),
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
        operations: [newOperation as any],
        nextCursor: null,
      });

      const result = await performPublicSync(
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
        performPublicSync(
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

    it("should fall back to initialAccount.blockHeight when lastBlock returns null", async () => {
      mockLastBlock.mockResolvedValue(null as any);
      const accountWithBlockHeight = { ...mockInitialAccount, blockHeight: 42 };

      const result = await performPublicSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithBlockHeight,
        },
        mockSyncConfig,
      );

      expect(result.blockHeight).toBe(42);
    });

    it("should fall back to 0 for blockHeight when lastBlock returns null and there is no initialAccount", async () => {
      mockLastBlock.mockResolvedValue(null as any);

      const result = await performPublicSync(
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

      expect(result.blockHeight).toBe(0);
    });

    it("should treat undefined operations as empty array", async () => {
      const accountWithNoOps = { ...mockInitialAccount, operations: undefined as any };

      const result = await performPublicSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithNoOps,
        },
        mockSyncConfig,
      );

      expect(result.operations).toEqual([]);
    });
  });

  describe("accessProvableApi handling", () => {
    it("should not call accessProvableApi when there is no initialAccount", async () => {
      await performPublicSync(
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

      await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithProvableApi,
        },
        mockSyncConfig,
        [],
      );

      expect(mockAccessProvableApi).toHaveBeenCalledTimes(1);
      expect(mockAccessProvableApi).toHaveBeenCalledWith({
        currency: mockCurrency,
        viewKey: "AViewKey123",
        provableApi: accountWithProvableApi.aleoResources?.provableApi,
      });
    });

    it("should fall back to existing provableApi when accessProvableApi throws", async () => {
      const accountWithProvableApi = getMockedAccount();
      mockAccessProvableApi.mockRejectedValueOnce(new Error("Network failure"));

      // catch block swallows the error and falls back to initialAccount.aleoResources.provableApi;
      // scanner is not synced on the fallback so performPrivateSync resolves to null gracefully
      await expect(
        performPrivateSync(
          {
            index: mockAccount.index,
            derivationPath: mockAccount.freshAddressPath,
            address: mockAccount.freshAddress,
            currency: mockCurrency,
            derivationMode: mockDerivationMode,
            initialAccount: accountWithProvableApi,
          },
          mockSyncConfig,
          [],
        ),
      ).resolves.toBeNull();
    });

    it("should return null when accessProvableApi throws and aleoResources is undefined", async () => {
      mockAccessProvableApi.mockRejectedValueOnce(new Error("boom"));
      const { aleoResources: _aleoResources, ...accountWithNoResources } = mockInitialAccount;

      // catch falls back to undefined ?? null → provableApi=null → private sync skipped
      const result = await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithNoResources,
        },
        mockSyncConfig,
        [],
      );

      expect(result).toBeNull();
    });

    it("should store the updated provableApi returned by accessProvableApi in aleoResources", async () => {
      const updatedProvableApi = {
        ...mockAleoResources.provableApi,
        scannerStatus: { synced: true, percentage: 100 },
      };
      mockAccessProvableApi.mockResolvedValueOnce(updatedProvableApi);

      const result = await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: mockInitialAccount,
        },
        mockSyncConfig,
        [],
      );

      expect(result?.aleoResources?.provableApi).toEqual(updatedProvableApi);
    });
  });

  describe("private sync path", () => {
    const configuredProvableApi = {
      ...mockAleoResources.provableApi!,
      scannerStatus: { percentage: 100, synced: true },
    };

    it("should skip private sync when there is no initialAccount", async () => {
      await expect(
        performPrivateSync(
          {
            index: mockAccount.index,
            derivationPath: mockAccount.freshAddressPath,
            address: mockAccount.freshAddress,
            currency: mockCurrency,
            derivationMode: mockDerivationMode,
            initialAccount: undefined as any,
          },
          mockSyncConfig,
          [],
        ),
      ).rejects.toThrow();

      expect(mockFetchAllOwnedRecords).not.toHaveBeenCalled();
      expect(mockListPrivateOperations).not.toHaveBeenCalled();
      expect(mockGetPrivateBalance).not.toHaveBeenCalled();
    });

    it("should skip private sync when accessProvableApi returns null", async () => {
      mockAccessProvableApi.mockResolvedValue(null);
      const result = await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: mockInitialAccount,
        },
        mockSyncConfig,
        [],
      );

      expect(result).toBeNull();
      expect(mockFetchAllOwnedRecords).not.toHaveBeenCalled();
      expect(mockListPrivateOperations).not.toHaveBeenCalled();
      expect(mockGetPrivateBalance).not.toHaveBeenCalled();
      expect(mockPatchPublicOperations).not.toHaveBeenCalled();
    });

    it("should skip private sync (including patchPublicOperations) when record scanner is not ready (scannerStatus.synced is false)", async () => {
      const notReadyProvableApi = {
        ...mockAleoResources.provableApi!,
        scannerStatus: { synced: false, percentage: 50 },
      };
      mockAccessProvableApi.mockResolvedValueOnce(notReadyProvableApi);

      const result = await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: mockInitialAccount,
        },
        mockSyncConfig,
        [],
      );

      expect(result).toBeNull();
      expect(mockFetchAllOwnedRecords).not.toHaveBeenCalled();
      expect(mockListPrivateOperations).not.toHaveBeenCalled();
      expect(mockGetPrivateBalance).not.toHaveBeenCalled();
      expect(mockPatchPublicOperations).not.toHaveBeenCalled();
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

      mockFetchAllOwnedRecords
        .mockResolvedValueOnce(mockPrivateRecords)
        .mockResolvedValueOnce(mockUnspentRecords);
      mockListPrivateOperations.mockResolvedValueOnce({
        operations: mockPrivateOps,
        consumedRecordTags: new Set(),
      });
      mockGetPrivateBalance.mockResolvedValueOnce({
        balance: new BigNumber(50000),
        unspentRecords: mockUnspentResult,
      });

      const result = await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: mockInitialAccount,
        },
        mockSyncConfig,
        [],
      );

      expect(mockFetchAllOwnedRecords).toHaveBeenCalledTimes(2);
      expect(mockFetchAllOwnedRecords).toHaveBeenCalledWith({
        currency: mockCurrency,
        uuid: configuredProvableApi.uuid,
        start: 0,
      });
      expect(mockFetchAllOwnedRecords).toHaveBeenCalledWith({
        currency: mockCurrency,
        uuid: configuredProvableApi.uuid,
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
        oldUnspentRecords: [],
      });
      expect(result?.aleoResources?.privateBalance).toEqual(new BigNumber(50000));
      expect(result?.aleoResources?.unspentPrivateRecords).toEqual(mockUnspentResult);
      expect(result?.aleoResources?.lastPrivateSyncDate).toBeInstanceOf(Date);
    });

    it("should use latest private operation blockHeight as start cursor for getAccountOwnedRecords", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      const privateOp = getMockedOperation({
        blockHeight: 9999,
        extra: { transactionType: "private", functionId: "transfer_private" },
      });
      const accountWithPrivateOps = { ...mockInitialAccount, operations: [privateOp] };

      await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithPrivateOps,
        },
        mockSyncConfig,
        [],
      );

      expect(mockFetchAllOwnedRecords).toHaveBeenCalledWith(
        expect.objectContaining({ start: 9999 }),
      );
    });

    it("should use 0 as start cursor when previous private op has undefined blockHeight", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      const unconfirmedPrivateOp = getMockedOperation({
        blockHeight: undefined,
        extra: { transactionType: "private", functionId: "transfer_private" },
      });

      await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: { ...mockInitialAccount, operations: [unconfirmedPrivateOp] },
        },
        mockSyncConfig,
        [],
      );

      expect(mockFetchAllOwnedRecords).toHaveBeenCalledWith(expect.objectContaining({ start: 0 }));
    });

    it("should use public operation blockHeight for listOperations cursor, not the private op height", async () => {
      const privateOp = getMockedOperation({
        blockHeight: 9999,
        extra: { transactionType: "private", functionId: "transfer_private" },
      });
      const publicOp = getMockedOperation({
        blockHeight: 500,
        extra: { transactionType: "public", functionId: "transfer_public" },
      });
      const accountWithMixedOps = { ...mockInitialAccount, operations: [privateOp, publicOp] };

      await performPublicSync(
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

      expect(mockListOperations).toHaveBeenCalledTimes(1);
      expect(mockListOperations).toHaveBeenCalledWith(
        expect.objectContaining({
          options: expect.objectContaining({ cursor: "500" }),
        }),
      );
    });

    it("should compute totalBalance as transparentBalance plus privateBalance", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      mockGetPrivateBalance.mockResolvedValueOnce({
        balance: new BigNumber(500000),
        unspentRecords: [],
      });

      const result = await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: mockInitialAccount,
        },
        mockSyncConfig,
        [],
        new BigNumber(1000000),
      );

      expect(result?.balance).toEqual(new BigNumber(1500000));
      expect(result?.spendableBalance).toEqual(new BigNumber(1500000));
    });

    it("should fall back to aleoResources.transparentBalance when no freshTransparentBalance is supplied", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      mockGetPrivateBalance.mockResolvedValueOnce({
        balance: new BigNumber(5000),
        unspentRecords: [],
      });
      const accountWithTransparentBalance = {
        ...mockInitialAccount,
        aleoResources: {
          ...mockInitialAccount.aleoResources!,
          transparentBalance: new BigNumber(1000),
        },
      };

      const result = await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithTransparentBalance,
        },
        mockSyncConfig,
        [],
        // freshTransparentBalance intentionally omitted
      );

      expect(result?.balance).toEqual(new BigNumber(6000)); // 1000 + 5000
    });

    it("should fall back to BigNumber(0) for transparentBalance when aleoResources is undefined", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      mockGetPrivateBalance.mockResolvedValueOnce({
        balance: new BigNumber(5000),
        unspentRecords: [],
      });
      const { aleoResources: _aleoResources2, ...accountWithNoResources } = mockInitialAccount;

      const result = await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithNoResources,
        },
        mockSyncConfig,
        [],
      );

      expect(result?.balance).toEqual(new BigNumber(5000)); // 0 + 5000
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

      mockListOperations.mockResolvedValueOnce({
        // @ts-expect-error - bridge operation type is expected in this test
        operations: [newPublicOp],
        nextCursor: null,
      });
      mockListPrivateOperations.mockResolvedValueOnce({
        operations: [newPrivateOp],
        consumedRecordTags: new Set(),
      });
      mockPatchPublicOperations.mockResolvedValueOnce([newPublicOp, oldPublicOp]);

      const result = await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithOps,
        },
        mockSyncConfig,
        [newPublicOp, oldPublicOp],
      );

      expect(result?.operationsCount).toBe(3);
      expect(result?.operations).toEqual([
        expect.objectContaining({ id: "priv_new" }),
        expect.objectContaining({ id: "pub_new" }),
        expect.objectContaining({ id: "pub_old" }),
      ]);
    });

    it("should preserve aleoResources fields from initialAccount when private sync does not run", async () => {
      const lastPrivateSyncDate = new Date("2024-01-01");
      const accountWithResources = {
        ...mockInitialAccount,
        aleoResources: {
          ...mockInitialAccount.aleoResources!,
          privateBalance: new BigNumber(999999),
          lastPrivateSyncDate,
        },
      };

      const result = await performPublicSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: accountWithResources,
        },
        mockSyncConfig,
      );

      // provableApi is null so private sync is skipped — fields preserved
      expect(result.aleoResources?.privateBalance).toEqual(new BigNumber(999999));
      expect(result.aleoResources?.lastPrivateSyncDate).toBe(lastPrivateSyncDate);
      expect(result.aleoResources?.unspentPrivateRecords).toBeNull();
      expect(mockPatchPublicOperations).not.toHaveBeenCalled();
    });

    it("should call patchPublicOperations with correct args when private sync runs", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      const newPublicOp = getMockedOperation({ id: "pub_op", hash: "at1pub" });
      const privateRecord = getMockedRecord();
      mockListOperations.mockResolvedValueOnce({
        operations: [newPublicOp as any],
        nextCursor: null,
      });
      mockFetchAllOwnedRecords.mockResolvedValueOnce([privateRecord]).mockResolvedValueOnce([]);

      await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: mockInitialAccount,
        },
        mockSyncConfig,
        [newPublicOp],
      );

      expect(mockPatchPublicOperations).toHaveBeenCalledTimes(1);
      expect(mockPatchPublicOperations).toHaveBeenCalledWith({
        currency: mockCurrency,
        publicOperations: expect.any(Array),
        privateRecords: [privateRecord],
        address: mockAccount.freshAddress,
        ledgerAccountId: expect.any(String),
        viewKey: "AViewKey123",
      });
    });

    it("should use patchPublicOperations result as public operations in merged output", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      const patchedOp = getMockedOperation({ id: "patched_op", date: new Date("2024-03-01") });
      mockPatchPublicOperations.mockResolvedValueOnce([patchedOp]);

      const result = await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: mockInitialAccount,
        },
        mockSyncConfig,
        [],
      );

      expect(result?.operations).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "patched_op" })]),
      );
    });

    it("should filter unspent records whose tags appear in consumedRecordTags before passing to getPrivateBalance", async () => {
      mockAccessProvableApi.mockResolvedValueOnce(configuredProvableApi);
      const consumedTag = "consumed-record-tag";
      const spentRecord = getMockedRecord({ tag: consumedTag, record_ciphertext: "spent" });
      const unspentRecord = getMockedRecord({ tag: "unspent-tag", record_ciphertext: "unspent" });

      mockFetchAllOwnedRecords
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([spentRecord, unspentRecord]); // unspent from scanner (with stale data)
      mockListPrivateOperations.mockResolvedValueOnce({
        operations: [],
        consumedRecordTags: new Set([consumedTag]),
      });

      await performPrivateSync(
        {
          index: mockAccount.index,
          derivationPath: mockAccount.freshAddressPath,
          address: mockAccount.freshAddress,
          currency: mockCurrency,
          derivationMode: mockDerivationMode,
          initialAccount: mockInitialAccount,
        },
        mockSyncConfig,
        [],
      );

      expect(mockGetPrivateBalance).toHaveBeenCalledTimes(1);
      expect(mockGetPrivateBalance).toHaveBeenCalledWith({
        currency: mockCurrency,
        viewKey: "AViewKey123",
        privateRecords: [unspentRecord],
        oldUnspentRecords: [],
      });
    });
  });

  // helper – collects all emissions from an observable into an array
  function collectAll<T>(obs: Observable<T>): Promise<T[]> {
    return firstValueFrom(obs.pipe(toArray()));
  }

  describe("buildSyncObservables / makeGetAccountShape", () => {
    const baseInfo = {
      index: mockAccount.index,
      derivationPath: mockAccount.freshAddressPath,
      address: mockAccount.freshAddress,
      currency: mockCurrency,
      derivationMode: mockDerivationMode,
      initialAccount: mockInitialAccount,
    };

    it("createPublicSyncObservable emits and completes on success", async () => {
      // import createPublicSyncObservable from "./sync"
      const emissions = await collectAll(createPublicSyncObservable(baseInfo, mockSyncConfig));
      expect(emissions).toHaveLength(1);
      expect(emissions[0].blockHeight).toBe(100);
    });

    it("createPublicSyncObservable errors when performPublicSync throws", async () => {
      mockGetBalance.mockRejectedValue(new Error("rpc down"));
      const shape$ = createPublicSyncObservable(baseInfo, mockSyncConfig);
      await expect(firstValueFrom(shape$)).rejects.toThrow("rpc down");
    });

    it("createPrivateSyncObservable emits nothing and completes when provableApi returns null", async () => {
      mockAccessProvableApi.mockResolvedValue(null);
      const emissions = await collectAll(createPrivateSyncObservable(baseInfo, mockSyncConfig, []));
      expect(emissions).toHaveLength(0);
    });

    it("createPrivateSyncObservable errors when performPrivateSync throws", async () => {
      const configuredProvableApi = {
        ...mockAleoResources.provableApi!,
        scannerStatus: { percentage: 100, synced: true },
      };
      mockAccessProvableApi.mockResolvedValue(configuredProvableApi);
      mockFetchAllOwnedRecords.mockRejectedValue(new Error("scanner down"));

      const shape$ = createPrivateSyncObservable(baseInfo, mockSyncConfig, []);
      await expect(firstValueFrom(shape$)).rejects.toThrow("scanner down");
    });

    it("public-only sync emits exactly one value and completes", async () => {
      const { syncs } = buildSyncObservables(baseInfo, {
        paginationConfig: {},
        syncType: SYNC_TYPE_TRANSPARENT,
      });

      expect(syncs).toHaveLength(1);
      const emissions = await collectAll(syncs[0]);
      expect(emissions).toHaveLength(1);
      expect(emissions[0]).toMatchObject({ blockHeight: 100 });
    });

    it("private-only sync (SYNC_TYPE_SHIELDED) emits zero values when provableApi is not ready", async () => {
      mockAccessProvableApi.mockResolvedValue(null);

      const { syncs } = buildSyncObservables(baseInfo, {
        paginationConfig: {},
        syncType: SYNC_TYPE_SHIELDED,
      });

      expect(syncs).toHaveLength(1);
      const emissions = await collectAll(syncs[0]);
      expect(emissions).toHaveLength(0); // private sync skipped → null → no emission
    });

    it("private-only sync (SYNC_TYPE_SHIELDED) emits a progress update when scanner is configured but not fully synced", async () => {
      // Account with provableApi already configured (has aleoResources)
      const accountWithProvableApi: AleoAccount = {
        ...getMockedAccount(),
        aleoResources: {
          ...mockAleoResources,
          provableApi: {
            ...mockAleoResources.provableApi!,
            scannerStatus: { percentage: 30, synced: false },
          },
        },
      };

      // accessProvableApi returns a refreshed provableApi with updated percentage
      const refreshedProvableApi = {
        ...mockAleoResources.provableApi!,
        scannerStatus: { percentage: 75, synced: false },
      };
      mockAccessProvableApi.mockResolvedValue(refreshedProvableApi);

      const { syncs } = buildSyncObservables(
        { ...baseInfo, initialAccount: accountWithProvableApi },
        { paginationConfig: {}, syncType: SYNC_TYPE_SHIELDED },
      );

      expect(syncs).toHaveLength(1);
      const emissions = await collectAll(syncs[0]);
      // Should emit exactly one partial update carrying the refreshed provableApi
      expect(emissions).toHaveLength(1);
      expect(emissions[0].aleoResources?.provableApi?.scannerStatus?.percentage).toBe(75);
      expect(emissions[0].aleoResources?.provableApi?.scannerStatus?.synced).toBe(false);
      // operations are preserved so makeSync (shouldMergeOps: false) does not wipe them
      expect(emissions[0].operations).toEqual(accountWithProvableApi.operations);
      expect(emissions[0].balance).toBeUndefined();
    });

    it("combined sync (SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED) does NOT emit progress when scanner is not ready", async () => {
      const accountWithProvableApi: AleoAccount = {
        ...getMockedAccount(),
        aleoResources: { ...mockAleoResources },
      };
      const notSyncedProvableApi = {
        ...mockAleoResources.provableApi!,
        scannerStatus: { percentage: 50, synced: false },
      };
      mockAccessProvableApi.mockResolvedValue(notSyncedProvableApi);

      const { syncs } = buildSyncObservables(
        { ...baseInfo, initialAccount: accountWithProvableApi },
        { paginationConfig: {}, syncType: SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED },
      );

      expect(syncs).toHaveLength(1);
      const emissions = await collectAll(syncs[0]);
      // Public sync emits its result; private sync (not ready, emitProgressUpdates=false) skips
      expect(emissions).toHaveLength(1);
      expect(emissions[0]).toMatchObject({ blockHeight: 100 }); // only the public result
    });

    it("returns no syncs when syncType is 0", () => {
      const { syncs } = buildSyncObservables(baseInfo, {
        paginationConfig: {},
        syncType: 0,
      });

      expect(syncs).toHaveLength(0);
    });

    it("returns no syncs for SYNC_TYPE_SHIELDED when there is no initialAccount", () => {
      const { syncs } = buildSyncObservables(
        { ...baseInfo, initialAccount: undefined },
        { paginationConfig: {}, syncType: SYNC_TYPE_SHIELDED },
      );

      expect(syncs).toHaveLength(0);
    });

    it("should handle undefined operations in private-only sync path", async () => {
      mockAccessProvableApi.mockResolvedValue(null);
      const accountWithNoOps = { ...mockInitialAccount, operations: undefined as any };

      const { syncs } = buildSyncObservables(
        { ...baseInfo, initialAccount: accountWithNoOps },
        { paginationConfig: {}, syncType: SYNC_TYPE_SHIELDED },
      );

      expect(syncs).toHaveLength(1);
      const emissions = await collectAll(syncs[0]);
      expect(emissions).toHaveLength(0); // provableApi null → skipped
    });

    it("public+private sync emits public result first, then private result", async () => {
      const configuredProvableApi = {
        ...mockAleoResources.provableApi!,
        scannerStatus: { percentage: 100, synced: true },
      };
      mockAccessProvableApi.mockResolvedValue(configuredProvableApi);
      mockGetPrivateBalance.mockResolvedValue({
        balance: new BigNumber(5000),
        unspentRecords: [],
      });

      const { syncs } = buildSyncObservables(baseInfo, {
        paginationConfig: {},
        syncType: SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED,
      });

      expect(syncs).toHaveLength(1);
      const [first, second] = await collectAll(syncs[0]);

      // first emission: public result (no lastPrivateSyncDate yet)
      expect(first.aleoResources?.lastPrivateSyncDate).toBeNull();
      expect(first.blockHeight).toBe(100);

      // second emission: private result (has lastPrivateSyncDate, updated balance)
      expect(second.aleoResources?.lastPrivateSyncDate).toBeInstanceOf(Date);
      expect(second.aleoResources?.privateBalance).toEqual(new BigNumber(5000));
    });

    it("makeGetAccountShape completes immediately with no emissions when syncType is 0", async () => {
      const shape$ = makeGetAccountShape()(baseInfo, { paginationConfig: {}, syncType: 0 });
      const emissions = await collectAll(shape$);
      expect(emissions).toHaveLength(0);
    });

    it("makeGetAccountShape emits one value and completes for public-only sync", async () => {
      const shape$ = makeGetAccountShape()(baseInfo, {
        paginationConfig: {},
        syncType: SYNC_TYPE_TRANSPARENT,
      });
      const emissions = await collectAll(shape$);
      expect(emissions).toHaveLength(1);
      expect(emissions[0].blockHeight).toBe(100);
    });

    it("makeGetAccountShape errors the outer observable when public sync throws", async () => {
      mockGetBalance.mockRejectedValue(new Error("Network failure"));

      const shape$ = makeGetAccountShape()(baseInfo, { paginationConfig: {} });

      await expect(firstValueFrom(shape$)).rejects.toThrow("Network failure");
    });

    it("makeGetAccountShape errors the outer observable when private sync throws after public emits", async () => {
      const configuredProvableApi = {
        ...mockAleoResources.provableApi!,
        scannerStatus: { percentage: 100, synced: true },
      };
      mockAccessProvableApi.mockResolvedValue(configuredProvableApi);
      // Make one of the private sub-calls throw
      mockFetchAllOwnedRecords.mockRejectedValue(new Error("Scanner unavailable"));

      const shape$ = makeGetAccountShape()(
        { ...baseInfo },
        { paginationConfig: {}, syncType: SYNC_TYPE_TRANSPARENT | SYNC_TYPE_SHIELDED },
      );

      const emissions: Partial<AleoAccount>[] = [];
      await expect(
        new Promise<void>((resolve, reject) =>
          shape$.subscribe({ next: v => emissions.push(v), complete: resolve, error: reject }),
        ),
      ).rejects.toThrow("Scanner unavailable");

      // The public emission arrived before the private failure
      expect(emissions).toHaveLength(1);
      expect(emissions[0].blockHeight).toBe(100);
    });
  });

  describe("postSync", () => {
    it("should return synced account unchanged when there are no pending operations", () => {
      const synced: AleoAccount = {
        ...mockInitialAccount,
        operations: [getMockedOperation({ hash: "confirmed-hash" })],
        pendingOperations: [],
      };

      expect(postSync(synced, synced)).toBe(synced);
    });

    it("should remove only confirmed pending operations and keep unconfirmed ones", () => {
      const confirmedOp = getMockedOperation({
        id: "account-tx-confirmed-OUT",
        hash: "tx-confirmed",
        type: "OUT",
      });
      const pendingConfirmedOp = getMockedOperation({
        id: "account-tx-confirmed-OUT",
        hash: "tx-confirmed",
        type: "OUT",
      });
      const pendingUnconfirmedOp = getMockedOperation({
        id: "account-tx-pending-OUT",
        hash: "tx-pending",
        type: "OUT",
      });

      const synced: AleoAccount = {
        ...mockInitialAccount,
        operations: [confirmedOp],
        pendingOperations: [pendingConfirmedOp, pendingUnconfirmedOp],
      };

      const result = postSync(synced, synced);

      expect(result.pendingOperations).toEqual([
        expect.objectContaining({ id: pendingUnconfirmedOp.id }),
      ]);
    });

    it("should keep a pending OUT op when only the IN side of a private -> public self-transfer is confirmed", () => {
      const confirmedPublicInOp = getMockedOperation({
        id: "account-tx-self-transfer-IN",
        hash: "tx-self-transfer",
        type: "IN",
      });
      const pendingPrivateOutOp = getMockedOperation({
        id: "account-tx-self-transfer-OUT",
        hash: "tx-self-transfer",
        type: "OUT",
      });

      const synced: AleoAccount = {
        ...mockInitialAccount,
        operations: [confirmedPublicInOp],
        pendingOperations: [pendingPrivateOutOp],
      };

      const result = postSync(synced, synced);

      // The pending OUT should still be present - the confirmed set only has the "IN" id.
      expect(result.pendingOperations).toEqual([
        expect.objectContaining({ id: pendingPrivateOutOp.id }),
      ]);
    });

    it("should remove a pending OUT op once the private OUT side of a self-transfer is confirmed", () => {
      const confirmedPublicInOp = getMockedOperation({
        id: "account-tx-self-transfer-IN",
        hash: "tx-self-transfer",
        type: "IN",
      });
      const confirmedPrivateOutOp = getMockedOperation({
        id: "account-tx-self-transfer-OUT",
        hash: "tx-self-transfer",
        type: "OUT",
      });
      const pendingPrivateOutOp = getMockedOperation({
        id: "account-tx-self-transfer-OUT",
        hash: "tx-self-transfer",
        type: "OUT",
      });

      const synced: AleoAccount = {
        ...mockInitialAccount,
        operations: [confirmedPublicInOp, confirmedPrivateOutOp],
        pendingOperations: [pendingPrivateOutOp],
      };

      const result = postSync(synced, synced);

      expect(result.pendingOperations).toEqual([]);
    });
  });
});
