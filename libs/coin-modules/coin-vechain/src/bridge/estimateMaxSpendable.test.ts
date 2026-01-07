import BigNumber from "bignumber.js";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { calculateGasFees } from "../common-logic";
import { Transaction } from "../types";
import { Account, TokenAccount } from "@ledgerhq/types-live";

// Mock dependencies
jest.mock("../common-logic");

const mockedCalculateGasFees = jest.mocked(calculateGasFees);

describe("estimateMaxSpendable", () => {
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
    id: "vechain:1:0x123:+vtho",
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

  const mockTransaction: Transaction = {
    family: "vechain",
    recipient: "0x456789012345678901234567890123456789abcd",
    amount: new BigNumber("1000000000000000000"),
    estimatedFees: "210000000000000000",
    body: {
      chainTag: 74,
      blockRef: "0x00000000000b2bce",
      expiration: 18,
      clauses: [],
      maxFeePerGas: 10000000000000,
      maxPriorityFeePerGas: 1000000000000,
      gas: 21000,
      dependsOn: null,
      nonce: "0x12345678",
    },
  } as Transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCalculateGasFees.mockResolvedValue({
      estimatedGas: 21000,
      estimatedGasFees: new BigNumber("210000000000000000"), // 0.21 VET
      maxFeePerGas: 10000000000000,
      maxPriorityFeePerGas: 1000000000000,
    });
  });

  describe("Account type handling", () => {
    it("should return account balance for Account type", async () => {
      const result = await estimateMaxSpendable({
        account: mockAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(new BigNumber("5000000000000000000"));
      expect(mockedCalculateGasFees).not.toHaveBeenCalled();
    });

    it("should return account balance when transaction is missing", async () => {
      const result = await estimateMaxSpendable({
        account: mockTokenAccount,
        transaction: undefined,
      } as any);

      expect(result).toEqual(new BigNumber("1000000000000000000000"));
      expect(mockedCalculateGasFees).not.toHaveBeenCalled();
    });

    it("should return account balance when transaction is null", async () => {
      const result = await estimateMaxSpendable({
        account: mockTokenAccount,
        transaction: null,
      } as any);

      expect(result).toEqual(new BigNumber("1000000000000000000000"));
      expect(mockedCalculateGasFees).not.toHaveBeenCalled();
    });
  });

  describe("Token account handling", () => {
    it("should calculate max spendable for token account with sufficient balance", async () => {
      const result = await estimateMaxSpendable({
        account: mockTokenAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(new BigNumber("999790000000000000000")); // 1000 - 0.21 VTHO
      expect(mockedCalculateGasFees).toHaveBeenCalledWith(mockTransaction, true, "0x123");
    });

    it("should calculate max spendable for token account with sufficient balance, when parentAccount provided", async () => {
      const result = await estimateMaxSpendable({
        account: mockTokenAccount,
        parentAccount: mockAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(new BigNumber("999790000000000000000")); // 1000 - 0.21 VTHO
      expect(mockedCalculateGasFees).toHaveBeenCalledWith(
        mockTransaction,
        true,
        mockAccount.freshAddress,
      );
    });

    it("should return zero when gas fees exceed token balance", async () => {
      mockedCalculateGasFees.mockResolvedValue({
        estimatedGas: 21000,
        estimatedGasFees: new BigNumber("2000000000000000000000"), // 2000 VET (more than balance)
        maxFeePerGas: 10000000000000,
        maxPriorityFeePerGas: 1000000000000,
      });

      const result = await estimateMaxSpendable({
        account: mockTokenAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(new BigNumber("0"));
    });

    it("should return zero when gas fees equal token balance", async () => {
      mockedCalculateGasFees.mockResolvedValue({
        estimatedGas: 21000,
        estimatedGasFees: new BigNumber("1000000000000000000000"), // Exactly 1000 VET
        maxFeePerGas: 10000000000000,
        maxPriorityFeePerGas: 1000000000000,
      });

      const result = await estimateMaxSpendable({
        account: mockTokenAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(new BigNumber("0"));
    });

    it("should handle very small gas fees", async () => {
      mockedCalculateGasFees.mockResolvedValue({
        estimatedGas: 21000,
        estimatedGasFees: new BigNumber("1"), // 1 wei
        maxFeePerGas: 10000000000000,
        maxPriorityFeePerGas: 1000000000000,
      });

      const result = await estimateMaxSpendable({
        account: mockTokenAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(new BigNumber("999999999999999999999")); // 1000 VTHO - 1 wei
    });
  });

  describe("calculateGasFees integration", () => {
    it("should call calculateGasFees with correct parameters for token account", async () => {
      await estimateMaxSpendable({
        account: mockTokenAccount,
        transaction: mockTransaction,
      });

      expect(mockedCalculateGasFees).toHaveBeenCalledWith(mockTransaction, true, "0x123");
      expect(mockedCalculateGasFees).toHaveBeenCalledTimes(1);
    });

    it("should handle calculateGasFees errors", async () => {
      const error = new Error("Gas calculation failed");
      mockedCalculateGasFees.mockRejectedValue(error);

      await expect(
        estimateMaxSpendable({
          account: mockTokenAccount,
          transaction: mockTransaction,
        }),
      ).rejects.toThrow("Gas calculation failed");
    });
  });

  describe("edge cases", () => {
    it("should handle zero balance token account", async () => {
      const zeroBalanceTokenAccount: TokenAccount = {
        ...mockTokenAccount,
        balance: new BigNumber("0"),
        spendableBalance: new BigNumber("0"),
      };

      const result = await estimateMaxSpendable({
        account: zeroBalanceTokenAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(new BigNumber("0"));
    });

    it("should handle zero balance account", async () => {
      const zeroBalanceAccount: Account = {
        ...mockAccount,
        balance: new BigNumber("0"),
        spendableBalance: new BigNumber("0"),
      };

      const result = await estimateMaxSpendable({
        account: zeroBalanceAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(new BigNumber("0"));
    });

    it("should handle very large balances", async () => {
      const largeBalanceTokenAccount: TokenAccount = {
        ...mockTokenAccount,
        balance: new BigNumber("1000000000000000000000000"), // 1M tokens
      };

      const result = await estimateMaxSpendable({
        account: largeBalanceTokenAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(new BigNumber("999999790000000000000000")); // 1M - 0.21
    });

    it("should handle different transaction types", async () => {
      const tokenTransaction: Transaction = {
        ...mockTransaction,
        subAccountId: "vechain:1:0x123:+vtho",
      };

      await estimateMaxSpendable({
        account: mockTokenAccount,
        transaction: tokenTransaction,
      });

      expect(mockedCalculateGasFees).toHaveBeenCalledWith(tokenTransaction, true, "0x123");
    });
  });

  describe("BigNumber operations", () => {
    it("should handle precise BigNumber calculations", async () => {
      const preciseBalanceTokenAccount: TokenAccount = {
        ...mockTokenAccount,
        balance: new BigNumber("1000000000000000000001"), // 1000.000000000000000001 tokens
      };

      mockedCalculateGasFees.mockResolvedValue({
        estimatedGas: 21000,
        estimatedGasFees: new BigNumber("1"), // 1 wei
        maxFeePerGas: 10000000000000,
        maxPriorityFeePerGas: 1000000000000,
      });

      const result = await estimateMaxSpendable({
        account: preciseBalanceTokenAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(new BigNumber("1000000000000000000000")); // Exactly 1000 tokens
    });

    it("should handle decimal precision in calculations", async () => {
      mockedCalculateGasFees.mockResolvedValue({
        estimatedGas: 21000,
        estimatedGasFees: new BigNumber("123456789012345"), // Non-round number
        maxFeePerGas: 10000000000000,
        maxPriorityFeePerGas: 1000000000000,
      });

      const result = await estimateMaxSpendable({
        account: mockTokenAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(new BigNumber("999999876543210987655")); // Precise subtraction
    });
  });

  describe("account type validation", () => {
    it("should correctly identify Account type", async () => {
      const accountTypeAccount = { ...mockAccount, type: "Account" as const };

      const result = await estimateMaxSpendable({
        account: accountTypeAccount,
        transaction: mockTransaction,
      });

      expect(result).toEqual(accountTypeAccount.balance);
      expect(mockedCalculateGasFees).not.toHaveBeenCalled();
    });

    it("should correctly identify TokenAccount type", async () => {
      const tokenTypeAccount = { ...mockTokenAccount, type: "TokenAccount" as const };

      const result = await estimateMaxSpendable({
        account: tokenTypeAccount,
        transaction: mockTransaction,
      });

      expect(mockedCalculateGasFees).toHaveBeenCalled();
      expect(result).toEqual(new BigNumber("999790000000000000000"));
    });
  });
});
