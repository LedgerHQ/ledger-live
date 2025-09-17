import BigNumber from "bignumber.js";
import {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
} from "./transaction";
import { getAccountCurrency } from "@ledgerhq/coin-framework/account/index";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies/index";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon,
} from "@ledgerhq/coin-framework/serialization";
import { Transaction, TransactionRaw, TransactionStatus, TransactionStatusRaw } from "../types";
import { Account } from "@ledgerhq/types-live";

// Mock dependencies
jest.mock("@ledgerhq/coin-framework/account/index");
jest.mock("@ledgerhq/coin-framework/currencies/index");
jest.mock("@ledgerhq/coin-framework/serialization");

const mockedGetAccountCurrency = jest.mocked(getAccountCurrency);
const mockedFormatCurrencyUnit = jest.mocked(formatCurrencyUnit);
const mockedFromTransactionCommonRaw = jest.mocked(fromTransactionCommonRaw);
const mockedFromTransactionStatusRawCommon = jest.mocked(fromTransactionStatusRawCommon);
const mockedToTransactionCommonRaw = jest.mocked(toTransactionCommonRaw);
const mockedToTransactionStatusRawCommon = jest.mocked(toTransactionStatusRawCommon);

describe("transaction utilities", () => {
  const mockAccount: Account = {
    type: "Account",
    id: "vechain:1:0x123:",
    seedIdentifier: "seed123",
    derivationMode: "" as any,
    index: 0,
    freshAddress: "0x742d35Cc6634C0532925a3b8D0B251d8c1743eC4",
    freshAddressPath: "44'/818'/0'/0/0",
    used: true,
    balance: new BigNumber("5000000000000000000"),
    spendableBalance: new BigNumber("5000000000000000000"),
    creationDate: new Date("2022-01-01"),
    blockHeight: 12345,
    currency: {
      name: "VeChain",
      units: [{ name: "VET", code: "VET", magnitude: 18 }],
    } as any,
    operationsCount: 10,
    operations: [],
    pendingOperations: [],
    lastSyncDate: new Date("2022-01-01"),
    balanceHistoryCache: { HOUR: {}, DAY: {}, WEEK: {} } as any,
    swapHistory: [],
    subAccounts: [],
  };

  const mockTransaction: Transaction = {
    family: "vechain",
    recipient: "0x456789012345678901234567890123456789abcd",
    amount: new BigNumber("1000000000000000000"), // 1 VET
    estimatedFees: "210000000000000000",
    useAllAmount: false,
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
    mockedGetAccountCurrency.mockReturnValue(mockAccount.currency);
    mockedFormatCurrencyUnit.mockReturnValue("1 VET");
  });

  describe("formatTransaction", () => {
    it("should format transaction with amount", () => {
      const result = formatTransaction(mockTransaction, mockAccount);

      expect(result).toBe("SEND  1 VET TO 0x456789012345678901234567890123456789abcd");
      expect(mockedGetAccountCurrency).toHaveBeenCalledWith(mockAccount);
      expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
        mockAccount.currency.units[0],
        mockTransaction.amount,
        {
          showCode: true,
          disableRounding: true,
        },
      );
    });

    it("should format transaction with useAllAmount", () => {
      const useAllAmountTransaction = { ...mockTransaction, useAllAmount: true };

      const result = formatTransaction(useAllAmountTransaction, mockAccount);

      expect(result).toBe("SEND MAX TO 0x456789012345678901234567890123456789abcd");
      expect(mockedFormatCurrencyUnit).not.toHaveBeenCalled();
    });

    it("should format transaction with zero amount", () => {
      const zeroAmountTransaction = {
        ...mockTransaction,
        amount: new BigNumber("0"),
        useAllAmount: false,
      };

      const result = formatTransaction(zeroAmountTransaction, mockAccount);

      expect(result).toBe("SEND  TO 0x456789012345678901234567890123456789abcd");
      expect(mockedFormatCurrencyUnit).not.toHaveBeenCalled();
    });

    it("should handle different recipients", () => {
      const differentRecipientTx = {
        ...mockTransaction,
        recipient: "0x999888777666555444333222111000aaabbbcccd",
      };

      const result = formatTransaction(differentRecipientTx, mockAccount);

      expect(result).toBe("SEND  1 VET TO 0x999888777666555444333222111000aaabbbcccd");
    });

    it("should handle different formatted amounts", () => {
      mockedFormatCurrencyUnit.mockReturnValue("2.5 VET");

      const result = formatTransaction(mockTransaction, mockAccount);

      expect(result).toBe("SEND  2.5 VET TO 0x456789012345678901234567890123456789abcd");
    });

    it("should handle empty recipient", () => {
      const emptyRecipientTx = { ...mockTransaction, recipient: "" };

      const result = formatTransaction(emptyRecipientTx, mockAccount);

      expect(result).toBe("SEND  1 VET TO ");
    });

    it("should handle very large amounts", () => {
      const largeAmountTx = {
        ...mockTransaction,
        amount: new BigNumber("1000000000000000000000000"),
      };
      mockedFormatCurrencyUnit.mockReturnValue("1000000 VET");

      const result = formatTransaction(largeAmountTx, mockAccount);

      expect(result).toBe("SEND  1000000 VET TO 0x456789012345678901234567890123456789abcd");
    });
  });

  describe("fromTransactionRaw", () => {
    const mockTransactionRaw: TransactionRaw = {
      family: "vechain",
      recipient: "0x456789012345678901234567890123456789abcd",
      amount: "1000000000000000000",
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
    } as TransactionRaw;

    const mockCommonData = {
      mode: "send" as any,
      useAllAmount: false,
      amount: new BigNumber("1000000000000000000"),
      recipient: "0x456789012345678901234567890123456789abcd",
    };

    it("should deserialize transaction from raw", () => {
      mockedFromTransactionCommonRaw.mockReturnValue(mockCommonData);

      const result = fromTransactionRaw(mockTransactionRaw);

      expect(result).toEqual({
        ...mockTransactionRaw,
        ...mockCommonData,
      });
      expect(mockedFromTransactionCommonRaw).toHaveBeenCalledWith(mockTransactionRaw);
    });

    it("should merge raw data with common data", () => {
      const extendedCommonData = {
        mode: "send" as any,
        useAllAmount: true,
        amount: new BigNumber("1000000000000000000"),
        recipient: "0x456789012345678901234567890123456789abcd",
        subAccountId: "vechain:1:0x123:+vtho",
      };
      mockedFromTransactionCommonRaw.mockReturnValue(extendedCommonData);

      const result = fromTransactionRaw(mockTransactionRaw);

      expect(result).toEqual({
        ...mockTransactionRaw,
        ...extendedCommonData,
      });
    });
  });

  describe("toTransactionRaw", () => {
    const mockCommonRawData = {
      mode: "send" as any,
      useAllAmount: false,
      amount: "1000000000000000000",
      recipient: "0x456789012345678901234567890123456789abcd",
    };

    it("should serialize transaction to raw", () => {
      mockedToTransactionCommonRaw.mockReturnValue(mockCommonRawData);

      const result = toTransactionRaw(mockTransaction);

      expect(result).toEqual({
        ...mockTransaction,
        ...mockCommonRawData,
      });
      expect(mockedToTransactionCommonRaw).toHaveBeenCalledWith(mockTransaction);
    });

    it("should merge transaction data with common raw data", () => {
      const extendedCommonRawData = {
        mode: "send" as any,
        useAllAmount: true,
        amount: "1000000000000000000",
        recipient: "0x456789012345678901234567890123456789abcd",
        subAccountId: "vechain:1:0x123:+vtho",
      };
      mockedToTransactionCommonRaw.mockReturnValue(extendedCommonRawData);

      const result = toTransactionRaw(mockTransaction);

      expect(result).toEqual({
        ...mockTransaction,
        ...extendedCommonRawData,
      });
    });
  });

  describe("fromTransactionStatusRaw", () => {
    const mockTransactionStatusRaw: TransactionStatusRaw = {
      errors: {},
      warnings: {},
      estimatedFees: "210000000000000000",
      amount: "1000000000000000000",
      totalSpent: "1000000000000000000",
    } as TransactionStatusRaw;

    const mockCommonStatusData = {
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber("210000000000000000"),
      amount: new BigNumber("1000000000000000000"),
      totalSpent: new BigNumber("1000000000000000000"),
      txid: "0x123",
    };

    it("should deserialize transaction status from raw", () => {
      mockedFromTransactionStatusRawCommon.mockReturnValue(mockCommonStatusData);

      const result = fromTransactionStatusRaw(mockTransactionStatusRaw);

      expect(result).toEqual({
        ...mockTransactionStatusRaw,
        ...mockCommonStatusData,
      });
      expect(mockedFromTransactionStatusRawCommon).toHaveBeenCalledWith(mockTransactionStatusRaw);
    });

    it("should merge raw status data with common data", () => {
      const extendedCommonStatusData = {
        errors: {},
        warnings: {},
        estimatedFees: new BigNumber("210000000000000000"),
        amount: new BigNumber("1000000000000000000"),
        totalSpent: new BigNumber("1000000000000000000"),
        txid: "0x456",
        gasLimit: new BigNumber("21000"),
      };
      mockedFromTransactionStatusRawCommon.mockReturnValue(extendedCommonStatusData);

      const result = fromTransactionStatusRaw(mockTransactionStatusRaw);

      expect(result).toEqual({
        ...mockTransactionStatusRaw,
        ...extendedCommonStatusData,
      });
    });
  });

  describe("toTransactionStatusRaw", () => {
    const mockTransactionStatus: TransactionStatus = {
      errors: {},
      warnings: {},
      estimatedFees: new BigNumber("210000000000000000"),
      amount: new BigNumber("1000000000000000000"),
      totalSpent: new BigNumber("1000000000000000000"),
    } as TransactionStatus;

    const mockCommonStatusRawData = {
      errors: {},
      warnings: {},
      estimatedFees: "210000000000000000",
      amount: "1000000000000000000",
      totalSpent: "1000000000000000000",
      txid: "0x789",
    };

    it("should serialize transaction status to raw", () => {
      mockedToTransactionStatusRawCommon.mockReturnValue(mockCommonStatusRawData);

      const result = toTransactionStatusRaw(mockTransactionStatus);

      expect(result).toEqual({
        ...mockTransactionStatus,
        ...mockCommonStatusRawData,
      });
      expect(mockedToTransactionStatusRawCommon).toHaveBeenCalledWith(mockTransactionStatus);
    });

    it("should merge transaction status data with common raw data", () => {
      const extendedCommonStatusRawData = {
        errors: {},
        warnings: {},
        estimatedFees: "210000000000000000",
        amount: "1000000000000000000",
        totalSpent: "1000000000000000000",
        txid: "0xabc",
        gasLimit: "21000",
      };
      mockedToTransactionStatusRawCommon.mockReturnValue(extendedCommonStatusRawData);

      const result = toTransactionStatusRaw(mockTransactionStatus);

      expect(result).toEqual({
        ...mockTransactionStatus,
        ...extendedCommonStatusRawData,
      });
    });
  });

  describe("default export", () => {
    it("should export all functions in default object", () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const defaultExport = require("./transaction").default;

      expect(defaultExport).toEqual({
        formatTransaction,
        formatTransactionStatus: expect.any(Function), // This is imported from coin-framework
        fromTransactionRaw,
        toTransactionRaw,
        fromTransactionStatusRaw,
        toTransactionStatusRaw,
      });
    });
  });

  describe("integration with currency formatting", () => {
    it("should call formatCurrencyUnit with correct parameters", () => {
      const customAmount = new BigNumber("2500000000000000000"); // 2.5 VET
      const customTransaction = { ...mockTransaction, amount: customAmount };

      formatTransaction(customTransaction, mockAccount);

      expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
        mockAccount.currency.units[0],
        customAmount,
        {
          showCode: true,
          disableRounding: true,
        },
      );
    });

    it("should use the first currency unit", () => {
      const multiUnitCurrency = {
        ...mockAccount.currency,
        units: [
          { name: "VET", code: "VET", magnitude: 18 },
          { name: "Wei", code: "wei", magnitude: 0 },
        ],
      };
      const customAccount = { ...mockAccount, currency: multiUnitCurrency };
      mockedGetAccountCurrency.mockReturnValue(multiUnitCurrency);

      formatTransaction(mockTransaction, customAccount);

      expect(mockedFormatCurrencyUnit).toHaveBeenCalledWith(
        multiUnitCurrency.units[0], // Should use the first unit
        mockTransaction.amount,
        expect.any(Object),
      );
    });
  });

  describe("error handling", () => {
    it("should handle getAccountCurrency errors", () => {
      mockedGetAccountCurrency.mockImplementation(() => {
        throw new Error("Currency not found");
      });

      expect(() => formatTransaction(mockTransaction, mockAccount)).toThrow("Currency not found");
    });

    it("should handle formatCurrencyUnit errors", () => {
      mockedFormatCurrencyUnit.mockImplementation(() => {
        throw new Error("Formatting error");
      });

      expect(() => formatTransaction(mockTransaction, mockAccount)).toThrow("Formatting error");
    });

    it("should handle fromTransactionCommonRaw errors", () => {
      const mockTransactionRaw = {} as TransactionRaw;
      mockedFromTransactionCommonRaw.mockImplementation(() => {
        throw new Error("Deserialization error");
      });

      expect(() => fromTransactionRaw(mockTransactionRaw)).toThrow("Deserialization error");
    });
  });
});
