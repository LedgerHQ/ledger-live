import BigNumber from "bignumber.js";
import { log } from "@ledgerhq/logs";
import { LedgerAPI4xx, LedgerAPI5xx } from "@ledgerhq/live-network/errors";
import { AleoApiConfigurationResetError } from "../errors";
import {
  EXPLORER_TRANSFER_TYPES,
  DEFAULT_RECORDS_PAGE_SIZE,
  DEFAULT_TOKENS_PAGE_SIZE,
  PROGRAM_ID,
  TOKEN_RECORD_NAME,
} from "../constants";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import { sdkClient } from "../network/sdk";
import type { ProvableApi } from "../types";
import {
  getMockedRecord,
  getMockedPublicTransaction,
  getMockedTransactionDetails,
  getMockedDecryptedRecord,
  getMockedTokenDetails,
  getMockedGetTokensResponse,
} from "../__tests__/fixtures/api.fixture";
import { getMockedOperation } from "../__tests__/fixtures/operation.fixture";
import { apiClient } from "./api";
import {
  fetchAccountTransactionsFromHeight,
  fetchAllOwnedRecords,
  fetchAllTokens,
  fetchTransitionPage,
  enrichPrivateRecord,
  enrichPrivateRecords,
  patchPublicOperations,
  getTokenOutDetails,
  getRecordScannerStatusOrThrow,
  accessProvableApi,
  decryptRecordAmount,
  sumUnspentRecords,
  getStakingPosition,
} from "./utils";

jest.mock("./api");
jest.mock("./sdk");
jest.mock("@ledgerhq/logs", () => ({
  log: jest.fn(),
}));
jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  generateUniqueUsername: jest.fn(),
}));

const mockGetRecordScannerStatus = jest.mocked(apiClient.getRecordScannerStatus);
const mockGetScannerPublicKey = jest.mocked(apiClient.getScannerPublicKey);
const mockEncryptRegistrationPayload = jest.mocked(sdkClient.encryptRegistrationPayload);
const mockRegisterForScanningAccountRecords = jest.mocked(
  apiClient.registerForScanningAccountRecordsEncrypted,
);
const mockGetTransactionById = jest.mocked(apiClient.getTransactionById);
const mockDecryptCiphertext = jest.mocked(sdkClient.decryptCiphertext);
const mockDecryptRecord = jest.mocked(sdkClient.decryptRecord);

describe("network/utils", () => {
  const mockConfig = getMockedConfig("mainnet");
  const mockAddress = "aleo1test123address456";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("fetchAccountTransactionsFromHeight", () => {
    describe("with fetchAllPages=true", () => {
      it("should fetch all transactions across multiple pages", async () => {
        const minBlockHeight = 100;
        const mockPage1Txs = [
          getMockedPublicTransaction({ block_number: 150 }),
          getMockedPublicTransaction({ block_number: 140 }),
        ];
        const mockPage2Txs = [
          getMockedPublicTransaction({ block_number: 130 }),
          getMockedPublicTransaction({ block_number: 120 }),
        ];

        jest
          .mocked(apiClient.getAccountPublicTransactions)
          .mockResolvedValueOnce({
            address: mockAddress,
            transactions: mockPage1Txs,
            next_cursor: { block_number: 140, transition_id: "au1" },
          })
          .mockResolvedValueOnce({
            address: mockAddress,
            transactions: mockPage2Txs,
          });

        const result = await fetchAccountTransactionsFromHeight({
          config: mockConfig,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(2);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenNthCalledWith(1, {
          config: mockConfig,
          address: mockAddress,
          limit: 50,
          order: "asc",
        });
        expect(apiClient.getAccountPublicTransactions).toHaveBeenNthCalledWith(2, {
          config: mockConfig,
          address: mockAddress,
          limit: 50,
          order: "asc",
          cursor: { blockNumber: 140 },
        });
        expect(result.transactions).toHaveLength(4);
        expect(result.nextCursor).toBeNull();
      });

      it("should filter out transactions below minBlockHeight", async () => {
        const minBlockHeight = 130;
        const mockTxs = [
          getMockedPublicTransaction({ block_number: 150 }),
          getMockedPublicTransaction({ block_number: 140 }),
          getMockedPublicTransaction({ block_number: 120 }), // below min
          getMockedPublicTransaction({ block_number: 100 }), // below min
        ];

        jest.mocked(apiClient.getAccountPublicTransactions).mockResolvedValueOnce({
          address: mockAddress,
          transactions: mockTxs,
        });

        const result = await fetchAccountTransactionsFromHeight({
          config: mockConfig,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          config: mockConfig,
          address: mockAddress,
          limit: 50,
          order: "asc",
        });
        expect(result.transactions).toHaveLength(2);
        expect(result.transactions[0].block_number).toBe(150);
        expect(result.transactions[1].block_number).toBe(140);
        expect(result.nextCursor).toBeNull();
      });

      it("should handle descending order and stop at minBlockHeight", async () => {
        const minBlockHeight = 130;
        const mockTxs = [
          getMockedPublicTransaction({ block_number: 150 }),
          getMockedPublicTransaction({ block_number: 140 }),
          getMockedPublicTransaction({ block_number: 120 }), // below min - should stop
        ];

        jest.mocked(apiClient.getAccountPublicTransactions).mockResolvedValueOnce({
          address: mockAddress,
          transactions: mockTxs,
          next_cursor: { block_number: 120, transition_id: "au1" },
        });

        const result = await fetchAccountTransactionsFromHeight({
          config: mockConfig,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
          order: "desc",
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          config: mockConfig,
          address: mockAddress,
          limit: 50,
          order: "desc",
        });
        expect(result.transactions).toHaveLength(2);
        expect(result.nextCursor).toBeNull();
      });
    });

    describe("with fetchAllPages=false (pagination mode)", () => {
      it("should return limited transactions with cursor", async () => {
        const limit = 2;
        const minBlockHeight = 100;
        const mockTxs = [
          getMockedPublicTransaction({ block_number: 150, transaction_id: "tx1" }),
          getMockedPublicTransaction({ block_number: 140, transaction_id: "tx2" }),
          getMockedPublicTransaction({ block_number: 130, transaction_id: "tx3" }),
        ];

        jest.mocked(apiClient.getAccountPublicTransactions).mockResolvedValueOnce({
          address: mockAddress,
          transactions: mockTxs,
          next_cursor: { block_number: 130, transition_id: "au1" },
        });

        const result = await fetchAccountTransactionsFromHeight({
          config: mockConfig,
          address: mockAddress,
          fetchAllPages: false,
          minBlockHeight,
          limit,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          config: mockConfig,
          address: mockAddress,
          limit,
          order: "asc",
        });
        expect(result.transactions).toHaveLength(2);
        expect(result.nextCursor).toBe("140");
      });

      it("should handle no more pages scenario", async () => {
        const limit = 10;
        const minBlockHeight = 100;
        const mockTxs = [
          getMockedPublicTransaction({ block_number: 150 }),
          getMockedPublicTransaction({ block_number: 140 }),
        ];

        jest.mocked(apiClient.getAccountPublicTransactions).mockResolvedValueOnce({
          address: mockAddress,
          transactions: mockTxs,
        });

        const result = await fetchAccountTransactionsFromHeight({
          config: mockConfig,
          address: mockAddress,
          fetchAllPages: false,
          minBlockHeight,
          limit,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          config: mockConfig,
          address: mockAddress,
          limit,
          order: "asc",
        });
        expect(result.transactions).toHaveLength(2);
        expect(result.nextCursor).toBeNull();
      });

      it("should use provided cursor for pagination", async () => {
        const cursor = "200";
        const minBlockHeight = 100;
        const mockTxs = [getMockedPublicTransaction({ block_number: 190 })];

        jest.mocked(apiClient.getAccountPublicTransactions).mockResolvedValueOnce({
          address: mockAddress,
          transactions: mockTxs,
        });

        await fetchAccountTransactionsFromHeight({
          config: mockConfig,
          address: mockAddress,
          fetchAllPages: false,
          minBlockHeight,
          cursor,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          config: mockConfig,
          address: mockAddress,
          limit: 50,
          order: "asc",
          cursor: { blockNumber: Number(cursor) },
        });
      });
    });

    describe("edge cases", () => {
      it("should handle empty transaction list", async () => {
        const minBlockHeight = 100;

        jest.mocked(apiClient.getAccountPublicTransactions).mockResolvedValueOnce({
          address: mockAddress,
          transactions: [],
        });

        const result = await fetchAccountTransactionsFromHeight({
          config: mockConfig,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
        });

        expect(result.transactions).toHaveLength(0);
        expect(result.nextCursor).toBeNull();
      });

      it("should respect custom limit parameter", async () => {
        const customLimit = 25;
        const minBlockHeight = 100;
        const mockTxs = [getMockedPublicTransaction({ block_number: 150 })];

        jest.mocked(apiClient.getAccountPublicTransactions).mockResolvedValueOnce({
          address: mockAddress,
          transactions: mockTxs,
        });

        await fetchAccountTransactionsFromHeight({
          config: mockConfig,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
          limit: customLimit,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          config: mockConfig,
          address: mockAddress,
          limit: customLimit,
          order: "asc",
        });
      });

      it("should handle descending order parameter", async () => {
        const minBlockHeight = 100;
        const mockTxs = [getMockedPublicTransaction({ block_number: 150 })];

        jest.mocked(apiClient.getAccountPublicTransactions).mockResolvedValueOnce({
          address: mockAddress,
          transactions: mockTxs,
        });

        await fetchAccountTransactionsFromHeight({
          config: mockConfig,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
          order: "desc",
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          config: mockConfig,
          address: mockAddress,
          limit: 50,
          order: "desc",
        });
      });

      it("should skip batcher outer call transitions that have transfer in function_id but empty addresses", async () => {
        const minBlockHeight = 100;
        const commonTxId = "at1batcher";

        // batcher outer call: function_id contains "transfer" but no account involvement
        // testnet example: at1lqugdt847uwnfem2xhzwq6ewrnd6ysjv2gumvglytskutxj3kcpsmc3rrf
        const batcherOuterCall = getMockedPublicTransaction({
          block_number: 150,
          transaction_id: commonTxId,
          function_id: "transfer_private_to_public_8",
          sender_address: "",
          recipient_address: "",
          amount: 0,
        });

        // inner transition for the same tx — carries the real amount and addresses
        const realTransfer = getMockedPublicTransaction({
          block_number: 150,
          transaction_id: commonTxId,
          function_id: "transfer_private_to_public",
          sender_address: "",
          recipient_address: "aleo1recipient",
          amount: 1000000,
        });

        // standalone NONE operation with empty addresses — must NOT be filtered
        const initializeTx = getMockedPublicTransaction({
          block_number: 150,
          transaction_id: "at1initialize",
          function_id: "initialize",
          sender_address: "",
          recipient_address: "",
          amount: 0,
        });

        jest.mocked(apiClient.getAccountPublicTransactions).mockResolvedValueOnce({
          address: mockAddress,
          transactions: [batcherOuterCall, realTransfer, initializeTx],
        });

        const result = await fetchAccountTransactionsFromHeight({
          config: mockConfig,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
        });

        expect(result.transactions).toHaveLength(2);
        expect(result.transactions).toContainEqual(realTransfer);
        expect(result.transactions).toContainEqual(initializeTx);
        expect(result.transactions).not.toContainEqual(batcherOuterCall);
      });
    });
  });

  describe("decryptRecordAmount", () => {
    const mockViewKey = "AViewKey1abc";

    it("should decrypt the record and parse the amount", async () => {
      const record = getMockedRecord({ record_ciphertext: "ciphertext123" });
      const details = getMockedDecryptedRecord({ data: { amount: "500000u64.private" } });
      mockDecryptRecord.mockResolvedValueOnce(details);

      const result = await decryptRecordAmount(mockConfig, mockViewKey, record);

      expect(mockDecryptRecord).toHaveBeenCalledWith({
        config: mockConfig,
        viewKey: mockViewKey,
        ciphertext: "ciphertext123",
      });
      expect(result.amount).toEqual(new BigNumber(500000));
      expect(result.details).toEqual(details);
    });

    it.each([
      ["balance", { balance: "200000u64.private" }],
      ["microcredits", { microcredits: "100000u64.private" }],
    ])("should fall back to %s when amount is missing", async (_label, data) => {
      mockDecryptRecord.mockResolvedValueOnce(getMockedDecryptedRecord({ data }));

      const result = await decryptRecordAmount(mockConfig, mockViewKey, getMockedRecord());

      expect(result.amount).toEqual(new BigNumber(Object.values(data)[0].replace(/u64.*/, "")));
    });

    it("should return zero when no known amount field is present", async () => {
      mockDecryptRecord.mockResolvedValueOnce(getMockedDecryptedRecord({ data: {} }));

      const result = await decryptRecordAmount(mockConfig, mockViewKey, getMockedRecord());

      expect(result.amount).toEqual(new BigNumber(0));
    });
  });

  describe("getRecordScannerStatusOrThrow", () => {
    const mockUUID = "uuid-abc-def";

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return the scanner status", async () => {
      const status = {
        synced: true,
        percentage: 100,
        sync_start_height: 0,
        synced_up_to: 20985061,
      };
      mockGetRecordScannerStatus.mockResolvedValue(status);

      const result = await getRecordScannerStatusOrThrow(mockConfig, mockUUID);

      expect(mockGetRecordScannerStatus).toHaveBeenCalledTimes(1);
      expect(mockGetRecordScannerStatus).toHaveBeenCalledWith(mockConfig, mockUUID);
      expect(result).toEqual(status);
    });

    it("should throw AleoApiConfigurationResetError on a 422 error", async () => {
      const error422 = new LedgerAPI4xx("Unprocessable Entity", {
        status: 422,
        url: undefined,
        method: "POST",
      });
      mockGetRecordScannerStatus.mockRejectedValue(error422);

      await expect(getRecordScannerStatusOrThrow(mockConfig, mockUUID)).rejects.toThrow(
        AleoApiConfigurationResetError,
      );
    });

    it("should rethrow a non-422 error unchanged", async () => {
      const networkError = new LedgerAPI5xx("Internal Server Error");
      mockGetRecordScannerStatus.mockRejectedValue(networkError);

      await expect(getRecordScannerStatusOrThrow(mockConfig, mockUUID)).rejects.toThrow(
        LedgerAPI5xx,
      );
    });
  });

  describe("accessProvableApi", () => {
    const mockViewKey = "AViewKey1mockviewkey";
    const mockUUID = "uuid-abc-def";
    const mockPublicKey = "aleo1publickey";
    const mockKeyId = "key-id-123";
    const mockEncryptedData = "encrypted-data-xyz";

    beforeEach(() => {
      jest.clearAllMocks();
      mockGetScannerPublicKey.mockResolvedValue({ public_key: mockPublicKey, key_id: mockKeyId });
      mockEncryptRegistrationPayload.mockResolvedValue({ encrypted: mockEncryptedData });
    });

    describe("UUID and scanning registration", () => {
      it("should register for scanning when uuid is missing", async () => {
        const existingProvableApi: ProvableApi = {
          scannerStatus: { synced: false, percentage: 0 },
        };

        mockRegisterForScanningAccountRecords.mockResolvedValue({ uuid: mockUUID });
        mockGetRecordScannerStatus.mockResolvedValue({
          synced: false,
          percentage: 5,
          sync_start_height: 0,
          synced_up_to: 0,
        });

        const result = await accessProvableApi({
          config: mockConfig,
          viewKey: mockViewKey,
          provableApi: existingProvableApi,
        });

        expect(mockGetScannerPublicKey).toHaveBeenCalledTimes(1);
        expect(mockGetScannerPublicKey).toHaveBeenCalledWith(mockConfig);
        expect(mockEncryptRegistrationPayload).toHaveBeenCalledTimes(1);
        expect(mockEncryptRegistrationPayload).toHaveBeenCalledWith({
          config: mockConfig,
          publicKey: mockPublicKey,
          viewKey: mockViewKey,
          start: 0,
        });
        expect(mockRegisterForScanningAccountRecords).toHaveBeenCalledTimes(1);
        expect(mockRegisterForScanningAccountRecords).toHaveBeenCalledWith({
          config: mockConfig,
          encryptedData: mockEncryptedData,
          keyId: mockKeyId,
        });
        expect(result?.uuid).toBe(mockUUID);
      });

      it("should not register for scanning when uuid exists", async () => {
        const existingProvableApi: ProvableApi = {
          uuid: mockUUID,
          scannerStatus: { synced: false, percentage: 50 },
        };

        mockGetRecordScannerStatus.mockResolvedValue({
          synced: false,
          percentage: 60,
          sync_start_height: 0,
          synced_up_to: 0,
        });

        const result = await accessProvableApi({
          config: mockConfig,
          viewKey: mockViewKey,
          provableApi: existingProvableApi,
        });

        expect(mockRegisterForScanningAccountRecords).not.toHaveBeenCalled();
        expect(result?.uuid).toBe(mockUUID);
      });
    });

    describe("Scanner status updates", () => {
      it("should update scanner status when status is available", async () => {
        const existingProvableApi: ProvableApi = {
          uuid: mockUUID,
          scannerStatus: { synced: false, percentage: 50 },
        };

        mockGetRecordScannerStatus.mockResolvedValue({
          synced: true,
          percentage: 100,
          sync_start_height: 0,
          synced_up_to: 20985061,
        });

        const result = await accessProvableApi({
          config: mockConfig,
          viewKey: mockViewKey,
          provableApi: existingProvableApi,
        });

        expect(result?.scannerStatus).toEqual({ synced: true, percentage: 100 });
      });

      it("should throw AleoApiConfigurationResetError when getRecordScannerStatus fails with a 422 error", async () => {
        const existingProvableApi: ProvableApi = {
          uuid: mockUUID,
          scannerStatus: { synced: false, percentage: 50 },
        };

        const error422 = new LedgerAPI4xx("Unprocessable Entity", {
          status: 422,
          url: undefined,
          method: "GET",
        });
        mockGetRecordScannerStatus.mockRejectedValue(error422);

        await expect(
          accessProvableApi({
            config: mockConfig,
            viewKey: mockViewKey,
            provableApi: existingProvableApi,
          }),
        ).rejects.toThrow(AleoApiConfigurationResetError);

        expect(mockGetRecordScannerStatus).toHaveBeenCalledTimes(1);
      });

      it("should throw error when getRecordScannerStatus fails with a non-422 error", async () => {
        const existingProvableApi: ProvableApi = {
          uuid: mockUUID,
          scannerStatus: { synced: false, percentage: 50 },
        };

        const networkError = new LedgerAPI5xx("Internal Server Error");
        mockGetRecordScannerStatus.mockRejectedValue(networkError);

        await expect(
          accessProvableApi({
            config: mockConfig,
            viewKey: mockViewKey,
            provableApi: existingProvableApi,
          }),
        ).rejects.toThrow(LedgerAPI5xx);
      });

      it("should preserve previous scanner status when status call returns null", async () => {
        const existingProvableApi: ProvableApi = {
          uuid: mockUUID,
          scannerStatus: { synced: false, percentage: 75 },
        };

        mockGetRecordScannerStatus.mockResolvedValue(null as any);

        const result = await accessProvableApi({
          config: mockConfig,
          viewKey: mockViewKey,
          provableApi: existingProvableApi,
        });

        expect(result?.scannerStatus).toEqual({ synced: false, percentage: 75 });
      });

      it("should initialize scanner status with defaults when provableApi is null", async () => {
        mockRegisterForScanningAccountRecords.mockResolvedValue({ uuid: mockUUID });
        mockGetRecordScannerStatus.mockResolvedValue({
          synced: false,
          percentage: 0,
          sync_start_height: 0,
          synced_up_to: 0,
        });

        const result = await accessProvableApi({
          config: mockConfig,
          viewKey: mockViewKey,
          provableApi: null,
        });

        expect(result?.scannerStatus).toEqual({ synced: false, percentage: 0 });
      });
    });
  });

  describe("enrichPrivateRecord", () => {
    const mockViewKey = "AViewKey1testviewkey";
    const mockEnrichAddress = "aleo1testowner123address456";

    it("should return null for fee_private records without making backend calls", async () => {
      const rawRecord = getMockedRecord({
        function_name: "fee_private",
        transaction_id: "tx_fee_private",
      });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
      expect(mockGetTransactionById).not.toHaveBeenCalled();
    });

    it("should return null when PUBLIC_TO_PRIVATE and sender is this address", async () => {
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
        sender: mockEnrichAddress,
        transaction_id: "tx_pub_to_priv",
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails("tx_pub_to_priv", {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [],
                outputs: [],
                program: "credits.aleo",
                function: "transfer_public_to_private",
              },
            ],
          },
        }),
      );

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionById).toHaveBeenCalledWith(mockConfig, "tx_pub_to_priv");
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
      expect(mockDecryptRecord).not.toHaveBeenCalled();
    });

    it("should return null when transition at transition_index is missing", async () => {
      const rawRecord = getMockedRecord({
        transition_index: 5,
        transaction_id: "tx_missing_transition",
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails("tx_missing_transition", {
          execution: { transitions: [] },
        }),
      );

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
      expect(mockDecryptRecord).not.toHaveBeenCalled();
    });

    it("should return null when no amount-shaped argument follows the recipient", async () => {
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        sender: mockEnrichAddress,
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [
                  { id: "in0", type: "record", tag: "record_tag_0" },
                  { id: "in1", type: "private", value: "ciphertext_recipient" },
                  { id: "in2", type: "record", tag: "record_tag_2" },
                ],
                outputs: [],
                program: "credits.aleo",
                function: "transfer_private",
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext.mockResolvedValueOnce({ plaintext: "aleo1recipientnoamount" });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).toHaveBeenCalledTimes(1);
      expect(mockDecryptRecord).not.toHaveBeenCalled();
      expect(log).toHaveBeenCalledTimes(1);
      expect(log).toHaveBeenCalledWith(
        "aleo/sync",
        `resolveTransferArguments: no recipient/amount arguments found in credits.aleo/transfer_private for tx ${rawRecord.transaction_id}`,
      );
    });

    it("should return null when PRIVATE_TO_PUBLIC and recipient is own address", async () => {
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
        sender: mockEnrichAddress,
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [
                  { id: "in0", type: "record", tag: "record_tag_0" }, // leading spent record
                  { id: "in1", type: "public", value: mockEnrichAddress }, // recipient, self
                  { id: "in2", type: "public", value: "500000u64" }, // amount
                ],
                outputs: [],
                program: "credits.aleo",
                function: "transfer_private_to_public",
              },
            ],
          },
        }),
      );

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
      expect(mockDecryptRecord).not.toHaveBeenCalled();
    });

    it("should return enriched record for PRIVATE_TO_PUBLIC with different recipient", async () => {
      const recipientAddress = "aleo1recipientaddress123";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
        sender: mockEnrichAddress,
        transition_index: 0,
      });
      const mockDetails = getMockedTransactionDetails(rawRecord.transaction_id, {
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk1",
              inputs: [
                { id: "in0", type: "record", tag: "record_tag_0" }, // leading spent record
                { id: "in1", type: "public", value: recipientAddress }, // recipient
                { id: "in2", type: "public", value: "500000u64" }, // amount
              ],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_private_to_public",
            },
          ],
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(mockDetails);

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).not.toBeNull();
      expect(result?.sender).toBe(mockEnrichAddress);
      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber(500000));
      expect(result?.rawRecord).toBe(rawRecord);
      expect(result?.details).toBe(mockDetails);
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
      expect(mockDecryptRecord).not.toHaveBeenCalled();
    });

    it("should decrypt ciphertexts and return enriched record for outgoing PRIVATE transfer", async () => {
      const recipientAddress = "aleo1privaterecipient789";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        sender: mockEnrichAddress,
        program_name: "credits.aleo",
        transition_index: 0,
      });
      const mockDetails = getMockedTransactionDetails(rawRecord.transaction_id, {
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk_private",
              inputs: [
                { id: "in0", type: "record", tag: "record_tag_0" }, // leading spent record
                { id: "in1", type: "private", value: "ciphertext_recipient" }, // recipient index = 1
                { id: "in2", type: "private", value: "ciphertext_amount" }, // amount index = 2
              ],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_private",
            },
          ],
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(mockDetails);
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "750000u64" });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).not.toBeNull();
      expect(result?.sender).toBe(mockEnrichAddress);
      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber(750000));
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).toHaveBeenCalledTimes(2);
      expect(mockDecryptRecord).not.toHaveBeenCalled();
      expect(mockDecryptCiphertext).toHaveBeenCalledWith({
        config: mockConfig,
        ciphertext: "ciphertext_recipient",
        tpk: "tpk_private",
        viewKey: mockViewKey,
        programId: rawRecord.program_name,
        functionName: rawRecord.function_name,
        outputIndex: 1,
      });
      expect(mockDecryptCiphertext).toHaveBeenCalledWith({
        config: mockConfig,
        ciphertext: "ciphertext_amount",
        tpk: "tpk_private",
        viewKey: mockViewKey,
        programId: rawRecord.program_name,
        functionName: rawRecord.function_name,
        outputIndex: 2,
      });
    });

    it("should return null when decrypted record has no microcredits field", async () => {
      const senderAddress = "aleo1senderaddress789";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        sender: senderAddress,
        record_ciphertext: "ciphertext_no_microcredits",
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [{ id: "in0", type: "private", value: "some_input" }],
                outputs: [],
                program: "credits.aleo",
                function: "transfer_private",
              },
            ],
          },
        }),
      );
      mockDecryptRecord.mockResolvedValueOnce({
        owner: mockEnrichAddress,
        data: {}, // no microcredits key
        nonce: "nonce1",
        version: 1,
      });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockDecryptRecord).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should decrypt output record and return enriched record for incoming private transfer", async () => {
      const senderAddress = "aleo1senderaddress789";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        sender: senderAddress, // sender is NOT our address
        record_ciphertext: "ciphertext_output_record",
        transition_index: 0,
      });
      const mockDetails = getMockedTransactionDetails(rawRecord.transaction_id, {
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk1",
              inputs: [{ id: "in0", type: "private", value: "some_input" }],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_private",
            },
          ],
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(mockDetails);
      mockDecryptRecord.mockResolvedValueOnce({
        owner: mockEnrichAddress,
        data: { microcredits: "300000u64" },
        nonce: "nonce1",
        version: 1,
      });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).not.toBeNull();
      expect(result?.sender).toBe(senderAddress);
      expect(result?.recipient).toBe(mockEnrichAddress);
      expect(result?.value).toEqual(new BigNumber(300000));
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockDecryptRecord).toHaveBeenCalledTimes(1);
      expect(mockDecryptRecord).toHaveBeenCalledWith({
        config: mockConfig,
        ciphertext: "ciphertext_output_record",
        viewKey: mockViewKey,
      });
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should fall back to `amount` field when decrypted record has no `microcredits`", async () => {
      const senderAddress = "aleo1senderaddress789";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        sender: senderAddress,
        record_ciphertext: "ciphertext_token_record",
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [{ id: "in0", type: "private", value: "some_input" }],
                outputs: [],
                program: "token_program.aleo",
                function: "transfer_private",
              },
            ],
          },
        }),
      );
      mockDecryptRecord.mockResolvedValueOnce({
        owner: mockEnrichAddress,
        data: { amount: "500000u128" },
        nonce: "nonce1",
        version: 1,
      });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).not.toBeNull();
      expect(result?.value).toEqual(new BigNumber(500000));
    });

    it("should trim transaction_id whitespace before fetching details", async () => {
      const rawRecord = getMockedRecord({
        transaction_id: "  tx_with_spaces  ",
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails("tx_with_spaces", {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [{ id: "in0", type: "private", value: "some_input" }],
                outputs: [],
                program: "credits.aleo",
                function: "transfer_private",
              },
            ],
          },
        }),
      );
      mockDecryptRecord.mockResolvedValueOnce({
        owner: mockEnrichAddress,
        data: { microcredits: "100000u64" },
        nonce: "nonce1",
        version: 1,
      });

      await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionById).toHaveBeenCalledWith(mockConfig, "tx_with_spaces");
      expect(mockDecryptRecord).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should decrypt with the batcher transition's program/function, not the owned record's", async () => {
      const recipientAddress = "aleo1batcherrecipient789";
      const rawRecord = getMockedRecord({
        // the record belongs to the inner token program, the transition to Ledger's batching wrapper
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        sender: mockEnrichAddress,
        program_name: "usdcx_stablecoin.aleo",
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      const mockDetails = getMockedTransactionDetails(rawRecord.transaction_id, {
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk_batcher",
              inputs: [
                { id: "in0", type: "external_record" }, // consumed record #1, no tag
                { id: "in1", type: "external_record" }, // consumed record #2, no tag
                { id: "in2", type: "private", value: "ciphertext_recipient" }, // recipient index = 2
                { id: "in3", type: "private", value: "ciphertext_amount" }, // amount index = 3
                { id: "in4", type: "private", value: "ciphertext_exclusion_proof" },
              ],
              outputs: [],
              program: "ldg_usdcx_p_28.aleo",
              function: "transfer_private_2",
            },
          ],
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(mockDetails);
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "250000u64" })
        .mockResolvedValueOnce({ plaintext: "exclusion_proof_plaintext" });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber(250000));
      expect(mockDecryptCiphertext).toHaveBeenCalledWith({
        config: mockConfig,
        ciphertext: "ciphertext_recipient",
        tpk: "tpk_batcher",
        viewKey: mockViewKey,
        programId: "ldg_usdcx_p_28.aleo",
        functionName: "transfer_private_2",
        outputIndex: 2,
      });
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({ ciphertext: "ciphertext_amount", outputIndex: 3 }),
      );
    });

    it.each(["join", "split"])(
      "should return null for a record-management transition (%s) without decrypting or logging",
      async functionName => {
        const rawRecord = getMockedRecord({
          function_name: functionName,
          sender: mockEnrichAddress,
          program_name: "usdcx_stablecoin.aleo",
          record_name: TOKEN_RECORD_NAME,
          transition_index: 0,
        });
        mockGetTransactionById.mockResolvedValueOnce(
          getMockedTransactionDetails(rawRecord.transaction_id, {
            execution: {
              transitions: [
                {
                  id: "au1",
                  scm: "s",
                  tcm: "t",
                  tpk: "tpk1",
                  inputs: [
                    { id: "in0", type: "record", tag: "record_tag_0" },
                    { id: "in1", type: "private", value: "ciphertext_split_amount" },
                  ],
                  outputs: [],
                  program: "usdcx_stablecoin.aleo",
                  function: functionName,
                },
              ],
            },
          }),
        );

        const result = await enrichPrivateRecord({
          config: mockConfig,
          rawRecord,
          address: mockEnrichAddress,
          viewKey: mockViewKey,
        });

        expect(result).toBeNull();
        expect(mockDecryptCiphertext).not.toHaveBeenCalled();
        expect(log).not.toHaveBeenCalled();
      },
    );

    it("should decrypt private-argument transfer_private_to_public (ARC-20 private flavour)", async () => {
      const recipientAddress = "aleo1arc20privflavour99";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
        sender: mockEnrichAddress,
        program_name: "btcx_8e1ed4.aleo",
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk_arc20_priv",
                inputs: [
                  { id: "in0", type: "record", tag: "record_tag_0" },
                  { id: "in1", type: "private", value: "ciphertext_recipient" },
                  { id: "in2", type: "private", value: "ciphertext_amount" },
                ],
                outputs: [],
                program: "btcx_8e1ed4.aleo",
                function: "transfer_private_to_public",
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "25000u128" });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber(25000));
    });

    it("should locate recipient/amount at indices 1/2 when the token record has one leading record input (direct ARC-20-style call)", async () => {
      const recipientAddress = "aleo1arc20explicit123";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        sender: mockEnrichAddress,
        program_name: "arc20_token.aleo",
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      const mockDetails = getMockedTransactionDetails(rawRecord.transaction_id, {
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk_arc20",
              inputs: [
                { id: "in0", type: "record", tag: "record_tag_0" }, // leading spent record
                { id: "in1", type: "private", value: "ciphertext_recipient" }, // recipient index = 1
                { id: "in2", type: "private", value: "ciphertext_amount" }, // amount index = 2
              ],
              outputs: [],
              program: "arc20_token.aleo",
              function: "transfer_private",
            },
          ],
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(mockDetails);
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "150000u64" });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber(150000));
      expect(mockDecryptCiphertext).toHaveBeenCalledTimes(2);
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({
          ciphertext: "ciphertext_recipient",
          outputIndex: 1,
        }),
      );
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({ ciphertext: "ciphertext_amount", outputIndex: 2 }),
      );
    });

    it("should locate recipient/amount after N leading external_record inputs (Ledger multi-record batcher wrapper)", async () => {
      const recipientAddress = "aleo1batcherrecipient789";
      const rawRecord = getMockedRecord({
        function_name: "transfer_private_2",
        sender: mockEnrichAddress,
        program_name: "ldg_usdcx_p_28.aleo",
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      const mockDetails = getMockedTransactionDetails(rawRecord.transaction_id, {
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk_batcher",
              inputs: [
                { id: "in0", type: "external_record" }, // consumed record #1, no tag
                { id: "in1", type: "external_record" }, // consumed record #2, no tag
                { id: "in2", type: "private", value: "ciphertext_recipient" }, // recipient index = 2
                { id: "in3", type: "private", value: "ciphertext_amount" }, // amount index = 3
                { id: "in4", type: "private", value: "ciphertext_exclusion_proof" },
              ],
              outputs: [],
              program: "ldg_usdcx_p_28.aleo",
              function: "transfer_private_2",
            },
          ],
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(mockDetails);
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "250000u64" })
        .mockRejectedValueOnce(new Error("cannot decrypt exclusion proof"));

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber(250000));
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({ ciphertext: "ciphertext_recipient", outputIndex: 2 }),
      );
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({ ciphertext: "ciphertext_amount", outputIndex: 3 }),
      );
    });

    it("should return null for a pure record-consolidation transition (join) with no recipient/amount", async () => {
      const rawRecord = getMockedRecord({
        function_name: "join",
        sender: mockEnrichAddress,
        program_name: "usdcx_stablecoin.aleo",
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [
                  { id: "in0", type: "record", tag: "record_tag_0" },
                  { id: "in1", type: "record", tag: "record_tag_1" },
                ],
                outputs: [],
                program: "usdcx_stablecoin.aleo",
                function: "join",
              },
            ],
          },
        }),
      );

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should return null without logging for a record-splitting transition (split)", async () => {
      const rawRecord = getMockedRecord({
        function_name: "split",
        sender: mockEnrichAddress,
        program_name: "usdcx_stablecoin.aleo",
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [
                  { id: "in0", type: "record", tag: "record_tag_0" },
                  { id: "in1", type: "private", value: "ciphertext_split_amount" },
                ],
                outputs: [],
                program: "usdcx_stablecoin.aleo",
                function: "split",
              },
            ],
          },
        }),
      );

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
      expect(log).not.toHaveBeenCalled();
    });

    it("should locate recipient/amount after a leading record_with_dynamic_id input (ARC-20 token)", async () => {
      const recipientAddress = "aleo1arc20dynamicid456";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        sender: mockEnrichAddress,
        program_name: "arc20_eth.aleo",
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk_arc20_dynamic",
                inputs: [
                  {
                    id: "in0",
                    type: "record_with_dynamic_id",
                    tag: "record_tag_0",
                    dynamic_id: "dynamic_id_0",
                  },
                  { id: "in1", type: "private", value: "ciphertext_recipient" },
                  { id: "in2", type: "private", value: "ciphertext_amount" },
                ],
                outputs: [],
                program: "arc20_eth.aleo",
                function: "transfer_private",
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "200000000000u128" });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber("200000000000"));
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({ ciphertext: "ciphertext_recipient", outputIndex: 1 }),
      );
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({ ciphertext: "ciphertext_amount", outputIndex: 2 }),
      );
    });

    it("should read the ARC-21 token_registry.aleo transfer_private layout (recipient, amount, record)", async () => {
      const recipientAddress = "aleo1registryrecipient321";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        sender: mockEnrichAddress,
        program_name: PROGRAM_ID.TOKEN_REGISTRY,
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk_registry",
                inputs: [
                  { id: "in0", type: "private", value: "ciphertext_recipient" },
                  { id: "in1", type: "private", value: "ciphertext_amount" },
                  { id: "in2", type: "record", tag: "record_tag_2" },
                ],
                outputs: [],
                program: PROGRAM_ID.TOKEN_REGISTRY,
                function: "transfer_private",
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "4500u128" });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber(4500));
      expect(mockDecryptCiphertext).toHaveBeenCalledTimes(2);
    });

    it("should read the mainnet ARC-20 transfer_private_to_public layout without any decryption", async () => {
      // real mainnet arc20_eth.aleo transition, tx at14yqq5na8e4j5eftaptylx6qgggvux5tz20fz6wwt0e2g9vv63sxq3khswj
      const recipientAddress = "aleo1wha60jq3fw6j3spcdm88798f8s6a5pn57xa0j3yrnl86tflevvxs7jt2y7";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
        sender: mockEnrichAddress,
        program_name: "arc20_eth.aleo",
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk_arc20_mainnet",
                inputs: [
                  {
                    id: "in0",
                    type: "record_with_dynamic_id",
                    tag: "record_tag_0",
                    dynamic_id:
                      "5187684512444170691509259038386389946045003282669141330013325607829823143029field",
                  },
                  { id: "in1", type: "public", value: recipientAddress },
                  { id: "in2", type: "public", value: "489473792514000772u128" },
                ],
                outputs: [],
                program: "arc20_eth.aleo",
                function: "transfer_private_to_public",
              },
            ],
          },
        }),
      );

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber("489473792514000772"));
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should skip a leading token_id ciphertext before the recipient ciphertext", async () => {
      const recipientAddress = "aleo1wrappedarc20recipient";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        sender: mockEnrichAddress,
        program_name: "arc20_wrapper.aleo",
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk_wrapper",
                inputs: [
                  { id: "in0", type: "private", value: "ciphertext_token_id" },
                  { id: "in1", type: "record_dynamic" },
                  { id: "in2", type: "private", value: "ciphertext_recipient" },
                  { id: "in3", type: "private", value: "ciphertext_amount" },
                ],
                outputs: [],
                program: "arc20_wrapper.aleo",
                function: "transfer_private_1",
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: "1751493913335802797273486270field" })
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "900u128" });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber(900));
      expect(mockDecryptCiphertext).toHaveBeenCalledTimes(3);
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({ ciphertext: "ciphertext_recipient", outputIndex: 2 }),
      );
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({ ciphertext: "ciphertext_amount", outputIndex: 3 }),
      );
    });

    it("should ignore the trailing merkle proof argument (real ARC-22 layout)", async () => {
      const recipientAddress = "aleo1arc22recipient777";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        sender: mockEnrichAddress,
        program_name: "test_usad_stablecoin.aleo",
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk_arc22",
                inputs: [
                  { id: "in0", type: "private", value: "ciphertext_recipient" },
                  { id: "in1", type: "private", value: "ciphertext_amount" },
                  { id: "in2", type: "record", tag: "record_tag_2" },
                  { id: "in3", type: "private", value: "ciphertext_merkle_proof" },
                ],
                outputs: [],
                program: "test_usad_stablecoin.aleo",
                function: "transfer_private",
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "1u128" })
        .mockResolvedValueOnce({ plaintext: "{ siblings: [ 123field, 456field ] }" });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber(1));
      expect(mockDecryptCiphertext).toHaveBeenCalledTimes(3);
    });

    it("should decrypt private-argument transfer_private_to_public (ARC-20 private flavour)", async () => {
      const recipientAddress = "aleo1arc20privflavour99";
      const rawRecord = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
        sender: mockEnrichAddress,
        program_name: "btcx_8e1ed4.aleo",
        record_name: TOKEN_RECORD_NAME,
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(rawRecord.transaction_id, {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk_arc20_priv",
                inputs: [
                  { id: "in0", type: "record", tag: "record_tag_0" },
                  { id: "in1", type: "private", value: "ciphertext_recipient" },
                  { id: "in2", type: "private", value: "ciphertext_amount" },
                ],
                outputs: [],
                program: "btcx_8e1ed4.aleo",
                function: "transfer_private_to_public",
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "25000u128" });

      const result = await enrichPrivateRecord({
        config: mockConfig,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result?.recipient).toBe(recipientAddress);
      expect(result?.value).toEqual(new BigNumber(25000));
    });
  });

  describe("enrichPrivateRecords", () => {
    const mockViewKey = "AViewKey1testviewkey";
    // fee_private records short-circuit before any backend call, keeping these tests network-free
    const feeRecords = (count: number) =>
      Array.from({ length: count }, (_, index) =>
        getMockedRecord({
          function_name: EXPLORER_TRANSFER_TYPES.FEE_PRIVATE,
          transaction_id: `tx${index}`,
        }),
      );

    it("should return one entry per record, in order", async () => {
      const records = feeRecords(3);

      const result = await enrichPrivateRecords({
        config: mockConfig,
        viewKey: mockViewKey,
        address: mockAddress,
        records,
      });

      expect(result).toEqual([null, null, null]);
    });

    it("should return an empty array for no records", async () => {
      const result = await enrichPrivateRecords({
        config: mockConfig,
        viewKey: mockViewKey,
        address: mockAddress,
        records: [],
      });

      expect(result).toEqual([]);
    });

    it("should report progress once per record with a stable total", async () => {
      const onProgress = jest.fn();

      await enrichPrivateRecords({
        config: mockConfig,
        viewKey: mockViewKey,
        address: mockAddress,
        records: feeRecords(2),
        onProgress,
      });

      expect(onProgress.mock.calls).toEqual([
        [1, 2],
        [2, 2],
      ]);
    });

    it("should throw AbortError when the signal is already aborted", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        enrichPrivateRecords({
          config: mockConfig,
          viewKey: mockViewKey,
          address: mockAddress,
          records: feeRecords(1),
          signal: controller.signal,
        }),
      ).rejects.toMatchObject({ name: "AbortError" });
    });
  });
  describe("patchPublicOperations", () => {
    const patchAddress = "aleo1patchowner123";
    const ledgerAccountId = "js:2:aleo:aleo1patchowner123::AViewKey123";
    const patchViewKey = "AViewKey1testviewkey";

    it("should pass fully public operations through unchanged", async () => {
      const publicOp = getMockedOperation({
        id: "pub_op",
        hash: "at1pub",
        extra: { functionId: "transfer_public", transactionType: "public" },
      });

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [publicOp],
        privateRecords: [],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(publicOp);
      expect(mockGetTransactionById).not.toHaveBeenCalled();
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should patch PUBLIC_TO_PRIVATE op and create clone when matching private record exists", async () => {
      const txHash = "at1match_pub_to_priv";
      const senderAddress = "aleo1original_sender";
      const publicOp = getMockedOperation({
        id: "pub_to_priv_op",
        hash: txHash,
        type: "OUT",
        date: new Date("2024-01-01T00:00:00.000Z"),
        extra: { functionId: "transfer_public_to_private", transactionType: "public" },
      });
      const matchingRecord = getMockedRecord({
        transaction_id: txHash,
        sender: senderAddress,
        function_name: "transfer_public_to_private",
      });

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [publicOp],
        privateRecords: [matchingRecord],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "pub_to_priv_op",
            type: "OUT",
            senders: [senderAddress],
            recipients: [patchAddress],
            extra: expect.objectContaining({ patched: true }),
          }),
          expect.objectContaining({
            type: "IN",
            senders: [patchAddress],
            recipients: [patchAddress],
            extra: expect.objectContaining({ patched: true }),
          }),
        ]),
      );
      expect(mockGetTransactionById).not.toHaveBeenCalled();
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should patch PRIVATE_TO_PUBLIC op and create clone when matching private record exists", async () => {
      const txHash = "at1match_priv_to_pub";
      const senderAddress = "aleo1priv_sender";
      const publicOp = getMockedOperation({
        id: "priv_to_pub_op",
        hash: txHash,
        type: "IN",
        date: new Date("2024-02-01T00:00:00.000Z"),
        extra: { functionId: "transfer_private_to_public", transactionType: "public" },
      });
      const matchingRecord = getMockedRecord({
        transaction_id: txHash,
        sender: senderAddress,
        function_name: "transfer_private_to_public",
      });

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [publicOp],
        privateRecords: [matchingRecord],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      expect(result).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: "priv_to_pub_op",
            type: "IN",
            senders: [senderAddress],
            recipients: [patchAddress],
            extra: expect.objectContaining({ patched: true }),
          }),
          expect.objectContaining({
            type: "OUT",
            senders: [patchAddress],
            recipients: [patchAddress],
            extra: expect.objectContaining({ patched: true }),
          }),
        ]),
      );
    });

    it("should skip the leading token_id when decrypting a token_registry.aleo recipient", async () => {
      // real mainnet token_registry.aleo transition, tx at1zlma4d7xdhaxnrv2hhnc6arpp959sj29y66vvhcsk50mrfsrm5gqmmpt2z
      const txHash = "at1zlma4d7xdhaxnrv2hhnc6arpp959sj29y66vvhcsk50mrfsrm5gqmmpt2z";
      const tokenId =
        "6088188135219746443092391282916151282477828391085949070550825603498725268775field";
      const publicOp = getMockedOperation({
        hash: txHash,
        type: "OUT",
        extra: {
          functionId: "transfer_public_to_private",
          transactionType: "public",
          programId: PROGRAM_ID.TOKEN_REGISTRY,
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(txHash, {
          block_height: 21152368,
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk_registry_mainnet",
                inputs: [
                  { id: "in0", type: "public", value: tokenId },
                  { id: "in1", type: "private", value: "ciphertext_recipient" },
                  { id: "in2", type: "public", value: "730000u128" },
                  { id: "in3", type: "public", value: "false" },
                ],
                outputs: [],
                program: PROGRAM_ID.TOKEN_REGISTRY,
                function: "transfer_public_to_private",
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext.mockResolvedValueOnce({ plaintext: "aleo1registrytokenrecipient" });

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [publicOp],
        privateRecords: [],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      expect(result).toEqual([
        expect.objectContaining({ recipients: ["aleo1registrytokenrecipient"] }),
      ]);
      expect(mockDecryptCiphertext).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({ ciphertext: "ciphertext_recipient", outputIndex: 1 }),
      );
    });

    it("should give cloned operation a date 1ms after the original", async () => {
      const txHash = "at1clone_date";
      const opDate = new Date("2024-05-01T12:00:00.000Z");
      const publicOp = getMockedOperation({
        hash: txHash,
        type: "OUT",
        date: opDate,
        extra: { functionId: "transfer_public_to_private", transactionType: "public" },
      });
      const matchingRecord = getMockedRecord({
        transaction_id: txHash,
        function_name: "transfer_public_to_private",
      });

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [publicOp],
        privateRecords: [matchingRecord],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      const clone = result.find(op => op.type === "IN");

      expect(clone?.date.getTime()).toBe(opDate.getTime() + 1);
    });

    it("should not match fee_private records", async () => {
      const txHash = "at1fee";
      const publicOp = getMockedOperation({
        hash: txHash,
        type: "OUT",
        extra: { functionId: "transfer_public_to_private", transactionType: "public" },
      });
      const feeRecord = getMockedRecord({
        transaction_id: txHash,
        function_name: "fee_private", // should be excluded
        block_height: 200,
      });
      const mockDetails = getMockedTransactionDetails(txHash, {
        block_height: 100,
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk_fee",
              inputs: [
                { id: "in0", type: "private", value: "cipher_recipient" },
                { id: "in1", type: "public", value: "40000u64" },
              ],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_public_to_private",
            },
          ],
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(mockDetails);
      mockDecryptCiphertext.mockResolvedValueOnce({ plaintext: "aleo1decrypted_recipient" });

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [publicOp],
        privateRecords: [feeRecord],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      expect(result).toEqual([
        expect.objectContaining({
          recipients: ["aleo1decrypted_recipient"],
          extra: expect.objectContaining({ patched: true }),
        }),
      ]);
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).toHaveBeenCalledTimes(1);
    });

    it("should decrypt recipient for PUBLIC_TO_PRIVATE and not mark as patched when scanner hasn't reached the block", async () => {
      const txHash = "at1no_match";
      const publicOp = getMockedOperation({
        hash: txHash,
        type: "OUT",
        extra: { functionId: "transfer_public_to_private", transactionType: "public" },
      });
      const mockDetails = getMockedTransactionDetails(txHash, {
        block_height: 100,
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk1",
              inputs: [
                { id: "in0", type: "private", value: "cipher_addr" },
                { id: "in1", type: "public", value: "40000u64" },
              ],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_public_to_private",
            },
          ],
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(mockDetails);
      mockDecryptCiphertext.mockResolvedValueOnce({ plaintext: "aleo1external_recipient" });

      // no private records -> latestScannedBlockHeight = 0, which is less than tx block 100
      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [publicOp],
        privateRecords: [],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      expect(result).toEqual([
        expect.objectContaining({
          recipients: ["aleo1external_recipient"],
          extra: expect.not.objectContaining({ patched: true }),
        }),
      ]);
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionById).toHaveBeenCalledWith(mockConfig, txHash);
      expect(mockDecryptCiphertext).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({
          ciphertext: "cipher_addr",
          tpk: "tpk1",
          viewKey: patchViewKey,
          programId: "credits.aleo",
          functionName: "transfer_public_to_private",
          outputIndex: 0,
        }),
      );
    });

    it("should decrypt recipient for PUBLIC_TO_PRIVATE and mark as patched when scanner has passed the block", async () => {
      const txHash = "at1no_match_synced";
      const publicOp = getMockedOperation({
        hash: txHash,
        type: "OUT",
        extra: { functionId: "transfer_public_to_private", transactionType: "public" },
      });
      const mockDetails = getMockedTransactionDetails(txHash, {
        block_height: 100,
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk1",
              inputs: [
                { id: "in0", type: "private", value: "cipher_addr" },
                { id: "in1", type: "public", value: "40000u64" },
              ],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_public_to_private",
            },
          ],
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(mockDetails);
      mockDecryptCiphertext.mockResolvedValueOnce({ plaintext: "aleo1external_recipient" });

      // fee_private record at block 200 acts as scanner watermark - scanner has definitely passed block 100
      const scannerWatermarkRecord = getMockedRecord({
        transaction_id: "at1other",
        function_name: "fee_private",
        block_height: 200,
      });

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [publicOp],
        privateRecords: [scannerWatermarkRecord],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      expect(result).toEqual([
        expect.objectContaining({
          recipients: ["aleo1external_recipient"],
          extra: expect.objectContaining({ patched: true }),
        }),
      ]);
    });

    it("should skip already patched operations without making backend calls", async () => {
      const patchedOp = getMockedOperation({
        id: "already_patched_op",
        hash: "at1already_patched",
        type: "OUT",
        extra: {
          functionId: "transfer_public_to_private",
          transactionType: "public",
          patched: true,
        },
      });

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [patchedOp],
        privateRecords: [],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      expect(result).toEqual([patchedOp]);
      expect(mockGetTransactionById).not.toHaveBeenCalled();
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should pass PUBLIC_TO_PRIVATE operation through unchanged when recipient input has no value field (record type)", async () => {
      const txHash = "at1record_type_input";
      const publicOp = getMockedOperation({
        hash: txHash,
        type: "OUT",
        extra: { functionId: "transfer_public_to_private", transactionType: "public" },
      });
      const mockDetails = getMockedTransactionDetails(txHash, {
        block_height: 100,
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk1",
              inputs: [{ id: "in0", type: "record", tag: "some_record_tag" }],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_public_to_private",
            },
          ],
        },
      });

      mockGetTransactionById.mockResolvedValueOnce(mockDetails);

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [publicOp],
        privateRecords: [],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      expect(result).toEqual([publicOp]);
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should pass PRIVATE_TO_PUBLIC through as-is when no matching private record", async () => {
      const txHash = "at1priv_to_pub_no_match";
      const publicOp = getMockedOperation({
        id: "priv_to_pub_no_match",
        hash: txHash,
        type: "IN",
        extra: {
          functionId: "transfer_private_to_public",
          transactionType: "public",
        },
      });
      const mockDetails = getMockedTransactionDetails(txHash, {
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk1",
              inputs: [],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_private_to_public",
            },
          ],
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(mockDetails);

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [publicOp],
        privateRecords: [],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      expect(result).toEqual([publicOp]);
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should rethrow when decryptCiphertext throws a non-4xx error", async () => {
      const txHash = "at1decrypt_5xx";
      const publicOp = getMockedOperation({
        hash: txHash,
        type: "OUT",
        extra: { functionId: "transfer_public_to_private", transactionType: "public" },
      });
      const mockDetails = getMockedTransactionDetails(txHash, {
        execution: {
          transitions: [
            {
              id: "au1",
              scm: "s",
              tcm: "t",
              tpk: "tpk1",
              inputs: [
                { id: "in0", type: "private", value: "cipher_addr" },
                { id: "in1", type: "public", value: "40000u64" },
              ],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_public_to_private",
            },
          ],
        },
      });
      mockGetTransactionById.mockResolvedValueOnce(mockDetails);
      mockDecryptCiphertext.mockRejectedValueOnce(new LedgerAPI5xx("Internal Server Error"));

      await expect(
        patchPublicOperations({
          config: mockConfig,
          publicOperations: [publicOp],
          privateRecords: [],
          address: patchAddress,
          ledgerAccountId,
          viewKey: patchViewKey,
        }),
      ).rejects.toThrow(LedgerAPI5xx);
    });

    it("should match private record by trimmed transaction_id", async () => {
      const txHash = "at1trim_match";
      const publicOp = getMockedOperation({
        hash: txHash,
        type: "OUT",
        extra: { functionId: "transfer_public_to_private", transactionType: "public" },
      });
      const recordWithSpaces = getMockedRecord({
        transaction_id: `  ${txHash}  `,
        sender: "aleo1trim_sender",
        function_name: "transfer_public_to_private",
      });

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [publicOp],
        privateRecords: [recordWithSpaces],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      // matched via trim → 2 ops (original patch + clone), no decrypt call
      expect(result).toHaveLength(2);
      expect(mockGetTransactionById).not.toHaveBeenCalled();
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should handle mix of public and semi-public operations correctly", async () => {
      const fullyPublicOp = getMockedOperation({
        id: "fully_pub",
        hash: "at1full_pub",
        extra: { functionId: "transfer_public", transactionType: "public" },
      });
      const semiPublicOp = getMockedOperation({
        id: "semi_pub",
        hash: "at1semi",
        type: "OUT",
        extra: { functionId: "transfer_public_to_private", transactionType: "public" },
      });
      const matchingRecord = getMockedRecord({
        transaction_id: "at1semi",
        sender: "aleo1semi_sender",
        function_name: "transfer_public_to_private",
      });

      const result = await patchPublicOperations({
        config: mockConfig,
        publicOperations: [fullyPublicOp, semiPublicOp],
        privateRecords: [matchingRecord],
        address: patchAddress,
        ledgerAccountId,
        viewKey: patchViewKey,
      });

      // 1 fully public + 2 from semi-public (original + clone)
      expect(result).toHaveLength(3);
      expect(result).toEqual(
        expect.arrayContaining([expect.objectContaining({ id: "fully_pub" })]),
      );
    });
  });

  describe("fetchTransitionPage", () => {
    const mockGetAccountPublicTransactions = jest.mocked(apiClient.getAccountPublicTransactions);

    const row = (blockNumber: number, transitionId: string) =>
      getMockedPublicTransaction({ block_number: blockNumber, transition_id: transitionId });

    it("should defer the block the page stops inside and resume from an exact row", async () => {
      // Mirrors mainnet block 20413950: 4 transitions of one transaction, page cut after the 2nd.
      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [row(100, "au1a"), row(101, "au1b"), row(101, "au1c")],
        next_cursor: { block_number: 101, transition_id: "au1c" },
      });

      const result = await fetchTransitionPage({
        config: mockConfig,
        address: mockAddress,
        limit: 3,
      });

      expect(result.transitions.map(tx => tx.transition_id)).toEqual(["au1a"]);
      expect(result.next).toEqual({ blockNumber: 100, transitionId: "au1a" });
    });

    it("should keep paging when the whole page sits in one block", async () => {
      mockGetAccountPublicTransactions
        .mockResolvedValueOnce({
          address: mockAddress,
          transactions: [row(100, "au1a"), row(100, "au1b")],
          next_cursor: { block_number: 100, transition_id: "au1b" },
        })
        .mockResolvedValueOnce({
          address: mockAddress,
          transactions: [row(100, "au1c"), row(102, "au1d")],
          next_cursor: { block_number: 102, transition_id: "au1d" },
        });

      const result = await fetchTransitionPage({
        config: mockConfig,
        address: mockAddress,
        limit: 2,
      });

      expect(mockGetAccountPublicTransactions).toHaveBeenCalledTimes(2);
      // block 100 is now whole, block 102 is the new open block
      expect(result.transitions.map(tx => tx.transition_id)).toEqual(["au1a", "au1b", "au1c"]);
      expect(result.next).toEqual({ blockNumber: 100, transitionId: "au1c" });
    });

    it("should resume the second page from the transition id, not the block alone", async () => {
      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [row(101, "au1c")],
      });

      await fetchTransitionPage({
        config: mockConfig,
        address: mockAddress,
        cursor: { blockNumber: 100, transitionId: "au1a" },
      });

      expect(mockGetAccountPublicTransactions).toHaveBeenCalledTimes(1);
      expect(mockGetAccountPublicTransactions).toHaveBeenCalledWith({
        config: mockConfig,
        address: mockAddress,
        order: "asc",
        cursor: { blockNumber: 100, transitionId: "au1a" },
      });
    });

    it("should return next null once the stream is exhausted", async () => {
      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [row(100, "au1a"), row(100, "au1b")],
      });

      const result = await fetchTransitionPage({ config: mockConfig, address: mockAddress });

      expect(result.transitions).toHaveLength(2);
      expect(result.next).toBeNull();
    });

    it("should treat an empty page as exhausted", async () => {
      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [],
        next_cursor: { block_number: 100, transition_id: "au1a" },
      });

      const result = await fetchTransitionPage({ config: mockConfig, address: mockAddress });

      expect(result).toEqual({ transitions: [], next: null });
    });

    it("should drop batcher outer call transitions", async () => {
      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [
          getMockedPublicTransaction({
            block_number: 100,
            transition_id: "au1inner",
            function_id: "transfer_private_to_public",
            sender_address: "",
            recipient_address: "",
          }),
          row(100, "au1real"),
        ],
      });

      const result = await fetchTransitionPage({ config: mockConfig, address: mockAddress });

      expect(result.transitions.map(tx => tx.transition_id)).toEqual(["au1real"]);
    });
  });

  describe("fetchAllOwnedRecords", () => {
    const mockUUID = "uuid-abc-def";
    const mockGetAccountOwnedRecords = jest.mocked(apiClient.getAccountOwnedRecords);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return all records when they fit in a single page", async () => {
      const records = [getMockedRecord({ tag: "tag1" }), getMockedRecord({ tag: "tag2" })];
      mockGetAccountOwnedRecords.mockResolvedValueOnce(records);

      const result = await fetchAllOwnedRecords({
        config: mockConfig,
        uuid: mockUUID,
      });

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(1);
      expect(mockGetAccountOwnedRecords).toHaveBeenCalledWith({
        config: mockConfig,
        uuid: mockUUID,
        resultsPerPage: DEFAULT_RECORDS_PAGE_SIZE,
        page: 0,
        programs: [PROGRAM_ID.CREDITS],
        functions: [
          EXPLORER_TRANSFER_TYPES.PRIVATE,
          EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
          EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
          EXPLORER_TRANSFER_TYPES.FEE_PRIVATE,
        ],
      });
      expect(result).toEqual(records);
    });

    it("should iterate multiple pages until a page with fewer records than resultsPerPage is returned", async () => {
      const pageSize = 2;
      const page0 = [getMockedRecord({ tag: "t0a" }), getMockedRecord({ tag: "t0b" })];
      const page1 = [getMockedRecord({ tag: "t1a" })]; // fewer than pageSize → last page
      mockGetAccountOwnedRecords.mockResolvedValueOnce(page0).mockResolvedValueOnce(page1);

      const result = await fetchAllOwnedRecords({
        config: mockConfig,
        uuid: mockUUID,
        resultsPerPage: pageSize,
      });

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(2);
      expect(mockGetAccountOwnedRecords).toHaveBeenNthCalledWith(1, {
        config: mockConfig,
        uuid: mockUUID,
        resultsPerPage: pageSize,
        page: 0,
        programs: [PROGRAM_ID.CREDITS],
        functions: [
          EXPLORER_TRANSFER_TYPES.PRIVATE,
          EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
          EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
          EXPLORER_TRANSFER_TYPES.FEE_PRIVATE,
        ],
      });
      expect(mockGetAccountOwnedRecords).toHaveBeenNthCalledWith(2, {
        config: mockConfig,
        uuid: mockUUID,
        resultsPerPage: pageSize,
        page: 1,
        programs: [PROGRAM_ID.CREDITS],
        functions: [
          EXPLORER_TRANSFER_TYPES.PRIVATE,
          EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
          EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
          EXPLORER_TRANSFER_TYPES.FEE_PRIVATE,
        ],
      });
      expect(result).toEqual([...page0, ...page1]);
    });

    it("should forward the block-height bounds on every page", async () => {
      const pageSize = 1;
      mockGetAccountOwnedRecords
        .mockResolvedValueOnce([getMockedRecord({ tag: "t0" })])
        .mockResolvedValueOnce([]);

      await fetchAllOwnedRecords({
        config: mockConfig,
        uuid: mockUUID,
        start: 100,
        end: 200,
        resultsPerPage: pageSize,
      });

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(2);
      expect(mockGetAccountOwnedRecords).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ start: 100, end: 200, page: 0 }),
      );
      expect(mockGetAccountOwnedRecords).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ start: 100, end: 200, page: 1 }),
      );
    });

    it("should stop immediately when the first page is empty", async () => {
      mockGetAccountOwnedRecords.mockResolvedValueOnce([]);

      const result = await fetchAllOwnedRecords({
        config: mockConfig,
        uuid: mockUUID,
      });

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(1);
      expect(result).toEqual([]);
    });

    it("should pass `unspent` flag to each page request when provided", async () => {
      const records = [getMockedRecord({ tag: "u1" })];
      mockGetAccountOwnedRecords.mockResolvedValueOnce(records);

      await fetchAllOwnedRecords({
        config: mockConfig,
        uuid: mockUUID,
        unspent: true,
      });

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(1);
      expect(mockGetAccountOwnedRecords).toHaveBeenCalledWith(
        expect.objectContaining({ unspent: true }),
      );
    });

    it("should pass `start` to each page request when provided", async () => {
      const records = [getMockedRecord({ tag: "s1" })];
      mockGetAccountOwnedRecords.mockResolvedValueOnce(records);

      await fetchAllOwnedRecords({
        config: mockConfig,
        uuid: mockUUID,
        start: 5000,
      });

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(1);
      expect(mockGetAccountOwnedRecords).toHaveBeenCalledWith(
        expect.objectContaining({ start: 5000 }),
      );
    });

    it("should not pass `unspent` when it is not provided", async () => {
      mockGetAccountOwnedRecords.mockResolvedValueOnce([]);

      await fetchAllOwnedRecords({
        config: mockConfig,
        uuid: mockUUID,
      });

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(1);
      expect(mockGetAccountOwnedRecords).toHaveBeenCalledWith(
        expect.not.objectContaining({ unspent: expect.anything() }),
      );
    });

    it("should not pass `start` when it is not provided", async () => {
      mockGetAccountOwnedRecords.mockResolvedValueOnce([]);

      await fetchAllOwnedRecords({
        config: mockConfig,
        uuid: mockUUID,
      });

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(1);
      expect(mockGetAccountOwnedRecords).toHaveBeenCalledWith(
        expect.not.objectContaining({ start: expect.anything() }),
      );
    });

    it("should accumulate records across three full pages and stop after a partial page", async () => {
      const pageSize = 2;
      const page0 = [getMockedRecord({ tag: "a" }), getMockedRecord({ tag: "b" })];
      const page1 = [getMockedRecord({ tag: "c" }), getMockedRecord({ tag: "d" })];
      const page2 = [getMockedRecord({ tag: "e" })]; // partial → done
      mockGetAccountOwnedRecords
        .mockResolvedValueOnce(page0)
        .mockResolvedValueOnce(page1)
        .mockResolvedValueOnce(page2);

      const result = await fetchAllOwnedRecords({
        config: mockConfig,
        uuid: mockUUID,
        resultsPerPage: pageSize,
      });

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(3);
      expect(result).toHaveLength(5);
      expect(result).toEqual([...page0, ...page1, ...page2]);
    });

    it("should always pass programs: [PROGRAM_ID.CREDITS] to every page request", async () => {
      const pageSize = 2;
      const page0 = [getMockedRecord({ tag: "a" }), getMockedRecord({ tag: "b" })];
      const page1 = [getMockedRecord({ tag: "c" })];
      mockGetAccountOwnedRecords.mockResolvedValueOnce(page0).mockResolvedValueOnce(page1);

      await fetchAllOwnedRecords({
        config: mockConfig,
        uuid: mockUUID,
        resultsPerPage: pageSize,
      });

      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(2);
      expect(mockGetAccountOwnedRecords).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ programs: [PROGRAM_ID.CREDITS] }),
      );
      expect(mockGetAccountOwnedRecords).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ programs: [PROGRAM_ID.CREDITS] }),
      );
    });

    it("should always pass the correct functions filter to every page request", async () => {
      const pageSize = 2;
      const page0 = [getMockedRecord({ tag: "a" }), getMockedRecord({ tag: "b" })];
      const page1 = [getMockedRecord({ tag: "c" })];
      mockGetAccountOwnedRecords.mockResolvedValueOnce(page0).mockResolvedValueOnce(page1);

      await fetchAllOwnedRecords({
        config: mockConfig,
        uuid: mockUUID,
        resultsPerPage: pageSize,
      });

      const expectedFunctions = [
        EXPLORER_TRANSFER_TYPES.PRIVATE,
        EXPLORER_TRANSFER_TYPES.PUBLIC_TO_PRIVATE,
        EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
        EXPLORER_TRANSFER_TYPES.FEE_PRIVATE,
      ];
      expect(mockGetAccountOwnedRecords).toHaveBeenCalledTimes(2);
      expect(mockGetAccountOwnedRecords).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ functions: expectedFunctions }),
      );
      expect(mockGetAccountOwnedRecords).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ functions: expectedFunctions }),
      );
    });

    it("should propagate errors thrown by the underlying API call", async () => {
      mockGetAccountOwnedRecords.mockRejectedValueOnce(new Error("Scanner unavailable"));

      await expect(
        fetchAllOwnedRecords({
          config: mockConfig,
          uuid: mockUUID,
        }),
      ).rejects.toThrow("Scanner unavailable");
    });

    it("should throw AbortError when signal is aborted before the first page request", async () => {
      const controller = new AbortController();
      controller.abort();

      await expect(
        fetchAllOwnedRecords({
          config: mockConfig,
          uuid: mockUUID,
          signal: controller.signal,
        }),
      ).rejects.toMatchObject({ name: "AbortError" });

      expect(mockGetAccountOwnedRecords).not.toHaveBeenCalled();
    });
  });

  describe("fetchAllTokens", () => {
    const mockGetTokens = jest.mocked(apiClient.getTokens);

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return every token when they fit in a single page", async () => {
      const tokenA = getMockedTokenDetails({ program_name: "token_a.aleo" });
      const tokenB = getMockedTokenDetails({ program_name: "token_b.aleo" });
      mockGetTokens.mockResolvedValueOnce(
        getMockedGetTokensResponse({
          data: [tokenA, tokenB],
          pagination: {
            limit: 100,
            offset: 0,
            total_count: 2,
            has_next: false,
            has_previous: false,
          },
        }),
      );

      const result = await fetchAllTokens({ config: mockConfig });

      expect(mockGetTokens).toHaveBeenCalledTimes(1);
      expect(mockGetTokens).toHaveBeenCalledWith({
        config: mockConfig,
        options: { limit: DEFAULT_TOKENS_PAGE_SIZE, offset: 0 },
      });
      expect(result).toEqual([tokenA, tokenB]);
    });

    it("should paginate using offset until has_next is false", async () => {
      const pageSize = 2;
      const tokenA = getMockedTokenDetails({ program_name: "token_a.aleo" });
      const tokenB = getMockedTokenDetails({ program_name: "token_b.aleo" });
      const tokenC = getMockedTokenDetails({ program_name: "token_c.aleo" });
      mockGetTokens
        .mockResolvedValueOnce(
          getMockedGetTokensResponse({
            data: [tokenA, tokenB],
            pagination: {
              limit: pageSize,
              offset: 0,
              total_count: 3,
              has_next: true,
              has_previous: false,
            },
          }),
        )
        .mockResolvedValueOnce(
          getMockedGetTokensResponse({
            data: [tokenC],
            pagination: {
              limit: pageSize,
              offset: pageSize,
              total_count: 3,
              has_next: false,
              has_previous: true,
            },
          }),
        );

      const result = await fetchAllTokens({ config: mockConfig, resultsPerPage: pageSize });

      expect(mockGetTokens).toHaveBeenCalledTimes(2);
      expect(mockGetTokens).toHaveBeenNthCalledWith(1, {
        config: mockConfig,
        options: { limit: pageSize, offset: 0 },
      });
      expect(mockGetTokens).toHaveBeenNthCalledWith(2, {
        config: mockConfig,
        options: { limit: pageSize, offset: pageSize },
      });
      expect(result).toEqual([tokenA, tokenB, tokenC]);
    });

    it("should return an empty array when the registry has no tokens", async () => {
      mockGetTokens.mockResolvedValueOnce(getMockedGetTokensResponse({ data: [] }));

      const result = await fetchAllTokens({ config: mockConfig });

      expect(result).toEqual([]);
    });

    it("should propagate errors thrown by the underlying API call", async () => {
      mockGetTokens.mockRejectedValueOnce(new Error("Tokens endpoint unavailable"));

      await expect(fetchAllTokens({ config: mockConfig })).rejects.toThrow(
        "Tokens endpoint unavailable",
      );
    });
  });

  describe("sumUnspentRecords", () => {
    const mockViewKey = "AViewKey1sumtest";

    it("returns zero without calling decryptRecord when there are no records", async () => {
      const result = await sumUnspentRecords({
        config: mockConfig,
        viewKey: mockViewKey,
        records: [],
      });

      expect(result.toFixed(0)).toBe("0");
      expect(mockDecryptRecord).not.toHaveBeenCalled();
    });

    it("sums the decrypted amount of every unspent record", async () => {
      const records = [
        getMockedRecord({ commitment: "a", record_ciphertext: "cipher-a" }),
        getMockedRecord({ commitment: "b", record_ciphertext: "cipher-b" }),
      ];
      mockDecryptRecord
        .mockResolvedValueOnce(
          getMockedDecryptedRecord({ data: { microcredits: "100u64.private" } }),
        )
        .mockResolvedValueOnce(
          getMockedDecryptedRecord({ data: { microcredits: "250u64.private" } }),
        );

      const result = await sumUnspentRecords({
        config: mockConfig,
        viewKey: mockViewKey,
        records,
      });

      expect(result.toFixed(0)).toBe("350");
    });

    it("excludes records scanned past maxBlockHeight", async () => {
      const records = [
        getMockedRecord({ commitment: "eligible", block_height: 100 }),
        getMockedRecord({ commitment: "over-height", block_height: 101 }),
      ];
      mockDecryptRecord.mockResolvedValue(
        getMockedDecryptedRecord({ data: { microcredits: "100u64.private" } }),
      );

      const result = await sumUnspentRecords({
        config: mockConfig,
        viewKey: mockViewKey,
        records,
        maxBlockHeight: 100,
      });

      expect(result.toFixed(0)).toBe("100");
      expect(mockDecryptRecord).toHaveBeenCalledTimes(1);
    });

    it("sums every record when maxBlockHeight is omitted", async () => {
      const records = [
        getMockedRecord({ commitment: "a", block_height: 100 }),
        getMockedRecord({ commitment: "b", block_height: 1_000_000 }),
      ];
      mockDecryptRecord.mockResolvedValue(
        getMockedDecryptedRecord({ data: { microcredits: "50u64.private" } }),
      );

      const result = await sumUnspentRecords({
        config: mockConfig,
        viewKey: mockViewKey,
        records,
      });

      expect(result.toFixed(0)).toBe("100");
      expect(mockDecryptRecord).toHaveBeenCalledTimes(2);
    });
  });

  describe("getTokenOutDetails", () => {
    const mockViewKey = "AViewKey1testviewkey";

    it("should return null amount and recipient when transition is missing", async () => {
      const record = getMockedRecord({
        transaction_id: "tx_missing_transition",
        transition_index: 5,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails("tx_missing_transition", {
          fee_value: 12345,
          execution: { transitions: [] },
        }),
      );

      const result = await getTokenOutDetails({
        config: mockConfig,
        record,
        viewKey: mockViewKey,
      });

      expect(result).toEqual({
        amount: null,
        recipient: null,
        fee: new BigNumber(12345),
      });
      expect(mockGetTransactionById).toHaveBeenCalledWith(mockConfig, "tx_missing_transition");
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should read plaintext amount and recipient for PRIVATE_TO_PUBLIC transfers", async () => {
      const recipientAddress = "aleo1tokenrecipient123456";
      const record = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
        transaction_id: "tx_priv_to_pub",
        transition_index: 0,
        program_name: "token_program.aleo",
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails("tx_priv_to_pub", {
          fee_value: 5000,
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [
                  { id: "in0", type: "public", value: recipientAddress },
                  { id: "in1", type: "public", value: "750000u128.public" },
                  { id: "in2", type: "record", tag: "record_tag_2" },
                  { id: "in3", type: "private", value: "ciphertext_merkle_proof" },
                ],
                outputs: [],
                program: "token_program.aleo",
                function: "transfer_private_to_public",
              },
            ],
          },
        }),
      );

      const result = await getTokenOutDetails({
        config: mockConfig,
        record,
        viewKey: mockViewKey,
      });

      expect(result).toEqual({
        amount: new BigNumber(750000),
        recipient: recipientAddress,
        fee: new BigNumber(5000),
      });
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should return null fields when no amount-shaped argument follows the recipient", async () => {
      const recipientAddress = "aleo1plaintextrecipient";
      const record = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        transaction_id: "tx_short_inputs",
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails("tx_short_inputs", {
          fee_value: 1000,
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [{ id: "in0", type: "public", value: recipientAddress }],
                outputs: [],
                program: "credits.aleo",
                function: "transfer_private",
              },
            ],
          },
        }),
      );

      const result = await getTokenOutDetails({
        config: mockConfig,
        record,
        viewKey: mockViewKey,
      });

      expect(result).toEqual({
        amount: null,
        recipient: null,
        fee: new BigNumber(1000),
      });
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });

    it("should decrypt private arguments and return the sent amount, recipient and fee", async () => {
      const recipientAddress = "aleo1privaterecipient789";
      const record = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        transaction_id: "tx_private",
        transition_index: 0,
        program_name: "arc20_token.aleo",
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(record.transaction_id, {
          fee_value: 9000,
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk_private",
                inputs: [
                  { id: "in0", type: "record", tag: "record_tag_0" },
                  { id: "in1", type: "private", value: "ciphertext_recipient" },
                  { id: "in2", type: "private", value: "ciphertext_amount" },
                ],
                outputs: [],
                program: record.program_name,
                function: EXPLORER_TRANSFER_TYPES.PRIVATE,
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "300000u128" });

      const result = await getTokenOutDetails({
        config: mockConfig,
        record,
        viewKey: mockViewKey,
      });

      expect(result).toEqual({
        amount: new BigNumber(300000),
        recipient: recipientAddress,
        fee: new BigNumber(9000),
      });
    });

    it("should tolerate a decryption failure on an argument it did not need", async () => {
      const recipientAddress = "aleo1proofrecipient";
      const record = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        transaction_id: "tx_trailing_proof",
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails("tx_trailing_proof", {
          fee_value: 3000,
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [
                  { id: "in0", type: "private", value: "cipher_recipient" },
                  { id: "in1", type: "private", value: "cipher_amount" },
                  { id: "in2", type: "private", value: "cipher_merkle_proof" },
                ],
                outputs: [],
                program: "usdcx_stablecoin.aleo",
                function: EXPLORER_TRANSFER_TYPES.PRIVATE,
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "4200u64" })
        .mockRejectedValueOnce(new Error("decrypt failed"));

      const result = await getTokenOutDetails({
        config: mockConfig,
        record,
        viewKey: mockViewKey,
      });

      expect(result).toEqual({
        amount: new BigNumber(4200),
        recipient: recipientAddress,
        fee: new BigNumber(3000),
      });
    });

    it("should propagate a decryption failure instead of reporting a zero-amount transfer", async () => {
      const record = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        transaction_id: "tx_decrypt_fail",
        transition_index: 0,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails("tx_decrypt_fail", {
          fee_value: 2000,
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [
                  { id: "in0", type: "record", tag: "record_tag_0" },
                  { id: "in1", type: "private", value: "cipher_recipient" },
                  { id: "in2", type: "private", value: "cipher_amount" },
                ],
                outputs: [],
                program: "credits.aleo",
                function: "transfer_private",
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext.mockRejectedValue(new Error("decrypt failed"));

      await expect(
        getTokenOutDetails({ config: mockConfig, record, viewKey: mockViewKey }),
      ).rejects.toThrow("decrypt failed");
    });

    it("should trim transaction_id whitespace before fetching details", async () => {
      const record = getMockedRecord({
        transaction_id: "  tx_with_spaces  ",
        transition_index: 0,
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE_TO_PUBLIC,
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails("tx_with_spaces", {
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk1",
                inputs: [
                  { id: "in0", type: "public", value: "100u64" },
                  { id: "in1", type: "public", value: "aleo1recipient123" },
                ],
                outputs: [],
                program: "credits.aleo",
                function: "transfer_private_to_public",
              },
            ],
          },
        }),
      );

      await getTokenOutDetails({
        config: mockConfig,
        record,
        viewKey: mockViewKey,
      });

      expect(mockGetTransactionById).toHaveBeenCalledWith(mockConfig, "tx_with_spaces");
    });

    it("should decrypt recipient and amount at indices 1/2 when there is one leading record input", async () => {
      const recipientAddress = "aleo1arc20outrecipient";
      const record = getMockedRecord({
        function_name: EXPLORER_TRANSFER_TYPES.PRIVATE,
        transaction_id: "tx_arc20_out",
        transition_index: 0,
        program_name: "arc20_token.aleo",
      });
      mockGetTransactionById.mockResolvedValueOnce(
        getMockedTransactionDetails(record.transaction_id, {
          fee_value: 7000,
          execution: {
            transitions: [
              {
                id: "au1",
                scm: "s",
                tcm: "t",
                tpk: "tpk_arc20",
                inputs: [
                  { id: "in0", type: "record", tag: "record_tag_0" },
                  { id: "in1", type: "private", value: "ciphertext_recipient" },
                  { id: "in2", type: "private", value: "ciphertext_amount" },
                ],
                outputs: [],
                program: record.program_name,
                function: "transfer_private",
              },
            ],
          },
        }),
      );
      mockDecryptCiphertext
        .mockResolvedValueOnce({ plaintext: recipientAddress })
        .mockResolvedValueOnce({ plaintext: "600000u64" });

      const result = await getTokenOutDetails({
        config: mockConfig,
        record,
        viewKey: mockViewKey,
      });

      expect(result).toEqual({
        amount: new BigNumber(600000),
        recipient: recipientAddress,
        fee: new BigNumber(7000),
      });
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({
          ciphertext: "ciphertext_recipient",
          outputIndex: 1,
        }),
      );
      expect(mockDecryptCiphertext).toHaveBeenCalledWith(
        expect.objectContaining({
          ciphertext: "ciphertext_amount",
          outputIndex: 2,
        }),
      );
    });
  });
});

describe("getStakingPosition", () => {
  const config = getMockedConfig("mainnet");
  const ADDRESS = "aleo1d37xxnms3sq5qxcnnh3dtvzr35xemjzas4jcytjr8uvymfetnu9salav5n";
  const BONDED_RAW = `{\n  validator: ${ADDRESS},\n  microcredits: 39339243096u64\n}`;
  const WITHDRAW_RAW = "aleo1g5wrxvgyvckgtuceg36eg6pf024x3p6nex05lcefz0h6576rmgrs22dr4w";

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.getBondedMapping).mockResolvedValue(null);
    jest.mocked(apiClient.getUnbondingMapping).mockResolvedValue(null);
    jest.mocked(apiClient.getWithdrawMapping).mockResolvedValue(null);
  });

  it("reads all three mappings for the address", async () => {
    await getStakingPosition(config, ADDRESS);

    expect(apiClient.getBondedMapping).toHaveBeenCalledTimes(1);
    expect(apiClient.getBondedMapping).toHaveBeenCalledWith(config, ADDRESS);
    expect(apiClient.getUnbondingMapping).toHaveBeenCalledTimes(1);
    expect(apiClient.getUnbondingMapping).toHaveBeenCalledWith(config, ADDRESS);
    expect(apiClient.getWithdrawMapping).toHaveBeenCalledTimes(1);
    expect(apiClient.getWithdrawMapping).toHaveBeenCalledWith(config, ADDRESS);
  });

  it("returns the assembled position", async () => {
    jest.mocked(apiClient.getBondedMapping).mockResolvedValue(BONDED_RAW);
    jest.mocked(apiClient.getWithdrawMapping).mockResolvedValue(WITHDRAW_RAW);

    const position = await getStakingPosition(config, ADDRESS);

    expect(position.bondedBalance.toString()).toBe("39339243096");
    expect(position.bondedValidator).toBe(ADDRESS);
    expect(position.withdrawalAddress).toBe(WITHDRAW_RAW);
  });

  it("propagates a failure on any one of the three reads", async () => {
    jest
      .mocked(apiClient.getWithdrawMapping)
      .mockRejectedValue(new LedgerAPI5xx("Internal Server Error"));

    await expect(getStakingPosition(config, ADDRESS)).rejects.toThrow("Internal Server Error");
  });
});
