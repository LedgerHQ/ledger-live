import { fetchAccountTransactionsFromHeight } from "../network/utils";
import { apiClient } from "../network/api";
import {
  getMockedTransaction,
  getMockedTransactionDetails,
} from "../__tests__/fixtures/api.fixture";
import { getMockedConfig } from "../__tests__/fixtures/config.fixture";
import {
  getMockedCurrency,
  getMockedTokenCurrency,
  MOCK_TOKEN_PROGRAM_ID,
} from "../__tests__/fixtures/currency.fixture";
import {
  getMockedCoinFrameworkOperation,
  getMockedOperation,
} from "../__tests__/fixtures/operation.fixture";
import { detectFeePayer, getCalTokens, toCoinFrameworkOperation, toBridgeOperation } from "./utils";
import { FEE_SPONSOR } from "../constants";
import { listOperations } from "./listOperations";

jest.mock("../network/utils");
jest.mock("../network/api");
jest.mock("./utils");

const mockFetchAccountTransactionsFromHeight = jest.mocked(fetchAccountTransactionsFromHeight);
const mockToCoinFrameworkOperation = jest.mocked(toCoinFrameworkOperation);
const mockToBridgeOperation = jest.mocked(toBridgeOperation);
const mockGetCalTokens = jest.mocked(getCalTokens);
const mockGetTransactionById = jest.mocked(apiClient.getTransactionById);
const mockDetectFeePayer = jest.mocked(detectFeePayer);

const mockConfig = getMockedConfig("mainnet"); // isFeeSponsored: true by default
const mockConfigNoSponsorship = { ...mockConfig, isFeeSponsored: false };
const mockConfigWithTokens = { ...mockConfig, enableTokens: true };
const mockTokenCurrency = getMockedTokenCurrency();

describe("listOperations", () => {
  const mockCurrency = getMockedCurrency();
  const mockAddress = "aleo1test";
  const mockLedgerAccountId = "js:2:aleo:aleo1test:";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCalTokens.mockResolvedValue(new Map());
    // Default: no sponsored fee detected — keeps existing test assertions stable
    mockGetTransactionById.mockResolvedValue(getMockedTransactionDetails());
    mockDetectFeePayer.mockReturnValue(undefined);
  });

  describe("bridge mode", () => {
    it("should fetch and parse transactions in bridge mode", async () => {
      const mockTx1 = getMockedTransaction({ transaction_id: "tx1", block_number: 100 });
      const mockTx2 = getMockedTransaction({ transaction_id: "tx2", block_number: 101 });
      const mockOp1 = getMockedOperation({ id: "op1", blockHeight: 100 });
      const mockOp2 = getMockedOperation({ id: "op2", blockHeight: 101 });

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [mockTx1, mockTx2],
        nextCursor: mockTx2.block_number.toString(),
      });
      mockToBridgeOperation.mockReturnValueOnce(mockOp1).mockReturnValueOnce(mockOp2);

      const result = await listOperations({
        config: mockConfig,
        currency: mockCurrency,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        mode: "bridge",
        options: { minHeight: 0, order: "asc" },
      });

      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledTimes(1);
      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledWith({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: true,
        minBlockHeight: 0,
        order: "asc",
      });
      expect(mockToBridgeOperation).toHaveBeenCalledTimes(2);
      expect(mockToCoinFrameworkOperation).not.toHaveBeenCalled();
      expect(mockGetCalTokens).not.toHaveBeenCalled();
      expect(result.operations).toEqual([mockOp1, mockOp2]);
      expect(result.tokenOperations).toEqual([]);
      expect(result.nextCursor).toBe(mockTx2.block_number.toString());
      expect(result.calTokens).toEqual(new Map());
    });

    it("should call toBridgeOperation with isTokenTx false when tokens are disabled", async () => {
      const mockTx = getMockedTransaction({ transaction_id: "tx1" });
      const mockOp = getMockedOperation({ id: "op1" });

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [mockTx],
        nextCursor: null,
      });
      mockToBridgeOperation.mockReturnValue(mockOp);

      await listOperations({
        config: mockConfig,
        currency: mockCurrency,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        mode: "bridge",
        options: { minHeight: 0 },
      });

      expect(mockToBridgeOperation).toHaveBeenCalledTimes(1);
      expect(mockToBridgeOperation).toHaveBeenCalledWith(
        mockLedgerAccountId,
        mockTx,
        mockAddress,
        false,
      );
      expect(mockGetCalTokens).not.toHaveBeenCalled();
    });

    it("should return empty operations when no transactions found", async () => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [],
        nextCursor: null,
      });

      const result = await listOperations({
        config: mockConfig,
        currency: mockCurrency,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        mode: "bridge",
        options: { minHeight: 0 },
      });

      expect(result.operations).toEqual([]);
      expect(result.tokenOperations).toEqual([]);
      expect(result.nextCursor).toBeNull();
      expect(result.calTokens).toEqual(new Map());
    });

    describe("with tokens enabled", () => {
      it("should resolve CAL tokens and split token operations from coin operations", async () => {
        const tokenTx = getMockedTransaction({
          transaction_id: "token-tx",
          program_id: MOCK_TOKEN_PROGRAM_ID,
        });
        const nativeTx = getMockedTransaction({
          transaction_id: "native-tx",
          program_id: "credits.aleo",
        });
        const tokenOp = getMockedOperation({
          id: "token-op",
          extra: {
            functionId: "transfer_public",
            transactionType: "public",
            programId: MOCK_TOKEN_PROGRAM_ID,
          },
        });
        const nativeOp = getMockedOperation({ id: "native-op" });
        const calTokens = new Map([[MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency]]);

        mockFetchAccountTransactionsFromHeight.mockResolvedValue({
          transactions: [tokenTx, nativeTx],
          nextCursor: null,
        });
        mockGetCalTokens.mockResolvedValue(calTokens);
        mockToBridgeOperation.mockImplementation((_ledgerAccountId, rawTx, address, isTokenTx) => {
          if (rawTx.program_id === MOCK_TOKEN_PROGRAM_ID) {
            expect(isTokenTx).toBe(true);
            return tokenOp;
          }
          expect(isTokenTx).toBe(false);
          return nativeOp;
        });

        const result = await listOperations({
          config: mockConfigWithTokens,
          currency: mockCurrency,
          address: mockAddress,
          ledgerAccountId: mockLedgerAccountId,
          mode: "bridge",
          options: { minHeight: 0, order: "asc" },
        });

        expect(mockGetCalTokens).toHaveBeenCalledWith({
          currencyId: mockCurrency.id,
          programNames: [MOCK_TOKEN_PROGRAM_ID, "credits.aleo"],
        });
        expect(result.operations).toEqual([tokenOp, nativeOp]);
        expect(result.tokenOperations).toEqual([tokenOp]);
        expect(result.calTokens).toEqual(calTokens);
      });

      it("should not populate tokenOperations when CAL returns no matching tokens", async () => {
        const unknownTokenTx = getMockedTransaction({
          transaction_id: "unknown-tx",
          program_id: "unknown_token.aleo",
        });
        const mockOp = getMockedOperation({ id: "unknown-op" });

        mockFetchAccountTransactionsFromHeight.mockResolvedValue({
          transactions: [unknownTokenTx],
          nextCursor: null,
        });
        mockGetCalTokens.mockResolvedValue(new Map());
        mockToBridgeOperation.mockReturnValue(mockOp);

        const result = await listOperations({
          config: mockConfigWithTokens,
          currency: mockCurrency,
          address: mockAddress,
          ledgerAccountId: mockLedgerAccountId,
          mode: "bridge",
          options: { minHeight: 0 },
        });

        expect(mockToBridgeOperation).toHaveBeenCalledWith(
          mockLedgerAccountId,
          unknownTokenTx,
          mockAddress,
          false,
        );
        expect(result.operations).toEqual([mockOp]);
        expect(result.tokenOperations).toEqual([]);
      });

      it("should include multiple token operations when several CAL tokens are present", async () => {
        const secondProgramId = "usad_stablecoin.aleo";
        const secondTokenCurrency = getMockedTokenCurrency({
          id: "aleo/token/usad_stablecoin.aleo",
          contractAddress: secondProgramId,
          ticker: "USAD",
        });
        const tx1 = getMockedTransaction({
          transaction_id: "tx-1",
          program_id: MOCK_TOKEN_PROGRAM_ID,
        });
        const tx2 = getMockedTransaction({ transaction_id: "tx-2", program_id: secondProgramId });
        const op1 = getMockedOperation({ id: "op-1", hash: "tx-1" });
        const op2 = getMockedOperation({ id: "op-2", hash: "tx-2" });
        const calTokens = new Map([
          [MOCK_TOKEN_PROGRAM_ID, mockTokenCurrency],
          [secondProgramId, secondTokenCurrency],
        ]);

        mockFetchAccountTransactionsFromHeight.mockResolvedValue({
          transactions: [tx1, tx2],
          nextCursor: null,
        });
        mockGetCalTokens.mockResolvedValue(calTokens);
        mockToBridgeOperation.mockReturnValueOnce(op1).mockReturnValueOnce(op2);

        const result = await listOperations({
          config: mockConfigWithTokens,
          currency: mockCurrency,
          address: mockAddress,
          ledgerAccountId: mockLedgerAccountId,
          mode: "bridge",
          options: { minHeight: 0 },
        });

        expect(mockToBridgeOperation).toHaveBeenNthCalledWith(
          1,
          mockLedgerAccountId,
          tx1,
          mockAddress,
          true,
        );
        expect(mockToBridgeOperation).toHaveBeenNthCalledWith(
          2,
          mockLedgerAccountId,
          tx2,
          mockAddress,
          true,
        );
        expect(result.tokenOperations).toEqual([op1, op2]);
      });
    });
  });

  describe("coin-framework mode", () => {
    it("should fetch and transform transactions in coin-framework mode", async () => {
      const mockTx = getMockedTransaction({ transaction_id: "tx1", block_number: 100 });
      const mockCoinFrameworkOp = getMockedCoinFrameworkOperation({ id: "tx1" });

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [mockTx],
        nextCursor: null,
      });
      mockToCoinFrameworkOperation.mockReturnValue(mockCoinFrameworkOp);

      const result = await listOperations({
        config: mockConfig,
        currency: mockCurrency,
        address: mockAddress,
        mode: "coin-framework",
        options: { minHeight: 0, order: "asc" },
      });

      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledTimes(1);
      expect(mockFetchAccountTransactionsFromHeight).toHaveBeenCalledWith({
        currency: mockCurrency,
        address: mockAddress,
        fetchAllPages: false,
        minBlockHeight: 0,
        order: "asc",
      });
      expect(mockToCoinFrameworkOperation).toHaveBeenCalledTimes(1);
      expect(mockToCoinFrameworkOperation).toHaveBeenCalledWith(mockTx, mockAddress);
      expect(mockToBridgeOperation).not.toHaveBeenCalled();
      expect(result.operations).toEqual([mockCoinFrameworkOp]);
      expect(result.tokenOperations).toEqual([]);
      expect(result.nextCursor).toBeNull();
      expect(result.calTokens).toEqual(new Map());
      expect(mockGetCalTokens).not.toHaveBeenCalled();
    });

    it("should return empty operations when no transactions found", async () => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [],
        nextCursor: null,
      });

      const result = await listOperations({
        config: mockConfig,
        currency: mockCurrency,
        address: mockAddress,
        mode: "coin-framework",
        options: { minHeight: 0 },
      });

      expect(result.operations).toEqual([]);
      expect(result.tokenOperations).toEqual([]);
      expect(result.nextCursor).toBeNull();
      expect(result.calTokens).toEqual(new Map());
    });

    it("should not call getCalTokens even when enableTokens is true", async () => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [],
        nextCursor: null,
      });

      await listOperations({
        config: mockConfigWithTokens,
        currency: mockCurrency,
        address: mockAddress,
        mode: "coin-framework",
        options: { minHeight: 0 },
      });

      expect(mockGetCalTokens).not.toHaveBeenCalled();
    });
  });

  describe("fee sponsorship enrichment", () => {
    it("should not fetch details when isFeeSponsored is false", async () => {
      const mockTx = getMockedTransaction({ transaction_id: "tx1" });
      const mockOp = getMockedOperation({ id: "op1", type: "OUT" });
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [mockTx],
        nextCursor: null,
      });
      mockToBridgeOperation.mockReturnValue(mockOp);

      await listOperations({
        config: mockConfigNoSponsorship,
        currency: mockCurrency,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        mode: "bridge",
        options: { minHeight: 0 },
      });

      expect(mockGetTransactionById).not.toHaveBeenCalled();
      expect(mockDetectFeePayer).not.toHaveBeenCalled();
    });

    it("should fetch details only for OUT operations when isFeeSponsored is true", async () => {
      const outTx = getMockedTransaction({ transaction_id: "tx-out" });
      const inTx = getMockedTransaction({ transaction_id: "tx-in" });
      const outOp = getMockedOperation({ id: "op-out", hash: "tx-out", type: "OUT" });
      const inOp = getMockedOperation({ id: "op-in", hash: "tx-in", type: "IN" });
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [outTx, inTx],
        nextCursor: null,
      });
      mockToBridgeOperation.mockReturnValueOnce(outOp).mockReturnValueOnce(inOp);

      await listOperations({
        config: mockConfig,
        currency: mockCurrency,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        mode: "bridge",
        options: { minHeight: 0 },
      });

      expect(mockGetTransactionById).toHaveBeenCalledTimes(1);
      expect(mockGetTransactionById).toHaveBeenCalledWith(mockCurrency, "tx-out");
      expect(mockDetectFeePayer).toHaveBeenCalledTimes(1);
    });

    it("should set feePayer on the operation when detectFeePayer returns a sponsor", async () => {
      const mockTx = getMockedTransaction({ transaction_id: "tx-sponsored" });
      const mockOp = getMockedOperation({
        id: "op-sponsored",
        hash: "tx-sponsored",
        type: "OUT",
        extra: { functionId: "transfer_public", transactionType: "public" },
      });
      const mockDetails = getMockedTransactionDetails("tx-sponsored");
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [mockTx],
        nextCursor: null,
      });
      mockToBridgeOperation.mockReturnValue(mockOp);
      mockGetTransactionById.mockResolvedValue(mockDetails);
      mockDetectFeePayer.mockReturnValue(FEE_SPONSOR);

      const result = await listOperations({
        config: mockConfig,
        currency: mockCurrency,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        mode: "bridge",
        options: { minHeight: 0 },
      });

      expect(result.operations).toHaveLength(1);
      expect((result.operations[0] as (typeof mockOp)).extra.feePayer).toBe(FEE_SPONSOR);
    });

    it("should not alter the operation when detectFeePayer returns undefined", async () => {
      const mockTx = getMockedTransaction({ transaction_id: "tx-self-paid" });
      const mockOp = getMockedOperation({ id: "op-self-paid", hash: "tx-self-paid", type: "OUT" });
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [mockTx],
        nextCursor: null,
      });
      mockToBridgeOperation.mockReturnValue(mockOp);
      mockDetectFeePayer.mockReturnValue(undefined);

      const result = await listOperations({
        config: mockConfig,
        currency: mockCurrency,
        address: mockAddress,
        ledgerAccountId: mockLedgerAccountId,
        mode: "bridge",
        options: { minHeight: 0 },
      });

      expect(result.operations[0]).toBe(mockOp);
    });

    it("should not fetch details in coin-framework mode even when isFeeSponsored is true", async () => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [getMockedTransaction({ transaction_id: "tx1" })],
        nextCursor: null,
      });
      mockToCoinFrameworkOperation.mockReturnValue(getMockedCoinFrameworkOperation({ id: "tx1" }));

      await listOperations({
        config: mockConfig,
        currency: mockCurrency,
        address: mockAddress,
        mode: "coin-framework",
        options: { minHeight: 0 },
      });

      expect(mockGetTransactionById).not.toHaveBeenCalled();
    });
  });

  describe("options parameters", () => {
    it("should pass options parameters correctly to fetchAccountTransactionsFromHeight", async () => {
      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [],
        nextCursor: null,
      });

      await listOperations({
        config: mockConfig,
        currency: mockCurrency,
        address: mockAddress,
        mode: "coin-framework",
        options: {
          minHeight: 1000,
          cursor: "500",
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
  });
});
