import BigNumber from "bignumber.js";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import {
  getMockedTransaction,
  getMockedTransactionDetails,
} from "../__tests__/fixtures/api.fixture";
import { PROGRAM_ID } from "../constants";
import { apiClient } from "./api";
import { fetchAccountTransactionsFromHeight, parseOperation } from "./utils";

jest.mock("./api");

const mockGetAccountPublicTransactions =
  apiClient.getAccountPublicTransactions as jest.MockedFunction<
    typeof apiClient.getAccountPublicTransactions
  >;
const mockGetTransactionById = apiClient.getTransactionById as jest.MockedFunction<
  typeof apiClient.getTransactionById
>;

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

      expect(mockGetTransactionById).toHaveBeenCalledWith(mockCurrency, mockTx.transaction_id);
      expect(result).toMatchObject({
        fee: new BigNumber(5000),
        blockHash: mockTxDetails.block_hash,
      });
    });
  });
});
