import { enrichTransaction, fetchAccountTransactionsFromHeight } from "../network/utils";
import {
  getMockedEnrichedTransaction,
  getMockedTransaction,
} from "../__tests__/fixtures/api.fixture";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import {
  getMockedAlpacaOperation,
  getMockedOperation,
} from "../__tests__/fixtures/operation.fixture";
import { toAlpacaOperation, toBridgeOperation } from "./utils";
import { listOperations } from "./listOperations";

jest.mock("../network/utils");
jest.mock("./utils");

const mockEnrichTransaction = jest.mocked(enrichTransaction);
const mockFetchAccountTransactionsFromHeight = jest.mocked(fetchAccountTransactionsFromHeight);
const mockToAlpacaOperation = jest.mocked(toAlpacaOperation);
const mockToBridgeOperation = jest.mocked(toBridgeOperation);

describe("listOperations", () => {
  const mockCurrency = getMockedCurrency();
  const mockAddress = "aleo1test";
  const mockLedgerAccountId = "js:2:aleo:aleo1test:";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("bridge mode", () => {
    it("should fetch and parse transactions in bridge mode", async () => {
      const mockTx1 = getMockedTransaction({ transaction_id: "tx1", block_number: 100 });
      const mockTx2 = getMockedTransaction({ transaction_id: "tx2", block_number: 101 });
      const mockEnriched1 = getMockedEnrichedTransaction();
      const mockEnriched2 = getMockedEnrichedTransaction();
      const mockOp1 = getMockedOperation({ id: "op1", blockHeight: 100 });
      const mockOp2 = getMockedOperation({ id: "op2", blockHeight: 101 });

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [mockTx1, mockTx2],
        nextCursor: mockTx2.block_number.toString(),
      });
      mockEnrichTransaction
        .mockResolvedValueOnce(mockEnriched1)
        .mockResolvedValueOnce(mockEnriched2);
      mockToBridgeOperation.mockReturnValueOnce(mockOp1).mockReturnValueOnce(mockOp2);

      const result = await listOperations({
        currency: mockCurrency,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        mode: "bridge",
        pagination: { minHeight: 0, order: "asc" },
      });

      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledTimes(1);
      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledWith({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: true,
        minBlockHeight: 0,
        order: "asc",
      });
      expect(mockEnrichTransaction).toHaveBeenCalledTimes(2);
      expect(mockToBridgeOperation).toHaveBeenCalledTimes(2);
      expect(mockToAlpacaOperation).not.toHaveBeenCalled();
      expect(result.operations).toEqual([mockOp1, mockOp2]);
      expect(result.nextCursor).toBe(mockTx2.block_number.toString());
    });

    it("should call toBridgeOperation with ledgerAccountId, enriched transaction, and address", async () => {
      const mockTx = getMockedTransaction({ transaction_id: "tx1" });
      const mockEnriched = getMockedEnrichedTransaction();
      const mockOp = getMockedOperation({ id: "op1" });

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [mockTx],
        nextCursor: null,
      });
      mockEnrichTransaction.mockResolvedValue(mockEnriched);
      mockToBridgeOperation.mockReturnValue(mockOp);

      await listOperations({
        currency: mockCurrency,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        mode: "bridge",
        pagination: { minHeight: 0 },
      });

      expect(mockEnrichTransaction).toHaveBeenCalledTimes(1);
      expect(mockToBridgeOperation).toHaveBeenCalledTimes(1);
      expect(mockToBridgeOperation).toHaveBeenCalledWith(
        mockLedgerAccountId,
        mockEnriched,
        mockAddress,
      );
    });

    it("should return empty operations when no transactions found", async () => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [],
        nextCursor: null,
      });

      const result = await listOperations({
        currency: mockCurrency,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        mode: "bridge",
        pagination: { minHeight: 0 },
      });

      expect(mockEnrichTransaction).not.toHaveBeenCalled();
      expect(result.operations).toEqual([]);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("alpaca mode", () => {
    it("should fetch and transform transactions in alpaca mode", async () => {
      const mockTx = getMockedTransaction({ transaction_id: "tx1", block_number: 100 });
      const mockEnriched = getMockedEnrichedTransaction();
      const mockAlpacaOp = getMockedAlpacaOperation({ id: "tx1" });

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [mockTx],
        nextCursor: null,
      });
      mockEnrichTransaction.mockResolvedValue(mockEnriched);
      mockToAlpacaOperation.mockReturnValue(mockAlpacaOp);

      const result = await listOperations({
        currency: mockCurrency,
        address: mockAddress,
        mode: "alpaca",
        pagination: { minHeight: 0, order: "asc" },
      });

      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledTimes(1);
      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledWith({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: false,
        minBlockHeight: 0,
        order: "asc",
      });
      expect(mockEnrichTransaction).toHaveBeenCalledTimes(1);
      expect(mockToAlpacaOperation).toHaveBeenCalledTimes(1);
      expect(mockToAlpacaOperation).toHaveBeenCalledWith(mockEnriched, mockAddress);
      expect(mockToBridgeOperation).not.toHaveBeenCalled();
      expect(result.operations).toEqual([mockAlpacaOp]);
      expect(result.nextCursor).toBeNull();
    });

    it("should return empty operations when no transactions found", async () => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [],
        nextCursor: null,
      });

      const result = await listOperations({
        currency: mockCurrency,
        address: mockAddress,
        mode: "alpaca",
        pagination: { minHeight: 0 },
      });

      expect(mockEnrichTransaction).not.toHaveBeenCalled();
      expect(result.operations).toEqual([]);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("pagination parameters", () => {
    it("should pass pagination parameters correctly to fetchAccountTransactionsFromHeight", async () => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [],
        nextCursor: null,
      });

      await listOperations({
        currency: mockCurrency,
        address: mockAddress,
        mode: "alpaca",
        pagination: {
          minHeight: 1000,
          lastPagingToken: "500",
          limit: 20,
          order: "desc",
        },
      });

      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledTimes(1);
      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledWith({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: false,
        minBlockHeight: 1000,
        cursor: "500",
        limit: 20,
        order: "desc",
      });
    });

    it("should call enrichTransaction with currency and rawTx (no address)", async () => {
      const mockTx = getMockedTransaction({ transaction_id: "tx1" });

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [mockTx],
        nextCursor: null,
      });
      mockEnrichTransaction.mockResolvedValue(getMockedEnrichedTransaction());
      mockToAlpacaOperation.mockReturnValue(getMockedAlpacaOperation({ id: "tx1" }));

      await listOperations({
        currency: mockCurrency,
        address: mockAddress,
        mode: "alpaca",
        pagination: { minHeight: 0 },
      });

      expect(mockEnrichTransaction).toHaveBeenCalledTimes(1);
      expect(mockEnrichTransaction).toHaveBeenCalledWith({
        currency: mockCurrency,
        rawTx: mockTx,
      });
    });
  });
});
