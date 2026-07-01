import BigNumber from "bignumber.js";
import { fetchAccountTransactionsFromHeight } from "../network/utils";
import { apiClient } from "../network/api";
import { getMockedTransaction, getMockedTransactionDetails } from "../__tests__/fixtures/api.fixture";
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
import {
  getCalTokens,
  toCoinFrameworkOperation,
  toBridgeOperation,
  extractStakingAmountFromTransactionDetails,
} from "./utils";
import { listOperations } from "./listOperations";

jest.mock("../network/utils");
jest.mock("../network/api");
jest.mock("./utils");

const mockFetchAccountTransactionsFromHeight = jest.mocked(fetchAccountTransactionsFromHeight);
const mockToCoinFrameworkOperation = jest.mocked(toCoinFrameworkOperation);
const mockToBridgeOperation = jest.mocked(toBridgeOperation);
const mockGetCalTokens = jest.mocked(getCalTokens);
const mockGetTransactionById = jest.mocked(apiClient.getTransactionById);
const mockExtractStakingAmountFromTransactionDetails = jest.mocked(
  extractStakingAmountFromTransactionDetails,
);

const mockConfig = getMockedConfig("mainnet");
const mockConfigWithTokens = { ...mockConfig, enableTokens: true };
const mockTokenCurrency = getMockedTokenCurrency();

describe("listOperations", () => {
  const mockCurrency = getMockedCurrency();
  const mockAddress = "aleo1test";
  const mockLedgerAccountId = "js:2:aleo:aleo1test:";

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCalTokens.mockResolvedValue(new Map());
    mockGetTransactionById.mockResolvedValue(getMockedTransactionDetails());
    mockExtractStakingAmountFromTransactionDetails.mockReturnValue(null);
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

    describe("staking amount enrichment", () => {
      it("should override the value of a bond_public operation with the recovered amount", async () => {
        const bondTx = getMockedTransaction({
          transaction_id: "bond-tx",
          function_id: "bond_public",
          amount: 0,
        });
        const bondOp = getMockedOperation({ id: "bond-op", value: new BigNumber(0) });
        const overriddenAmount = new BigNumber(10000000000);

        mockFetchAccountTransactionsFromHeight.mockResolvedValue({
          transactions: [bondTx],
          nextCursor: null,
        });
        mockToBridgeOperation.mockReturnValue(bondOp);
        mockExtractStakingAmountFromTransactionDetails.mockReturnValue(overriddenAmount);

        const result = await listOperations({
          config: mockConfig,
          currency: mockCurrency,
          address: mockAddress,
          ledgerAccountId: mockLedgerAccountId,
          mode: "bridge",
          options: { minHeight: 0 },
        });

        expect(mockGetTransactionById).toHaveBeenCalledWith(mockCurrency, "bond-tx");
        expect(result.operations[0].value.isEqualTo(overriddenAmount)).toBe(true);
      });

      it("should override the value of an unbond_public operation with the recovered amount", async () => {
        const unbondTx = getMockedTransaction({
          transaction_id: "unbond-tx",
          function_id: "unbond_public",
          amount: 0,
        });
        const unbondOp = getMockedOperation({ id: "unbond-op", value: new BigNumber(0) });
        const overriddenAmount = new BigNumber(5000000);

        mockFetchAccountTransactionsFromHeight.mockResolvedValue({
          transactions: [unbondTx],
          nextCursor: null,
        });
        mockToBridgeOperation.mockReturnValue(unbondOp);
        mockExtractStakingAmountFromTransactionDetails.mockReturnValue(overriddenAmount);

        const result = await listOperations({
          config: mockConfig,
          currency: mockCurrency,
          address: mockAddress,
          ledgerAccountId: mockLedgerAccountId,
          mode: "bridge",
          options: { minHeight: 0 },
        });

        expect(mockGetTransactionById).toHaveBeenCalledWith(mockCurrency, "unbond-tx");
        expect(result.operations[0].value.isEqualTo(overriddenAmount)).toBe(true);
      });

      it("should not fetch transaction details for a transfer_public transaction", async () => {
        const transferTx = getMockedTransaction({
          transaction_id: "transfer-tx",
          function_id: "transfer_public",
          amount: 100000000,
        });
        const transferOp = getMockedOperation({ id: "transfer-op" });

        mockFetchAccountTransactionsFromHeight.mockResolvedValue({
          transactions: [transferTx],
          nextCursor: null,
        });
        mockToBridgeOperation.mockReturnValue(transferOp);

        await listOperations({
          config: mockConfig,
          currency: mockCurrency,
          address: mockAddress,
          ledgerAccountId: mockLedgerAccountId,
          mode: "bridge",
          options: { minHeight: 0 },
        });

        expect(mockGetTransactionById).not.toHaveBeenCalled();
      });

      it("should not fetch transaction details for a claim_unbond_public transaction", async () => {
        const claimTx = getMockedTransaction({
          transaction_id: "claim-tx",
          function_id: "claim_unbond_public",
          amount: 0,
        });
        const claimOp = getMockedOperation({ id: "claim-op" });

        mockFetchAccountTransactionsFromHeight.mockResolvedValue({
          transactions: [claimTx],
          nextCursor: null,
        });
        mockToBridgeOperation.mockReturnValue(claimOp);

        await listOperations({
          config: mockConfig,
          currency: mockCurrency,
          address: mockAddress,
          ledgerAccountId: mockLedgerAccountId,
          mode: "bridge",
          options: { minHeight: 0 },
        });

        expect(mockGetTransactionById).not.toHaveBeenCalled();
      });

      it("should keep the original operation value when getTransactionById rejects", async () => {
        const bondTx = getMockedTransaction({
          transaction_id: "bond-tx-fail",
          function_id: "bond_public",
          amount: 0,
        });
        const originalValue = new BigNumber(0);
        const bondOp = getMockedOperation({ id: "bond-op-fail", value: originalValue });

        mockFetchAccountTransactionsFromHeight.mockResolvedValue({
          transactions: [bondTx],
          nextCursor: null,
        });
        mockToBridgeOperation.mockReturnValue(bondOp);
        mockGetTransactionById.mockRejectedValueOnce(new Error("network fail"));

        const result = await listOperations({
          config: mockConfig,
          currency: mockCurrency,
          address: mockAddress,
          ledgerAccountId: mockLedgerAccountId,
          mode: "bridge",
          options: { minHeight: 0 },
        });

        expect(result.operations[0].value.isEqualTo(originalValue)).toBe(true);
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

    it("should not fetch staking amount details even for a bond_public transaction", async () => {
      const bondTx = getMockedTransaction({
        transaction_id: "bond-tx",
        function_id: "bond_public",
        amount: 0,
      });
      const mockCoinFrameworkOp = getMockedCoinFrameworkOperation({ id: "bond-tx" });

      mockFetchAccountTransactionsFromHeight.mockResolvedValue({
        transactions: [bondTx],
        nextCursor: null,
      });
      mockToCoinFrameworkOperation.mockReturnValue(mockCoinFrameworkOp);

      await listOperations({
        config: mockConfig,
        currency: mockCurrency,
        address: mockAddress,
        mode: "coin-framework",
        options: { minHeight: 0 },
      });

      expect(mockGetTransactionById).not.toHaveBeenCalled();
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
