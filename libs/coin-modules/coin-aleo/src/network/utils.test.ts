import { PROGRAM_ID } from "../constants";
import { getMockedCurrency } from "../__tests__/fixtures/currency.fixture";
import {
  getMockedPublicTransaction,
  getMockedTransactionDetails,
} from "../__tests__/fixtures/transaction.fixture";
import { apiClient } from "./api";
import { fetchAccountTransactionsFromHeight, enrichTransaction } from "./utils";

jest.mock("./api");

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
});
