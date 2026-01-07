import BigNumber from "bignumber.js";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import { calculateTransactionInfo } from "./calculateTransactionInfo";
import { Transaction } from "../types";
import { ImpossibleToCalculateAmountAndFees } from "../errors";
import { calculateGasFees } from "./calculateGasFees";

// Mock dependencies
jest.mock("./calculateGasFees");

const mockedCalculateGasFees = jest.mocked(calculateGasFees);

describe("calculateTransactionInfo", () => {
  const mockAccount: Account = {
    type: "Account",
    id: "vechain:1:0x123:",
    seedIdentifier: "seed123",
    derivationMode: "" as any,
    index: 0,
    freshAddress: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
    freshAddressPath: "44'/818'/0'/0/0",
    used: true,
    balance: new BigNumber("5000000000000000000"), // 5 VET
    spendableBalance: new BigNumber("5000000000000000000"),
    creationDate: new Date("2022-01-01"),
    blockHeight: 12345,
    currency: {} as any,
    operationsCount: 10,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date("2022-01-01"),
    balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
    swapHistory: [],
    subAccounts: [],
  };

  const mockTokenAccount: TokenAccount = {
    type: "TokenAccount",
    id: "vechain:1:0x123:+0x0000000000000000000000000000456e65726779",
    parentId: "vechain:1:0x123:",
    token: {} as any,
    balance: new BigNumber("1000000000000000000000"), // 1000 VTHO
    spendableBalance: new BigNumber("1000000000000000000000"),
    creationDate: new Date("2022-01-01"),
    operationsCount: 5,
    operations: [],
    pendingOperations: [],
    balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
    swapHistory: [],
  };

  const mockBaseTransaction: Transaction = {
    family: "vechain",
    recipient: "0x456789012345678901234567890123456789abcd",
    amount: new BigNumber("1000000000000000000"), // 1 VET/VTHO
    estimatedFees: "0",
    body: {},
  } as Transaction;

  const mockGasFeesResult = {
    estimatedGas: 21000,
    estimatedGasFees: new BigNumber("210000000000000000"), // 0.21 VET
    maxFeePerGas: 10000000000000,
    maxPriorityFeePerGas: 1000000000000,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCalculateGasFees.mockResolvedValue(mockGasFeesResult);
  });

  describe("VET transactions", () => {
    it("should calculate transaction info for normal VET transaction", async () => {
      const result = await calculateTransactionInfo(mockAccount, mockBaseTransaction);

      expect(result).toEqual({
        isTokenAccount: false,
        amount: new BigNumber("1000000000000000000"),
        spendableBalance: new BigNumber("5000000000000000000"),
        balance: new BigNumber("5000000000000000000"),
        tokenAccount: undefined,
        estimatedFees: "210000000000000000",
        estimatedGas: 21000,
        maxFeePerGas: 10000000000000,
        maxPriorityFeePerGas: 1000000000000,
      });
    });

    it("should handle useAllAmount for VET transaction", async () => {
      const useAllAmountTransaction: Transaction = {
        ...mockBaseTransaction,
        useAllAmount: true,
      };

      const result = await calculateTransactionInfo(mockAccount, useAllAmountTransaction);

      expect(result.amount).toEqual(new BigNumber("5000000000000000000"));
      expect(result.spendableBalance).toEqual(new BigNumber("5000000000000000000"));
    });

    it("should call calculateGasFees with correct parameters for VET", async () => {
      await calculateTransactionInfo(mockAccount, mockBaseTransaction);

      expect(mockedCalculateGasFees).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: new BigNumber("1000000000000000000"),
        }),
        false,
        mockAccount.freshAddress,
      );
    });
  });

  describe("Token transactions", () => {
    const mockAccountWithToken: Account = {
      ...mockAccount,
      subAccounts: [mockTokenAccount],
    };

    const mockTokenTransaction: Transaction = {
      ...mockBaseTransaction,
      subAccountId: "vechain:1:0x123:+0x0000000000000000000000000000456e65726779",
    };

    it("should calculate transaction info for normal token transaction", async () => {
      const result = await calculateTransactionInfo(mockAccountWithToken, mockTokenTransaction);

      expect(result).toEqual({
        isTokenAccount: true,
        amount: new BigNumber("1000000000000000000"),
        spendableBalance: new BigNumber("999790000000000000000"), // token balance - gas fees
        balance: new BigNumber("1000000000000000000000"),
        tokenAccount: mockTokenAccount,
        estimatedFees: "210000000000000000",
        estimatedGas: 21000,
        maxFeePerGas: 10000000000000,
        maxPriorityFeePerGas: 1000000000000,
      });
    });

    it("should handle useAllAmount for token transaction", async () => {
      const useAllAmountTokenTransaction: Transaction = {
        ...mockTokenTransaction,
        useAllAmount: true,
      };

      const result = await calculateTransactionInfo(
        mockAccountWithToken,
        useAllAmountTokenTransaction,
      );

      expect(result.amount).toEqual(new BigNumber("999790000000000000000"));
      expect(result.spendableBalance).toEqual(new BigNumber("999790000000000000000"));
    });

    it("should handle token transaction when gas fees exceed balance", async () => {
      const highGasResult = {
        ...mockGasFeesResult,
        estimatedGasFees: new BigNumber("2000000000000000000000"), // 2000 VET (more than token balance)
      };
      mockedCalculateGasFees.mockResolvedValue(highGasResult);

      const result = await calculateTransactionInfo(mockAccountWithToken, mockTokenTransaction);

      expect(result.spendableBalance).toEqual(new BigNumber("0"));
    });

    it("should call calculateGasFees with correct parameters for token", async () => {
      await calculateTransactionInfo(mockAccountWithToken, mockTokenTransaction);

      expect(mockedCalculateGasFees).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: new BigNumber("1000000000000000000"),
        }),
        true,
        mockAccount.freshAddress,
      );
    });

    it("should handle missing token account", async () => {
      const transactionWithNonExistentToken: Transaction = {
        ...mockTokenTransaction,
        subAccountId: "vechain:1:0x123:+nonexistent",
      };

      const result = await calculateTransactionInfo(
        mockAccountWithToken,
        transactionWithNonExistentToken,
      );

      expect(result.isTokenAccount).toBe(false);
      expect(result.tokenAccount).toBeUndefined();
    });
  });

  describe("Fixed gas fees", () => {
    const fixedGasFees = {
      estimatedGas: 50000,
      estimatedGasFees: new BigNumber("500000000000000000"),
      maxFeePerGas: 20000000000000,
      maxPriorityFeePerGas: 2000000000000,
    };

    it("should use fixed gas fees when provided", async () => {
      const result = await calculateTransactionInfo(mockAccount, mockBaseTransaction, fixedGasFees);

      expect(mockedCalculateGasFees).not.toHaveBeenCalled();
      expect(result.estimatedFees).toBe("500000000000000000");
      expect(result.estimatedGas).toBe(50000);
      expect(result.maxFeePerGas).toBe(20000000000000);
      expect(result.maxPriorityFeePerGas).toBe(2000000000000);
    });

    it("should use fixed gas fees for token transactions", async () => {
      const mockAccountWithToken: Account = {
        ...mockAccount,
        subAccounts: [mockTokenAccount],
      };

      const mockTokenTransaction: Transaction = {
        ...mockBaseTransaction,
        subAccountId: "vechain:1:0x123:+0x0000000000000000000000000000456e65726779",
      };

      const result = await calculateTransactionInfo(
        mockAccountWithToken,
        mockTokenTransaction,
        fixedGasFees,
      );

      expect(mockedCalculateGasFees).not.toHaveBeenCalled();
      expect(result.estimatedFees).toBe("500000000000000000");
    });
  });

  describe("Circular dependency resolution", () => {
    it("should handle iterative calculation when useAllAmount changes values", async () => {
      // Mock calculateGasFees to return different values based on amount
      mockedCalculateGasFees
        .mockResolvedValueOnce({
          estimatedGas: 21000,
          estimatedGasFees: new BigNumber("210000000000000000"),
          maxFeePerGas: 10000000000000,
          maxPriorityFeePerGas: 1000000000000,
        })
        .mockResolvedValueOnce({
          estimatedGas: 21000,
          estimatedGasFees: new BigNumber("210000000000000000"),
          maxFeePerGas: 10000000000000,
          maxPriorityFeePerGas: 1000000000000,
        });

      const useAllAmountTransaction: Transaction = {
        ...mockBaseTransaction,
        useAllAmount: true,
      };

      const result = await calculateTransactionInfo(mockAccount, useAllAmountTransaction);

      expect(result.amount).toEqual(new BigNumber("5000000000000000000"));
      expect(mockedCalculateGasFees).toHaveBeenCalledTimes(2);
    });

    it("should throw error when max iterations reached", async () => {
      // Create a token account scenario where gas fees can affect spendableBalance
      const mockAccountWithToken: Account = {
        ...mockAccount,
        subAccounts: [mockTokenAccount],
      };

      const mockTokenTransaction: Transaction = {
        ...mockBaseTransaction,
        subAccountId: "vechain:1:0x123:+0x0000000000000000000000000000456e65726779",
        useAllAmount: true,
      };

      // Mock calculateGasFees to always return incrementally higher fees
      let callCount = 0;
      mockedCalculateGasFees.mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          estimatedGas: 21000,
          estimatedGasFees: new BigNumber(`${100000000000000000 + callCount * 100000000000000000}`), // Incremental fees
          maxFeePerGas: 10000000000000,
          maxPriorityFeePerGas: 1000000000000,
        });
      });

      await expect(
        calculateTransactionInfo(mockAccountWithToken, mockTokenTransaction),
      ).rejects.toThrow(ImpossibleToCalculateAmountAndFees);
    });

    it("should stop iterating when amount stabilizes", async () => {
      const constantGasResult = {
        estimatedGas: 21000,
        estimatedGasFees: new BigNumber("210000000000000000"),
        maxFeePerGas: 10000000000000,
        maxPriorityFeePerGas: 1000000000000,
      };

      mockedCalculateGasFees.mockResolvedValue(constantGasResult);

      const useAllAmountTransaction: Transaction = {
        ...mockBaseTransaction,
        useAllAmount: true,
      };

      await calculateTransactionInfo(mockAccount, useAllAmountTransaction);

      // Should be called at least once, might be called twice in the loop
      expect(mockedCalculateGasFees).toHaveBeenCalledTimes(2);
    });
  });

  describe("NaN amount handling", () => {
    it("should handle NaN amount without calling calculateGasFees", async () => {
      const nanAmountTransaction: Transaction = {
        ...mockBaseTransaction,
        amount: new BigNumber(NaN),
      };

      const result = await calculateTransactionInfo(mockAccount, nanAmountTransaction);

      expect(mockedCalculateGasFees).not.toHaveBeenCalled();
      expect(result.amount.isNaN()).toBe(true);
      expect(result.estimatedFees).toBe("0");
      expect(result.estimatedGas).toBe(0);
    });

    it("should use account balance and spendableBalance for NaN amount", async () => {
      const nanAmountTransaction: Transaction = {
        ...mockBaseTransaction,
        amount: new BigNumber(NaN),
      };

      const result = await calculateTransactionInfo(mockAccount, nanAmountTransaction);

      expect(result.balance).toEqual(mockAccount.balance);
      expect(result.spendableBalance).toEqual(mockAccount.balance);
    });
  });

  describe("Edge cases", () => {
    it("should handle account without subAccounts", async () => {
      const accountWithoutSubAccounts: Account = {
        ...mockAccount,
        subAccounts: [],
      };

      const result = await calculateTransactionInfo(accountWithoutSubAccounts, mockBaseTransaction);

      expect(result.isTokenAccount).toBe(false);
      expect(result.tokenAccount).toBeUndefined();
    });

    it("should handle empty subAccounts array", async () => {
      const accountWithEmptySubAccounts: Account = {
        ...mockAccount,
        subAccounts: [],
      };

      const tokenTransaction: Transaction = {
        ...mockBaseTransaction,
        subAccountId: "some-id",
      };

      const result = await calculateTransactionInfo(accountWithEmptySubAccounts, tokenTransaction);

      expect(result.isTokenAccount).toBe(false);
      expect(result.tokenAccount).toBeUndefined();
    });

    it("should handle zero balance account", async () => {
      const zeroBalanceAccount: Account = {
        ...mockAccount,
        balance: new BigNumber("0"),
      };

      const result = await calculateTransactionInfo(zeroBalanceAccount, mockBaseTransaction);

      expect(result.balance).toEqual(new BigNumber("0"));
      expect(result.spendableBalance).toEqual(new BigNumber("0"));
    });

    it("should handle zero amount transaction", async () => {
      const zeroAmountTransaction: Transaction = {
        ...mockBaseTransaction,
        amount: new BigNumber("0"),
      };

      const result = await calculateTransactionInfo(mockAccount, zeroAmountTransaction);

      expect(result.amount).toEqual(new BigNumber("0"));
      expect(mockedCalculateGasFees).toHaveBeenCalled();
    });
  });
});
