import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { PROGRAM_ID } from "../constants";
import { determineTransactionType } from "../logic/utils";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import {
  getMockedPublicTransaction,
  getMockedTransactionDetails,
} from "../__tests__/fixtures/transaction.fixture";
import { apiClient } from "./api";
import { fetchAccountTransactionsFromHeight, parseOperation } from "./utils";

jest.mock("./api");
jest.mock("../logic/utils");

describe("network/utils", () => {
  const mockCurrency = getMockedCurrency();
  const mockAddress = "aleo1test123address456";
  const mockAccountId = "js:2:aleo:aleo1test123address456:";

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

  describe("parseOperation", () => {
    const mockRawTx = getMockedPublicTransaction({
      transaction_id: "at1test123",
      block_number: 123456,
      block_timestamp: "1709079312",
      transaction_status: "Accepted",
      amount: 100000000,
      sender_address: "aleo1sender123",
      recipient_address: mockAddress,
      function_id: "transfer_public",
      program_id: PROGRAM_ID.CREDITS,
    });

    beforeEach(() => {
      jest.mocked(determineTransactionType).mockReturnValue("TRANSFER_PUBLIC");
    });

    it("should parse incoming transaction correctly", async () => {
      const mockTxDetails = getMockedTransactionDetails("at1test123", {
        fee_value: 5000000,
        block_hash: "ab1block123",
      });

      jest.mocked(apiClient.getTransactionById).mockResolvedValueOnce(mockTxDetails);

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: mockRawTx,
        address: mockAddress,
        ledgerAccountId: mockAccountId,
      });

      expect(apiClient.getTransactionById).toHaveBeenCalledTimes(1);
      expect(apiClient.getTransactionById).toHaveBeenCalledWith(mockCurrency, "at1test123");
      expect(result.type).toBe("IN");
      expect(result.value).toEqual(new BigNumber(100000000));
      expect(result.fee).toEqual(new BigNumber(5000000));
      expect(result.blockHash).toBe("ab1block123");
      expect(result.hasFailed).toBe(false);
      expect(result.recipients).toEqual([mockAddress]);
      expect(result.senders).toEqual(["aleo1sender123"]);
      expect(result.hash).toBe("at1test123");
      expect(result.blockHeight).toBe(123456);
      expect(result.accountId).toBe(mockAccountId);
      expect(result.extra.functionId).toBe("transfer_public");
      expect(result.extra.transactionType).toBe("TRANSFER_PUBLIC");
    });

    it("should parse outgoing transaction correctly", async () => {
      const outgoingTx = getMockedPublicTransaction({
        ...mockRawTx,
        sender_address: mockAddress,
        recipient_address: "aleo1recipient456",
      });

      const mockTxDetails = getMockedTransactionDetails("at1test123", {
        fee_value: 3000000,
        block_hash: "ab1block456",
      });

      jest.mocked(apiClient.getTransactionById).mockResolvedValueOnce(mockTxDetails);

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: outgoingTx,
        address: mockAddress,
        ledgerAccountId: mockAccountId,
      });

      expect(result.type).toBe("OUT");
      expect(result.recipients).toEqual(["aleo1recipient456"]);
      expect(result.senders).toEqual([mockAddress]);
    });

    it("should handle failed transaction", async () => {
      const failedTx = getMockedPublicTransaction({
        ...mockRawTx,
        transaction_status: "Rejected",
      });

      const mockTxDetails = getMockedTransactionDetails("at1test123");

      jest.mocked(apiClient.getTransactionById).mockResolvedValueOnce(mockTxDetails);

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: failedTx,
        address: mockAddress,
        ledgerAccountId: mockAccountId,
      });

      expect(result.hasFailed).toBe(true);
    });

    it("should handle non-credits program transaction", async () => {
      const nonCreditsTx = getMockedPublicTransaction({
        ...mockRawTx,
        program_id: "custom.aleo",
      });

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: nonCreditsTx,
        address: mockAddress,
        ledgerAccountId: mockAccountId,
      });

      expect(apiClient.getTransactionById).not.toHaveBeenCalled();
      expect(result.type).toBe("NONE");
      expect(result.fee).toEqual(new BigNumber(0));
      expect(result.blockHash).toBeNull();
    });

    it("should generate correct operation id", async () => {
      const mockTxDetails = getMockedTransactionDetails("at1test123");

      jest.mocked(apiClient.getTransactionById).mockResolvedValueOnce(mockTxDetails);

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: mockRawTx,
        address: mockAddress,
        ledgerAccountId: mockAccountId,
      });

      const expectedId = encodeOperationId(mockAccountId, "at1test123", "IN");
      expect(result.id).toBe(expectedId);
    });

    it("should parse timestamp correctly", async () => {
      const mockTxDetails = getMockedTransactionDetails("at1test123");

      jest.mocked(apiClient.getTransactionById).mockResolvedValueOnce(mockTxDetails);

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: mockRawTx,
        address: mockAddress,
        ledgerAccountId: mockAccountId,
      });

      const expectedDate = new Date(Number("1709079312") * 1000);
      expect(result.date).toEqual(expectedDate);
    });

    it("should call determineTransactionType with correct parameters", async () => {
      const mockTxDetails = getMockedTransactionDetails("at1test123");

      jest.mocked(apiClient.getTransactionById).mockResolvedValueOnce(mockTxDetails);

      await parseOperation({
        currency: mockCurrency,
        rawTx: mockRawTx,
        address: mockAddress,
        ledgerAccountId: mockAccountId,
      });

      expect(determineTransactionType).toHaveBeenCalledTimes(1);
      expect(determineTransactionType).toHaveBeenCalledWith("transfer_public", "IN");
    });

    it("should handle zero amount transaction", async () => {
      const zeroAmountTx = getMockedPublicTransaction({
        ...mockRawTx,
        amount: 0,
      });

      const mockTxDetails = getMockedTransactionDetails("at1test123");

      jest.mocked(apiClient.getTransactionById).mockResolvedValueOnce(mockTxDetails);

      const result = await parseOperation({
        currency: mockCurrency,
        rawTx: zeroAmountTx,
        address: mockAddress,
        ledgerAccountId: mockAccountId,
      });

      expect(result.value).toEqual(new BigNumber(0));
    });
  });
});
