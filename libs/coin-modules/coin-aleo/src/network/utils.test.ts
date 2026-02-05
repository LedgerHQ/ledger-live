import BigNumber from "bignumber.js";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import {
  getMockedRecord,
  getMockedTransaction,
  getMockedTransactionDetails,
} from "../__tests__/fixtures/api.fixture";
import { PROGRAM_ID } from "../constants";
import { AleoPrivateRecord, ProvableApi } from "../types";
import * as utils from "../logic/utils";
import { apiClient } from "./api";
import {
  accessProvableApi,
  fetchAccountTransactionsFromHeight,
  parseOperation,
  parsePrivateOperation,
} from "./utils";
import { sdkClient } from "./sdk";

jest.mock("./api");
jest.mock("./sdk");
jest.mock("../logic/utils", () => ({
  ...jest.requireActual("../logic/utils"),
  generateUniqueUsername: jest.fn(),
}));

const mockRegisterNewAccount = jest.mocked(apiClient.registerNewAccount);
const mockGetAccountJWT = jest.mocked(apiClient.getAccountJWT);
const mockGetRecordScannerStatus = jest.mocked(apiClient.getRecordScannerStatus);
const mockGenerateUniqueUsername = jest.mocked(utils.generateUniqueUsername);
const mockRegisterForScanningAccountRecords = jest.mocked(
  apiClient.registerForScanningAccountRecords,
);
const mockGetAccountPublicTransactions = jest.mocked(apiClient.getAccountPublicTransactions);
const mockGetTransactionById = jest.mocked(apiClient.getTransactionById);

describe("network utils", () => {
  const mockCurrency = getMockedCurrency();
  const mockAddress = "addr";
  const mockLedgerAccountId = "js:2:aleo:aleo1test:";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAccountPublicTransactions.mockResolvedValue({
      address: mockAddress,
      transactions: [],
    });
  });

  describe("fetchAccountTransactionsFromHeight", () => {
    it("returns transactions up to limit and provides cursor for next page", async () => {
      const tx1 = getMockedTransaction({ transaction_id: "tx1", block_number: 10 });
      const tx2 = getMockedTransaction({ transaction_id: "tx2", block_number: 11 });

      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [tx1, tx2],
      });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: false,
        minBlockHeight: 0,
        limit: 1,
        order: "asc",
      });

      expect(mockGetAccountPublicTransactions).toHaveBeenCalledTimes(1);
      expect(res.transactions).toEqual([expect.objectContaining(tx1)]);
      expect(res.nextCursor).toBe(tx1.block_number.toString());
    });

    it("fetches multiple pages until limit is reached", async () => {
      const tx1 = getMockedTransaction({ transaction_id: "tx1", block_number: 10 });
      const tx2 = getMockedTransaction({ transaction_id: "tx2", block_number: 11 });
      const tx3 = getMockedTransaction({ transaction_id: "tx3", block_number: 12 });
      const tx4 = getMockedTransaction({ transaction_id: "tx4", block_number: 13 });

      mockGetAccountPublicTransactions
        .mockResolvedValueOnce({
          address: mockAddress,
          transactions: [tx1, tx2],
          next_cursor: { block_number: 11, transition_id: "" },
        })
        .mockResolvedValueOnce({
          address: mockAddress,
          transactions: [tx3, tx4],
          next_cursor: { block_number: 13, transition_id: "" },
        });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: false,
        minBlockHeight: 0,
        limit: 3,
        order: "asc",
      });

      expect(mockGetAccountPublicTransactions).toHaveBeenCalledTimes(2);
      expect(res.transactions).toHaveLength(3);
      expect(res.transactions).toEqual([
        expect.objectContaining(tx1),
        expect.objectContaining(tx2),
        expect.objectContaining(tx3),
      ]);
      expect(res.nextCursor).toBe(tx3.block_number.toString());
    });

    it("returns null cursor when no more pages and transactions < limit", async () => {
      const tx1 = getMockedTransaction({ transaction_id: "tx1", block_number: 10 });

      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [tx1],
      });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: false,
        minBlockHeight: 0,
        limit: 10,
        order: "asc",
      });

      expect(res.transactions).toEqual([expect.objectContaining(tx1)]);
      expect(res.nextCursor).toBeNull();
    });

    it("filters transactions by minBlockHeight", async () => {
      const txBelow = getMockedTransaction({ transaction_id: "below", block_number: 50 });
      const txAbove1 = getMockedTransaction({ transaction_id: "above1", block_number: 150 });
      const txAbove2 = getMockedTransaction({ transaction_id: "above2", block_number: 200 });

      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [txBelow, txAbove1, txAbove2],
      });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: false,
        minBlockHeight: 100,
        limit: 50,
        order: "asc",
      });

      expect(res.transactions).toEqual([
        expect.objectContaining(txAbove1),
        expect.objectContaining(txAbove2),
      ]);
      expect(res.nextCursor).toBeNull();
    });

    it("stops and returns null cursor when DESC order crosses minBlockHeight", async () => {
      const txAbove1 = getMockedTransaction({ transaction_id: "above1", block_number: 150 });
      const txAbove2 = getMockedTransaction({ transaction_id: "above2", block_number: 120 });
      const txBelow = getMockedTransaction({ transaction_id: "below", block_number: 90 });

      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [txAbove1, txAbove2, txBelow],
        next_cursor: { block_number: 90, transition_id: "" },
      });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: false,
        minBlockHeight: 100,
        limit: 50,
        order: "desc",
      });

      expect(mockGetAccountPublicTransactions).toHaveBeenCalledTimes(1);
      expect(res.transactions).toEqual([
        expect.objectContaining(txAbove1),
        expect.objectContaining(txAbove2),
      ]);
      expect(res.nextCursor).toBeNull();
    });

    it("limits transactions when DESC crosses minBlockHeight with many results", async () => {
      const txBelow = getMockedTransaction({ transaction_id: "below", block_number: 50 });
      const txsAbove = [...Array(20)].map((_, i) =>
        getMockedTransaction({ transaction_id: `tx${i}`, block_number: 200 - i * 5 }),
      );

      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [...txsAbove, txBelow],
        next_cursor: { block_number: 50, transition_id: "" },
      });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: false,
        minBlockHeight: 100,
        limit: 5,
        order: "desc",
      });

      expect(res.transactions).toHaveLength(5);
      expect(res.nextCursor).toBeNull();
    });

    it("fetches all pages and returns all transactions with null cursor", async () => {
      const txA = getMockedTransaction({ transaction_id: "a", block_number: 20 });
      const txB = getMockedTransaction({ transaction_id: "b", block_number: 21 });

      mockGetAccountPublicTransactions
        .mockResolvedValueOnce({
          address: mockAddress,
          transactions: [txA],
          next_cursor: { block_number: 20, transition_id: "" },
        })
        .mockResolvedValueOnce({
          address: mockAddress,
          transactions: [txB],
        });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: true,
        minBlockHeight: 0,
        limit: 50,
        order: "asc",
      });

      expect(mockGetAccountPublicTransactions).toHaveBeenCalledTimes(2);
      expect(res.transactions).toEqual([
        expect.objectContaining(txA),
        expect.objectContaining(txB),
      ]);
      expect(res.nextCursor).toBeNull();
    });

    it("stops when DESC order crosses minBlockHeight and returns all valid transactions", async () => {
      const txAbove1 = getMockedTransaction({ transaction_id: "above1", block_number: 150 });
      const txAbove2 = getMockedTransaction({ transaction_id: "above2", block_number: 120 });
      const txBelow = getMockedTransaction({ transaction_id: "below", block_number: 95 });

      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [txAbove1, txAbove2, txBelow],
        next_cursor: { block_number: 95, transition_id: "" },
      });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: true,
        minBlockHeight: 100,
        limit: 50,
        order: "desc",
      });

      expect(mockGetAccountPublicTransactions).toHaveBeenCalledTimes(1);
      expect(res.transactions).toEqual([
        expect.objectContaining(txAbove1),
        expect.objectContaining(txAbove2),
      ]);
      expect(res.nextCursor).toBeNull();
    });

    it("does not limit transactions even if more than limit parameter", async () => {
      const txs = [...Array(100)].map((_, i) =>
        getMockedTransaction({ transaction_id: `tx${i}`, block_number: 100 + i }),
      );

      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: txs,
      });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: true,
        minBlockHeight: 0,
        limit: 10,
        order: "asc",
      });

      expect(res.transactions).toHaveLength(100);
      expect(res.nextCursor).toBeNull();
    });

    it("filters by minBlockHeight across multiple pages", async () => {
      const tx1 = getMockedTransaction({ transaction_id: "tx1", block_number: 50 });
      const tx2 = getMockedTransaction({ transaction_id: "tx2", block_number: 150 });
      const tx3 = getMockedTransaction({ transaction_id: "tx3", block_number: 200 });
      const tx4 = getMockedTransaction({ transaction_id: "tx4", block_number: 250 });

      mockGetAccountPublicTransactions
        .mockResolvedValueOnce({
          address: mockAddress,
          transactions: [tx1, tx2],
          next_cursor: { block_number: 150, transition_id: "" },
        })
        .mockResolvedValueOnce({
          address: mockAddress,
          transactions: [tx3, tx4],
        });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: true,
        minBlockHeight: 100,
        limit: 50,
        order: "asc",
      });

      expect(res.transactions).toHaveLength(3);
      expect(res.transactions).toEqual([
        expect.objectContaining({ transaction_id: "tx2" }),
        expect.objectContaining({ transaction_id: "tx3" }),
        expect.objectContaining({ transaction_id: "tx4" }),
      ]);
      expect(res.nextCursor).toBeNull();
    });

    it("returns empty array and null cursor when no transactions are found", async () => {
      mockGetAccountPublicTransactions.mockResolvedValue({
        address: mockAddress,
        transactions: [],
      });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: true,
        minBlockHeight: 0,
        limit: 50,
        order: "asc",
      });

      expect(res.nextCursor).toBeNull();
      expect(res.transactions).toEqual([]);
    });

    it("uses provided cursor to start fetching from specific block", async () => {
      const tx = getMockedTransaction({ transaction_id: "tx1", block_number: 500 });

      mockGetAccountPublicTransactions.mockResolvedValueOnce({
        address: mockAddress,
        transactions: [tx],
      });

      await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: false,
        minBlockHeight: 0,
        cursor: "400",
        limit: 50,
        order: "asc",
      });

      expect(mockGetAccountPublicTransactions).toHaveBeenCalledTimes(1);
      expect(mockGetAccountPublicTransactions).toHaveBeenCalledWith(
        expect.objectContaining({
          cursor: "400",
        }),
      );
    });

    it("handles all transactions filtered out by minBlockHeight", async () => {
      const tx1 = getMockedTransaction({ transaction_id: "tx1", block_number: 10 });
      const tx2 = getMockedTransaction({ transaction_id: "tx2", block_number: 20 });

      mockGetAccountPublicTransactions.mockResolvedValue({
        address: mockAddress,
        transactions: [tx1, tx2],
      });

      const res = await fetchAccountTransactionsFromHeight({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: false,
        minBlockHeight: 100,
        limit: 50,
        order: "asc",
      });

      expect(res.transactions).toEqual([]);
      expect(res.nextCursor).toBeNull();
    });
  });

  describe("parseOperation", () => {
    it("should parse incoming credits transaction", async () => {
      const mockTx = getMockedTransaction({
        transaction_id: "at1incoming",
        sender_address: "aleo1sender",
        recipient_address: mockAddress,
        amount: 1000000,
        block_number: 1000,
        block_timestamp: "1704067200",
      });

      const mockTxDetails = getMockedTransactionDetails({
        id: mockTx.transaction_id,
        block_height: mockTx.block_number,
        block_timestamp: mockTx.block_timestamp,
      });

      mockGetTransactionById.mockResolvedValue(mockTxDetails);

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: mockTx,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
      });

      expect(result).toMatchObject({
        type: "IN",
        senders: [mockTx.sender_address],
        recipients: [mockTx.recipient_address],
        value: new BigNumber(mockTx.amount),
        hasFailed: false,
        blockHeight: mockTx.block_number,
        date: new Date(Number(mockTx.block_timestamp) * 1000),
        extra: {
          functionId: mockTx.function_id,
        },
      });
    });

    it("should parse outgoing credits transaction", async () => {
      const mockTx = getMockedTransaction({
        transaction_id: "at1outgoing",
        sender_address: mockAddress,
        recipient_address: "aleo1recipient",
        amount: 500000,
        block_number: 2000,
        block_timestamp: "1704153600",
      });

      const mockTxDetails = getMockedTransactionDetails({
        id: mockTx.transaction_id,
        block_height: mockTx.block_number,
        block_timestamp: mockTx.block_timestamp,
      });

      mockGetTransactionById.mockResolvedValue(mockTxDetails);

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: mockTx,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
      });

      expect(result).toMatchObject({
        type: "OUT",
        senders: [mockTx.sender_address],
        recipients: [mockTx.recipient_address],
        value: new BigNumber(mockTx.amount),
        hasFailed: false,
        blockHeight: mockTx.block_number,
      });
    });

    it("should handle non-credits transactions with type NONE", async () => {
      const mockTx = getMockedTransaction({
        transaction_id: "at1other",
        sender_address: mockAddress,
        recipient_address: "aleo1recipient",
        amount: 0,
        program_id: "custom_program.aleo",
        function_id: "custom_function",
        block_number: 3000,
        block_timestamp: "1704240000",
      });

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: mockTx,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
      });

      expect(mockGetTransactionById).not.toHaveBeenCalled();
      expect(result).toMatchObject({
        type: "NONE",
        fee: new BigNumber(0),
        blockHash: null,
      });
    });

    it("should parse failed transaction correctly", async () => {
      const mockTx = getMockedTransaction({
        transaction_id: "at1failed",
        sender_address: mockAddress,
        recipient_address: "aleo1recipient",
        amount: 100000,
        transaction_status: "Rejected",
        block_number: 4000,
        block_timestamp: "1704326400",
      });

      const mockTxDetails = getMockedTransactionDetails({
        id: mockTx.transaction_id,
        status: "rejected",
        block_height: mockTx.block_number,
        block_timestamp: mockTx.block_timestamp,
      });

      mockGetTransactionById.mockResolvedValue(mockTxDetails);

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: mockTx,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
      });

      expect(result).toMatchObject({
        hasFailed: true,
        type: "OUT",
      });
    });

    it("should extract fee and block hash from transaction details", async () => {
      const mockTx = getMockedTransaction({
        transaction_id: "at1withfee",
        sender_address: mockAddress,
        recipient_address: "aleo1recipient",
        amount: 1000000,
        block_number: 5000,
        block_timestamp: "1704412800",
      });

      const mockTxDetails = getMockedTransactionDetails({
        id: mockTx.transaction_id,
        block_height: mockTx.block_number,
        block_timestamp: mockTx.block_timestamp,
        fee_value: 5000,
        fee: {
          transition: {
            id: "fee1",
            scm: "scm1",
            tcm: "tcm1",
            tpk: "tpk1",
            program: PROGRAM_ID.CREDITS,
            function: "fee_public",
            inputs: [
              {
                type: "public",
                id: "input1",
                value: "5000u64",
              },
            ],
            outputs: [],
          },
        },
      });

      mockGetTransactionById.mockResolvedValue(mockTxDetails);

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: mockTx,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
      });

      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionById).toHaveBeenCalledWith(mockCurrency, mockTx.transaction_id);
      expect(result).toMatchObject({
        fee: new BigNumber(5000),
        blockHash: mockTxDetails.block_hash,
      });
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
    const mockJWT = {
      token: "jwt-token-789",
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour in the future,
    };

    beforeEach(() => {
      jest.clearAllMocks();
      mockGenerateUniqueUsername.mockReturnValue(mockUsername);
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

        const unauthorizedError = { status: 401, message: "Unauthorized" };
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

        expect(mockRegisterForScanningAccountRecords).toHaveBeenCalledWith(
          mockCurrency,
          mockJWT.token,
          mockViewKey,
        );
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

        mockGetRecordScannerStatus.mockResolvedValue(null as any);

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

  describe("parsePrivateOperation", () => {
    const mockViewKey = "AViewKey1mockviewkey";
    const mockAddress = "aleo1test123";
    const mockLedgerAccountId = "js:2:aleo:aleo1test:";
    const mockRecipient = "aleo1recipient";

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it("should return null for PUBLIC_TO_PRIVATE transfers where sender is address", async () => {
      const mockRecord: AleoPrivateRecord = getMockedRecord({
        function_name: "transfer_public_to_private",
        sender: mockAddress,
      });

      const result = await parsePrivateOperation({
        currency: mockCurrency,
        rawTx: mockRecord,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        viewKey: mockViewKey,
      });

      expect(result).toBeNull();
    });

    it("should parse outgoing private transfer correctly", async () => {
      const mockRecord = getMockedRecord({
        function_name: "transfer_private",
        sender: mockAddress,
      });

      const mockTransactionDetails = getMockedTransactionDetails({
        id: "tx123",
        block_hash: "block123",
        block_timestamp: "1704067200",
        status: "Accepted",
        fee_value: 5000,
        execution: {
          transitions: [
            {
              id: "transition1",
              scm: "scm1",
              tcm: "tcm1",
              tpk: "tpk123",
              inputs: [
                { id: "input0", type: "private", value: "record0" },
                { id: "input1", type: "private", value: "ciphertext_recipient" },
                { id: "input2", type: "private", value: "ciphertext_amount" },
              ],
              outputs: [],
              program: "credits.aleo",
              function: "transfer_private",
            },
          ],
        },
      });

      mockGetTransactionById.mockResolvedValue(mockTransactionDetails);

      jest.mocked(sdkClient.decryptRecord).mockResolvedValue({
        data: { microcredits: "1000000u64" },
      });
      jest
        .mocked(sdkClient.decryptCiphertext)
        .mockResolvedValueOnce({ plaintext: mockRecipient })
        .mockResolvedValueOnce({ plaintext: "1000000u64" });

      const result = await parsePrivateOperation({
        currency: mockCurrency,
        rawTx: mockRecord,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        viewKey: mockViewKey,
      });

      expect(result?.type).toBe("OUT");
      expect(result?.senders).toEqual([mockAddress]);
      expect(result?.recipients).toEqual([mockRecipient]);
      expect(result?.value).toEqual(new BigNumber(1000000));
      expect(result?.hash).toBe("tx123");
      expect(result?.blockHeight).toBe(100);
      expect(result?.fee).toEqual(new BigNumber(5000));
      expect(result?.hasFailed).toBe(false);
      expect(result?.extra.functionId).toBe("transfer_private");
      expect(result?.extra.transactionType).toBe("private");
    });

    it("should parse incoming private transfer correctly", async () => {
      const mockSender = "aleo1sender";
      const mockRecord = getMockedRecord({
        transaction_id: "tx456",
        block_height: 200,
        transition_index: 0,
        function_name: "transfer_private",
        sender: mockSender,
        program_name: "credits.aleo",
        record_ciphertext: "record456",
      });

      const mockTransactionDetails = getMockedTransactionDetails({
        id: "tx456",
        block_hash: "block456",
        block_timestamp: "1704153600",
        status: "Accepted",
        fee_value: 3000,
      });

      mockGetTransactionById.mockResolvedValue(mockTransactionDetails);

      jest.mocked(sdkClient.decryptRecord).mockResolvedValue({
        data: { microcredits: "2000000u64.private" },
      });

      const result = await parsePrivateOperation({
        currency: mockCurrency,
        rawTx: mockRecord,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        viewKey: mockViewKey,
      });

      expect(result?.type).toBe("IN");
      expect(result?.senders).toEqual([mockSender]);
      expect(result?.recipients).toEqual([mockAddress]);
      expect(result?.value).toEqual(new BigNumber(2000000));
      expect(result?.hash).toBe("tx456");
      expect(result?.blockHeight).toBe(200);
      expect(result?.fee).toEqual(new BigNumber(3000));
    });

    it("should mark transaction as failed when status is not Accepted", async () => {
      const mockRecord = getMockedRecord({
        transaction_id: "tx789",
        block_height: 300,
        transition_index: 0,
        function_name: "transfer_private",
        sender: "aleo1sender",
        program_name: "credits.aleo",
        record_ciphertext: "record789",
      });

      const mockTransactionDetails = getMockedTransactionDetails({
        id: "tx789",
        status: "Rejected",
      });

      mockGetTransactionById.mockResolvedValue(mockTransactionDetails);

      jest.mocked(sdkClient.decryptRecord).mockResolvedValue({
        data: { microcredits: "500000u64" },
      });

      const result = await parsePrivateOperation({
        currency: mockCurrency,
        rawTx: mockRecord,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        viewKey: mockViewKey,
      });

      expect(result?.hasFailed).toBe(true);
    });
  });
});
