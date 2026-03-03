import BigNumber from "bignumber.js";
import { EXPLORER_TRANSFER_TYPES, PROGRAM_ID } from "../constants";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import { sdkClient } from "../network/sdk";
import type { ProvableApi } from "../types";
import { getMockedRecord } from "../__tests__/fixtures/api.fixture";
import {
  getMockedPublicTransaction,
  getMockedTransactionDetails,
} from "../__tests__/fixtures/transaction.fixture";
import * as logicUtils from "../logic/utils";
import { accessProvableApi } from "./utils";
import { apiClient } from "./api";
import {
  fetchAccountTransactionsFromHeight,
  enrichTransaction,
  enrichPrivateRecord,
} from "./utils";

jest.mock("./api");
jest.mock("./sdk");
jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  generateUniqueUsername: jest.fn(),
}));

const mockRegisterNewAccount = jest.mocked(apiClient.registerNewAccount);
const mockGetAccountJWT = jest.mocked(apiClient.getAccountJWT);
const mockGetRecordScannerStatus = jest.mocked(apiClient.getRecordScannerStatus);
const mockGetPublicKey = jest.mocked(apiClient.getPublicKey);
const mockEncryptRegistrationPayload = jest.mocked(sdkClient.encryptRegistrationPayload);
const mockGenerateUniqueUsername = jest.mocked(logicUtils.generateUniqueUsername);
const mockRegisterForScanningAccountRecords = jest.mocked(
  apiClient.registerForScanningAccountRecordsEncrypted,
);
const mockGetTransactionById = jest.mocked(apiClient.getTransactionById);
const mockDecryptCiphertext = jest.mocked(sdkClient.decryptCiphertext);
const mockDecryptRecord = jest.mocked(sdkClient.decryptRecord);

describe("network/utils", () => {
  const mockCurrency = getMockedCurrency();
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
            next_cursor: undefined,
          });

        const result = await fetchAccountTransactionsFromHeight({
          currency: mockCurrency,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(2);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenNthCalledWith(1, {
          currency: mockCurrency,
          address: mockAddress,
          limit: 50,
          order: "asc",
        });
        expect(apiClient.getAccountPublicTransactions).toHaveBeenNthCalledWith(2, {
          currency: mockCurrency,
          address: mockAddress,
          limit: 50,
          order: "asc",
          cursor: "140",
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
          next_cursor: undefined,
        });

        const result = await fetchAccountTransactionsFromHeight({
          currency: mockCurrency,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          currency: mockCurrency,
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
          currency: mockCurrency,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
          order: "desc",
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          currency: mockCurrency,
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
          currency: mockCurrency,
          address: mockAddress,
          fetchAllPages: false,
          minBlockHeight,
          limit,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          currency: mockCurrency,
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
          next_cursor: undefined,
        });

        const result = await fetchAccountTransactionsFromHeight({
          currency: mockCurrency,
          address: mockAddress,
          fetchAllPages: false,
          minBlockHeight,
          limit,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          currency: mockCurrency,
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
          next_cursor: undefined,
        });

        await fetchAccountTransactionsFromHeight({
          currency: mockCurrency,
          address: mockAddress,
          fetchAllPages: false,
          minBlockHeight,
          cursor,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          currency: mockCurrency,
          address: mockAddress,
          limit: 50,
          order: "asc",
          cursor,
        });
      });
    });

    describe("edge cases", () => {
      it("should handle empty transaction list", async () => {
        const minBlockHeight = 100;

        jest.mocked(apiClient.getAccountPublicTransactions).mockResolvedValueOnce({
          address: mockAddress,
          transactions: [],
          next_cursor: undefined,
        });

        const result = await fetchAccountTransactionsFromHeight({
          currency: mockCurrency,
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
          next_cursor: undefined,
        });

        await fetchAccountTransactionsFromHeight({
          currency: mockCurrency,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
          limit: customLimit,
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          currency: mockCurrency,
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
          next_cursor: undefined,
        });

        await fetchAccountTransactionsFromHeight({
          currency: mockCurrency,
          address: mockAddress,
          fetchAllPages: true,
          minBlockHeight,
          order: "desc",
        });

        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledTimes(1);
        expect(apiClient.getAccountPublicTransactions).toHaveBeenCalledWith({
          currency: mockCurrency,
          address: mockAddress,
          limit: 50,
          order: "desc",
        });
      });
    });
  });

  describe("enrichTransaction", () => {
    it("should fetch details and return rawTx + details when program is CREDITS", async () => {
      const rawTx = getMockedPublicTransaction({
        transaction_id: "at1test123",
        program_id: PROGRAM_ID.CREDITS,
      });
      const mockDetails = getMockedTransactionDetails("at1test123");

      jest.mocked(apiClient.getTransactionById).mockResolvedValueOnce(mockDetails);

      const result = await enrichTransaction({ currency: mockCurrency, rawTx });

      expect(apiClient.getTransactionById).toHaveBeenCalledTimes(1);
      expect(apiClient.getTransactionById).toHaveBeenCalledWith(mockCurrency, "at1test123");
      expect(result).toEqual({ rawTx, details: mockDetails });
    });

    it("should return null details without fetching when program is not CREDITS", async () => {
      const rawTx = getMockedPublicTransaction({ program_id: "custom.aleo" });

      const result = await enrichTransaction({ currency: mockCurrency, rawTx });

      expect(apiClient.getTransactionById).not.toHaveBeenCalled();
      expect(result).toEqual({ rawTx, details: null });
    });
  });

  describe("accessProvableApi", () => {
    const mockCurrency = getMockedCurrency();
    const mockViewKey = "AViewKey1mockviewkey";
    const mockAddress = "aleo1test123";
    const mockApiKey = "test-api-key-123";
    const mockConsumerId = "consumer-id-456";
    const mockUUID = "uuid-abc-def";
    const mockUsername = "1234567890_aleo1test123";
    const mockPublicKey = "aleo1publickey";
    const mockKeyId = "key-id-123";
    const mockEncryptedData = "encrypted-data-xyz";
    const mockJWT = {
      token: "jwt-token-789",
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour in the future,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockGenerateUniqueUsername.mockReturnValue(mockUsername);
      mockGetPublicKey.mockResolvedValue({ public_key: mockPublicKey, key_id: mockKeyId });
      mockEncryptRegistrationPayload.mockResolvedValue({ encrypted: mockEncryptedData });
    });

    describe("Initial registration flow", () => {
      it("should register a new account when provableApi is null", async () => {
        mockRegisterNewAccount.mockResolvedValue({
          key: mockApiKey,
          consumer: { id: mockConsumerId },
          created_at: Date.now(),
          id: "account-id",
        });
        mockGetAccountJWT.mockResolvedValue(mockJWT);
        mockRegisterForScanningAccountRecords.mockResolvedValue({ uuid: mockUUID });
        mockGetRecordScannerStatus.mockResolvedValue({ synced: false, percentage: 0 });

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: null,
        });

        expect(mockGenerateUniqueUsername).toHaveBeenCalledTimes(1);
        expect(mockRegisterNewAccount).toHaveBeenCalledTimes(1);
        expect(mockGetAccountJWT).toHaveBeenCalledTimes(1);
        expect(mockRegisterForScanningAccountRecords).toHaveBeenCalledTimes(1);
        expect(mockGetRecordScannerStatus).toHaveBeenCalledTimes(1);

        expect(result).toEqual({
          apiKey: mockApiKey,
          consumerId: mockConsumerId,
          jwt: mockJWT,
          uuid: mockUUID,
          scannerStatus: { synced: false, percentage: 0 },
        });
      });

      it("should register a new account when apiKey is missing", async () => {
        const partialProvableApi: ProvableApi = {
          apiKey: undefined,
          consumerId: undefined,
          jwt: mockJWT,
          uuid: mockUUID,
          scannerStatus: { synced: true, percentage: 100 },
        };

        mockRegisterNewAccount.mockResolvedValue({
          key: mockApiKey,
          consumer: { id: mockConsumerId },
          created_at: Date.now(),
          id: "account-id",
        });
        mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: partialProvableApi,
        });

        expect(mockRegisterNewAccount).toHaveBeenCalledTimes(1);
        expect(mockRegisterNewAccount).toHaveBeenCalledWith(mockCurrency, mockUsername);
        expect(result?.apiKey).toBe(mockApiKey);
        expect(result?.consumerId).toBe(mockConsumerId);
      });

      it("should register a new account when consumerId is missing", async () => {
        const partialProvableApi: ProvableApi = {
          apiKey: mockApiKey,
          consumerId: undefined,
          jwt: mockJWT,
          uuid: mockUUID,
          scannerStatus: { synced: true, percentage: 100 },
        };

        mockRegisterNewAccount.mockResolvedValue({
          key: mockApiKey,
          consumer: { id: mockConsumerId },
          created_at: Date.now(),
          id: "account-id",
        });
        mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: partialProvableApi,
        });

        expect(mockRegisterNewAccount).toHaveBeenCalledTimes(1);
        expect(mockRegisterNewAccount).toHaveBeenCalledWith(mockCurrency, mockUsername);
        expect(result?.consumerId).toBe(mockConsumerId);
      });
    });

    describe("JWT token management", () => {
      it("should refresh JWT when it is expired", async () => {
        const expiredJWT = {
          token: "expired-token",
          exp: Math.floor(Date.now() / 1000) - 3600, // 1 hour in the past
        };

        const existingProvableApi: ProvableApi = {
          apiKey: mockApiKey,
          consumerId: mockConsumerId,
          jwt: expiredJWT,
          uuid: mockUUID,
          scannerStatus: { synced: true, percentage: 100 },
        };

        mockGetAccountJWT.mockResolvedValue(mockJWT);
        mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: existingProvableApi,
        });

        expect(result?.jwt).toEqual(mockJWT);
      });

      it("should refresh JWT when it is about to expire (within 5 minutes)", async () => {
        const soonToExpireJWT = {
          token: "soon-to-expire-token",
          exp: Math.floor(Date.now() / 1000) + 4 * 60, // 4 minutes in the future
        };

        const existingProvableApi: ProvableApi = {
          apiKey: mockApiKey,
          consumerId: mockConsumerId,
          jwt: soonToExpireJWT,
          uuid: mockUUID,
          scannerStatus: { synced: true, percentage: 100 },
        };

        mockGetAccountJWT.mockResolvedValue(mockJWT);
        mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: existingProvableApi,
        });

        expect(mockGetAccountJWT).toHaveBeenCalledTimes(1);
        expect(mockGetAccountJWT).toHaveBeenCalledWith(mockCurrency, mockApiKey, mockConsumerId);
        expect(result?.jwt).toEqual(mockJWT);
      });

      it("should not refresh JWT when it is still valid", async () => {
        const validJWT = {
          token: "valid-token",
          exp: Math.floor(Date.now() / 1000) + 30 * 60, // 30 minutes in the future
        };

        const existingProvableApi: ProvableApi = {
          apiKey: mockApiKey,
          consumerId: mockConsumerId,
          jwt: validJWT,
          uuid: mockUUID,
          scannerStatus: { synced: true, percentage: 100 },
        };

        mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: existingProvableApi,
        });

        expect(mockGetAccountJWT).not.toHaveBeenCalled();
        expect(result?.jwt).toEqual(validJWT);
      });

      it("should request new JWT when jwt is undefined", async () => {
        const existingProvableApi: ProvableApi = {
          apiKey: mockApiKey,
          consumerId: mockConsumerId,
          jwt: undefined,
          uuid: mockUUID,
          scannerStatus: { synced: true, percentage: 100 },
        };

        mockGetAccountJWT.mockResolvedValue(mockJWT);
        mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: existingProvableApi,
        });

        expect(mockGetAccountJWT).toHaveBeenCalledTimes(1);
        expect(mockGetAccountJWT).toHaveBeenCalledWith(mockCurrency, mockApiKey, mockConsumerId);
        expect(result?.jwt).toEqual(mockJWT);
      });

      it("should return null when JWT retrieval fails with Unauthorized error", async () => {
        const expiredJWT = {
          token: "expired-token",
          exp: Math.floor(Date.now() / 1000) - 3600,
        };

        const existingProvableApi: ProvableApi = {
          apiKey: mockApiKey,
          consumerId: mockConsumerId,
          jwt: expiredJWT,
          uuid: mockUUID,
          scannerStatus: { synced: true, percentage: 100 },
        };

        const unauthorizedError = new Error("Unauthorized");
        mockGetAccountJWT.mockRejectedValue(unauthorizedError);

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: existingProvableApi,
        });

        expect(result).toBeNull();
        expect(mockGetAccountJWT).toHaveBeenCalled();
        expect(mockGetRecordScannerStatus).not.toHaveBeenCalled();
      });

      it("should throw error when JWT retrieval fails with non-Unauthorized error", async () => {
        const expiredJWT = {
          token: "expired-token",
          exp: Math.floor(Date.now() / 1000) - 3600,
        };

        const existingProvableApi: ProvableApi = {
          apiKey: mockApiKey,
          consumerId: mockConsumerId,
          jwt: expiredJWT,
          uuid: mockUUID,
          scannerStatus: { synced: true, percentage: 100 },
        };

        const networkError = new Error("Network error");
        mockGetAccountJWT.mockRejectedValue(networkError);

        await expect(
          accessProvableApi({
            currency: mockCurrency,
            viewKey: mockViewKey,
            address: mockAddress,
            provableApi: existingProvableApi,
          }),
        ).rejects.toThrow("Network error");
      });
    });

    describe("UUID and scanning registration", () => {
      it("should register for scanning when uuid is missing", async () => {
        const existingProvableApi: ProvableApi = {
          apiKey: mockApiKey,
          consumerId: mockConsumerId,
          jwt: mockJWT,
          uuid: undefined,
          scannerStatus: { synced: false, percentage: 0 },
        };

        mockRegisterForScanningAccountRecords.mockResolvedValue({ uuid: mockUUID });
        mockGetRecordScannerStatus.mockResolvedValue({ synced: false, percentage: 5 });

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: existingProvableApi,
        });

        expect(mockGetPublicKey).toHaveBeenCalledTimes(1);
        expect(mockGetPublicKey).toHaveBeenCalledWith(mockCurrency, mockJWT.token);
        expect(mockEncryptRegistrationPayload).toHaveBeenCalledTimes(1);
        expect(mockEncryptRegistrationPayload).toHaveBeenCalledWith({
          currency: mockCurrency,
          publicKey: mockPublicKey,
          viewKey: mockViewKey,
          start: 0,
        });
        expect(mockRegisterForScanningAccountRecords).toHaveBeenCalledTimes(1);
        expect(mockRegisterForScanningAccountRecords).toHaveBeenCalledWith({
          currency: mockCurrency,
          jwt: mockJWT.token,
          encryptedData: mockEncryptedData,
          keyId: mockKeyId,
        });
        expect(result?.uuid).toBe(mockUUID);
      });

      it("should not register for scanning when uuid exists", async () => {
        const existingProvableApi: ProvableApi = {
          apiKey: mockApiKey,
          consumerId: mockConsumerId,
          jwt: mockJWT,
          uuid: mockUUID,
          scannerStatus: { synced: false, percentage: 50 },
        };

        mockGetRecordScannerStatus.mockResolvedValue({ synced: false, percentage: 60 });

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: existingProvableApi,
        });

        expect(mockRegisterForScanningAccountRecords).not.toHaveBeenCalled();
        expect(result?.uuid).toBe(mockUUID);
      });
    });

    describe("Scanner status updates", () => {
      it("should update scanner status when status is available", async () => {
        const existingProvableApi: ProvableApi = {
          apiKey: mockApiKey,
          consumerId: mockConsumerId,
          jwt: mockJWT,
          uuid: mockUUID,
          scannerStatus: { synced: false, percentage: 50 },
        };

        mockGetRecordScannerStatus.mockResolvedValue({ synced: true, percentage: 100 });

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: existingProvableApi,
        });

        expect(result?.scannerStatus).toEqual({ synced: true, percentage: 100 });
      });

      it("should preserve previous scanner status when status call returns null", async () => {
        const existingProvableApi: ProvableApi = {
          apiKey: mockApiKey,
          consumerId: mockConsumerId,
          jwt: mockJWT,
          uuid: mockUUID,
          scannerStatus: { synced: false, percentage: 75 },
        };

        mockGetRecordScannerStatus.mockResolvedValue(null);

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: existingProvableApi,
        });

        expect(result?.scannerStatus).toEqual({ synced: false, percentage: 75 });
      });

      it("should initialize scanner status with defaults when provableApi is null", async () => {
        mockRegisterNewAccount.mockResolvedValue({
          key: mockApiKey,
          consumer: { id: mockConsumerId },
          created_at: Date.now(),
          id: "account-id",
        });
        mockGetAccountJWT.mockResolvedValue(mockJWT);
        mockRegisterForScanningAccountRecords.mockResolvedValue({ uuid: mockUUID });
        mockGetRecordScannerStatus.mockResolvedValue({ synced: false, percentage: 0 });

        const result = await accessProvableApi({
          currency: mockCurrency,
          viewKey: mockViewKey,
          address: mockAddress,
          provableApi: null,
        });

        expect(result?.scannerStatus).toEqual({ synced: false, percentage: 0 });
      });
    });
  });

  describe("enrichPrivateRecord", () => {
    const mockViewKey = "AViewKey1testviewkey";
    const mockEnrichAddress = "aleo1testowner123address456";

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
        currency: mockCurrency,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionById).toHaveBeenCalledWith(mockCurrency, "tx_pub_to_priv");
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
        currency: mockCurrency,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
      expect(mockDecryptRecord).not.toHaveBeenCalled();
    });

    it("should return null when sender is this address and transition has fewer inputs than expected", async () => {
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
                inputs: [{ id: "in0", type: "public", value: "only_one_input" }], // only 1 input, needs 3 (indices 0, 1, 2)
                outputs: [],
                program: "credits.aleo",
                function: "transfer_private_to_public",
              },
            ],
          },
        }),
      );

      const result = await enrichPrivateRecord({
        currency: mockCurrency,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
      expect(mockDecryptRecord).not.toHaveBeenCalled();
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
                  { id: "in0", type: "public", value: "record_cipher" },
                  { id: "in1", type: "public", value: mockEnrichAddress }, // RECIPIENT_ARG_INDEX = 1, self
                  { id: "in2", type: "public", value: "500000u64" }, // AMOUNT_ARG_INDEX = 2
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
        currency: mockCurrency,
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
                { id: "in0", type: "public", value: "record_cipher" },
                { id: "in1", type: "public", value: recipientAddress }, // RECIPIENT_ARG_INDEX = 1
                { id: "in2", type: "public", value: "500000u64" }, // AMOUNT_ARG_INDEX = 2
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
        currency: mockCurrency,
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
                { id: "in0", type: "private", value: "ciphertext_record" },
                { id: "in1", type: "private", value: "ciphertext_recipient" }, // RECIPIENT_ARG_INDEX = 1
                { id: "in2", type: "private", value: "ciphertext_amount" }, // AMOUNT_ARG_INDEX = 2
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
        currency: mockCurrency,
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
        currency: mockCurrency,
        ciphertext: "ciphertext_recipient",
        tpk: "tpk_private",
        viewKey: mockViewKey,
        programId: rawRecord.program_name,
        functionName: rawRecord.function_name,
        outputIndex: 1, // RECIPIENT_ARG_INDEX
      });
      expect(mockDecryptCiphertext).toHaveBeenCalledWith({
        currency: mockCurrency,
        ciphertext: "ciphertext_amount",
        tpk: "tpk_private",
        viewKey: mockViewKey,
        programId: rawRecord.program_name,
        functionName: rawRecord.function_name,
        outputIndex: 2, // AMOUNT_ARG_INDEX
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
        currency: mockCurrency,
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
        currency: mockCurrency,
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
        currency: mockCurrency,
        ciphertext: "ciphertext_output_record",
        viewKey: mockViewKey,
      });
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
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
        currency: mockCurrency,
        rawRecord,
        address: mockEnrichAddress,
        viewKey: mockViewKey,
      });

      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionById).toHaveBeenCalledWith(mockCurrency, "tx_with_spaces");
      expect(mockDecryptRecord).toHaveBeenCalledTimes(1);
      expect(mockDecryptCiphertext).not.toHaveBeenCalled();
    });
  });
});
