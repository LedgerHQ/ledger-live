import { BigNumber } from "bignumber.js";
import { buildTransaction, extractExtrinsicArg } from "./buildTransaction";
import type { SuiAccount, Transaction } from "../types";

// Mock the craftTransaction function
jest.mock("../logic", () => ({
  craftTransaction: jest.fn(),
}));

import { craftTransaction } from "../logic";

describe("buildTransaction", () => {
  const mockAccount: SuiAccount = {
    id: "test-account-id",
    name: "Test Account",
    address: "0x1234567890abcdef",
    freshAddress: "0x1234567890abcdef",
    freshAddressPath: "m/44'/784'/0'/0'/0'",
    currency: {
      id: "sui",
      name: "Sui",
      family: "sui",
      units: [],
      type: "CryptoCurrency",
    },
    balance: new BigNumber("1000000000"),
    spendableBalance: new BigNumber("1000000000"),
    blockHeight: 1000,
    lastSyncDate: new Date(),
    operations: [],
    pendingOperations: [],
    unit: {
      name: "SUI",
      code: "SUI",
      magnitude: 9,
    },
    type: "Account",
  } as any as SuiAccount;

  const mockTransaction: Transaction = {
    id: "test-transaction-id",
    family: "sui",
    mode: "send",
    coinType: "0x2::sui::SUI",
    amount: new BigNumber("100000000"),
    recipient: "0xabcdef1234567890",
    fees: new BigNumber("1000000"),
    errors: {},
    warnings: {},
    useAllAmount: false,
    estimatedFees: new BigNumber("1000000"),
    feeStrategy: "medium",
    networkInfo: {
      family: "sui",
      fees: new BigNumber("1000000"),
    },
  } as Transaction;

  beforeEach(() => {
    jest.clearAllMocks();
    (craftTransaction as jest.Mock).mockResolvedValue({
      unsigned: new Uint8Array([1, 2, 3, 4, 5]),
    });
  });

  describe("buildTransaction", () => {
    it("should call craftTransaction with correct parameters", async () => {
      // WHEN
      await buildTransaction(mockAccount, mockTransaction);

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith({
        sender: mockAccount.freshAddress,
        recipient: mockTransaction.recipient,
        type: mockTransaction.mode,
        amount: BigInt(mockTransaction.amount!.toString()),
        asset: { type: "native" },
      });
    });

    it("should return the result from craftTransaction", async () => {
      const expectedResult = {
        unsigned: new Uint8Array([1, 2, 3, 4, 5]),
      };

      // WHEN
      const result = await buildTransaction(mockAccount, mockTransaction);

      // THEN
      expect(result).toEqual(expectedResult);
      expect(result.unsigned).toBeInstanceOf(Uint8Array);
    });

    it("should handle BigNumber amount conversion correctly", async () => {
      const transactionWithLargeAmount: Transaction = {
        ...mockTransaction,
        amount: new BigNumber("999999999999999999"),
      };

      // WHEN
      await buildTransaction(mockAccount, transactionWithLargeAmount);

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: BigInt("999999999999999999"),
        }),
      );
    });

    it("should handle zero amount", async () => {
      const transactionWithZeroAmount: Transaction = {
        ...mockTransaction,
        amount: new BigNumber("0"),
      };

      // WHEN
      await buildTransaction(mockAccount, transactionWithZeroAmount);

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: BigInt("0"),
        }),
      );
    });

    it("should handle different transaction modes", async () => {
      const transactionWithDifferentMode: Transaction = {
        ...mockTransaction,
        mode: "send",
      };

      // WHEN
      await buildTransaction(mockAccount, transactionWithDifferentMode);

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "send",
        }),
      );
    });

    it("should handle different recipient addresses", async () => {
      const transactionWithDifferentRecipient: Transaction = {
        ...mockTransaction,
        recipient: "0x9876543210fedcba",
      };

      // WHEN
      await buildTransaction(mockAccount, transactionWithDifferentRecipient);

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: "0x9876543210fedcba",
        }),
      );
    });

    it("should handle different account addresses", async () => {
      const accountWithDifferentAddress: SuiAccount = {
        ...mockAccount,
        freshAddress: "0xabcdef1234567890",
      };

      // WHEN
      await buildTransaction(accountWithDifferentAddress, mockTransaction);

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          sender: "0xabcdef1234567890",
        }),
      );
    });

    it("should propagate errors from craftTransaction", async () => {
      const error = new Error("Transaction creation failed");
      (craftTransaction as jest.Mock).mockRejectedValue(error);

      // WHEN & THEN
      await expect(buildTransaction(mockAccount, mockTransaction)).rejects.toThrow(
        "Transaction creation failed",
      );
    });

    it("should handle craftTransaction returning null", async () => {
      (craftTransaction as jest.Mock).mockResolvedValue(null);

      // WHEN
      const result = await buildTransaction(mockAccount, mockTransaction);

      // THEN
      expect(result).toBeNull();
    });

    it("should handle craftTransaction returning undefined", async () => {
      (craftTransaction as jest.Mock).mockResolvedValue(undefined);

      // WHEN
      const result = await buildTransaction(mockAccount, mockTransaction);

      // THEN
      expect(result).toBeUndefined();
    });
  });

  describe("extractExtrinsicArg", () => {
    it("should extract correct fields from transaction", () => {
      const transaction: Transaction = {
        ...mockTransaction,
        useAllAmount: true,
      };

      // WHEN
      const result = extractExtrinsicArg(transaction);

      // THEN
      expect(result).toEqual({
        mode: "send",
        coinType: "0x2::sui::SUI",
        amount: new BigNumber("100000000"),
        recipient: "0xabcdef1234567890",
        useAllAmount: true,
      });
    });

    it("should handle transaction without useAllAmount", () => {
      const transaction: Transaction = {
        ...mockTransaction,
        useAllAmount: false,
      };

      // WHEN
      const result = extractExtrinsicArg(transaction);

      // THEN
      expect(result).toEqual({
        mode: "send",
        coinType: "0x2::sui::SUI",
        amount: new BigNumber("100000000"),
        recipient: "0xabcdef1234567890",
        useAllAmount: false,
      });
    });

    it("should handle transaction with undefined useAllAmount", () => {
      const transaction = {
        ...mockTransaction,
        useAllAmount: undefined,
      } as any;

      // WHEN
      const result = extractExtrinsicArg(transaction);

      // THEN
      expect(result).toEqual({
        mode: "send",
        coinType: "0x2::sui::SUI",
        amount: new BigNumber("100000000"),
        recipient: "0xabcdef1234567890",
        useAllAmount: undefined,
      });
    });

    it("should handle different transaction modes", () => {
      const transaction: Transaction = {
        ...mockTransaction,
        mode: "send",
      };

      // WHEN
      const result = extractExtrinsicArg(transaction);

      // THEN
      expect(result.mode).toBe("send");
    });

    it("should handle different amounts", () => {
      const transaction: Transaction = {
        ...mockTransaction,
        amount: new BigNumber("500000000"),
      };

      // WHEN
      const result = extractExtrinsicArg(transaction);

      // THEN
      expect(result.amount).toEqual(new BigNumber("500000000"));
    });

    it("should handle different recipients", () => {
      const transaction: Transaction = {
        ...mockTransaction,
        recipient: "0x9876543210fedcba",
      };

      // WHEN
      const result = extractExtrinsicArg(transaction);

      // THEN
      expect(result.recipient).toBe("0x9876543210fedcba");
    });

    it("should not include other transaction fields", () => {
      const transaction: Transaction = {
        ...mockTransaction,
        fees: new BigNumber("1000000"),
        errors: { someError: new Error("test") },
      };

      // WHEN
      const result = extractExtrinsicArg(transaction);

      // THEN
      expect(result).not.toHaveProperty("fees");
      expect(result).not.toHaveProperty("errors");
      expect(result).not.toHaveProperty("family");
      expect(result).not.toHaveProperty("id");
    });

    it("should handle zero amount", () => {
      const transaction: Transaction = {
        ...mockTransaction,
        amount: new BigNumber("0"),
      };

      // WHEN
      const result = extractExtrinsicArg(transaction);

      // THEN
      expect(result.amount).toEqual(new BigNumber("0"));
    });
  });

  describe("Integration between extractExtrinsicArg and buildTransaction", () => {
    it("should work together correctly", async () => {
      const transaction: Transaction = {
        ...mockTransaction,
        useAllAmount: true,
      };

      // Extract extrinsic arg
      const extrinsicArg = extractExtrinsicArg(transaction);

      // Build transaction
      await buildTransaction(mockAccount, transaction);

      // Verify that the extracted arg contains the expected fields
      expect(extrinsicArg).toHaveProperty("mode", "send");
      expect(extrinsicArg).toHaveProperty("amount");
      expect(extrinsicArg).toHaveProperty("recipient");
      expect(extrinsicArg).toHaveProperty("useAllAmount", true);

      // Verify that buildTransaction was called with correct parameters
      expect(craftTransaction).toHaveBeenCalledWith({
        sender: mockAccount.freshAddress,
        recipient: transaction.recipient,
        type: transaction.mode,
        amount: BigInt(transaction.amount!.toString()),
        asset: { type: "native" },
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty recipient string", async () => {
      const transactionWithEmptyRecipient: Transaction = {
        ...mockTransaction,
        recipient: "",
      };

      // WHEN
      await buildTransaction(mockAccount, transactionWithEmptyRecipient);

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: "",
        }),
      );
    });

    it("should handle very long recipient addresses", async () => {
      const longAddress = "0x" + "a".repeat(100);
      const transactionWithLongRecipient: Transaction = {
        ...mockTransaction,
        recipient: longAddress,
      };

      // WHEN
      await buildTransaction(mockAccount, transactionWithLongRecipient);

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          recipient: longAddress,
        }),
      );
    });
  });
});
