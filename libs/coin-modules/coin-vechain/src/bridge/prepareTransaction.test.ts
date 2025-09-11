import BigNumber from "bignumber.js";
import { prepareTransaction } from "./prepareTransaction";
import {
  calculateTransactionInfo,
  calculateClausesVet,
  calculateClausesVtho,
  parseAddress,
} from "../common-logic";
import { getBlockRef } from "../network";
import { Transaction } from "../types";
import { Account, TokenAccount } from "@ledgerhq/types-live";

// Mock dependencies
jest.mock("../common-logic");
jest.mock("../network");

const mockedCalculateTransactionInfo = jest.mocked(calculateTransactionInfo);
const mockedCalculateClausesVet = jest.mocked(calculateClausesVet);
const mockedCalculateClausesVtho = jest.mocked(calculateClausesVtho);
const mockedParseAddress = jest.mocked(parseAddress);
const mockedGetBlockRef = jest.mocked(getBlockRef);

describe("prepareTransaction", () => {
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
    currency: { name: "VeChain" } as any,
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
    estimatedFees: "0",
    body: {
      chainTag: 74,
      blockRef: "0x0000000000000000",
      expiration: 18,
      clauses: [],
      maxFeePerGas: 0,
      maxPriorityFeePerGas: 0,
      gas: "0",
      dependsOn: null,
      nonce: "0x12345678",
    },
  } as Transaction;

  const mockTransactionInfo = {
    amount: new BigNumber("1000000000000000000"),
    isTokenAccount: false,
    estimatedFees: "210000000000000000",
    estimatedGas: 21000,
    maxFeePerGas: 10000000000000,
    maxPriorityFeePerGas: 1000000000000,
    spendableBalance: new BigNumber("4790000000000000000"),
    balance: new BigNumber("5000000000000000000"),
    tokenAccount: undefined,
  };

  const mockVetClauses = [
    {
      to: "0x456789012345678901234567890123456789abcd",
      value: "1000000000000000000",
      data: "0x",
    },
  ];

  const mockVthoClauses = [
    {
      to: "0x0000000000000000000000000000456e65726779",
      value: "0",
      data: "0xa9059cbb000000000000000000000000456789012345678901234567890123456789abcd0000000000000000000000000000000000000000000000000de0b6b3a7640000",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockedCalculateTransactionInfo.mockResolvedValue(mockTransactionInfo);
    mockedParseAddress.mockReturnValue(true);
    mockedGetBlockRef.mockResolvedValue("0x00000000000b2bce");
    mockedCalculateClausesVet.mockResolvedValue(mockVetClauses);
    mockedCalculateClausesVtho.mockResolvedValue(mockVthoClauses);
  });

  describe("VET transactions", () => {
    it("should prepare a VET transaction with valid recipient", async () => {
      const result = await prepareTransaction(mockAccount, mockTransaction);

      expect(result).toEqual({
        ...mockTransaction,
        body: {
          ...mockTransaction.body,
          gas: 21000,
          blockRef: "0x00000000000b2bce",
          clauses: mockVetClauses,
          maxFeePerGas: 10000000000000,
          maxPriorityFeePerGas: 1000000000000,
        },
        amount: new BigNumber("1000000000000000000"),
        estimatedFees: "210000000000000000",
      });

      expect(mockedCalculateClausesVet).toHaveBeenCalledWith(
        mockTransaction.recipient,
        new BigNumber("1000000000000000000"),
      );
      expect(mockedCalculateClausesVtho).not.toHaveBeenCalled();
    });

    it("should handle VET transaction without recipient", async () => {
      const transactionWithoutRecipient = {
        ...mockTransaction,
        recipient: "",
      };

      const result = await prepareTransaction(mockAccount, transactionWithoutRecipient);

      expect(result.body.clauses).toEqual([]);
      expect(result.body.blockRef).toBe("");
      expect(mockedGetBlockRef).not.toHaveBeenCalled();
      expect(mockedCalculateClausesVet).not.toHaveBeenCalled();
    });

    it("should handle VET transaction with invalid recipient", async () => {
      mockedParseAddress.mockReturnValue(false);

      const result = await prepareTransaction(mockAccount, mockTransaction);

      expect(result.body.clauses).toEqual([]);
      expect(result.body.blockRef).toBe("");
      expect(mockedGetBlockRef).not.toHaveBeenCalled();
      expect(mockedCalculateClausesVet).not.toHaveBeenCalled();
    });
  });

  describe("Token transactions", () => {
    it("should prepare a token transaction with valid recipient", async () => {
      const tokenTransactionInfo = {
        ...mockTransactionInfo,
        isTokenAccount: true,
        tokenAccount: {} as TokenAccount,
      };

      mockedCalculateTransactionInfo.mockResolvedValue(tokenTransactionInfo);

      const result = await prepareTransaction(mockAccount, mockTransaction);

      expect(result).toEqual({
        ...mockTransaction,
        body: {
          ...mockTransaction.body,
          gas: 21000,
          blockRef: "0x00000000000b2bce",
          clauses: mockVthoClauses,
          maxFeePerGas: 10000000000000,
          maxPriorityFeePerGas: 1000000000000,
        },
        amount: new BigNumber("1000000000000000000"),
        estimatedFees: "210000000000000000",
      });

      expect(mockedCalculateClausesVtho).toHaveBeenCalledWith(
        mockTransaction.recipient,
        new BigNumber("1000000000000000000"),
      );
      expect(mockedCalculateClausesVet).not.toHaveBeenCalled();
    });
  });

  describe("calculateTransactionInfo integration", () => {
    it("should call calculateTransactionInfo with correct parameters", async () => {
      await prepareTransaction(mockAccount, mockTransaction);

      expect(mockedCalculateTransactionInfo).toHaveBeenCalledWith(mockAccount, mockTransaction);
    });

    it("should use transaction info results in the prepared transaction", async () => {
      const customTransactionInfo = {
        amount: new BigNumber("2000000000000000000"),
        isTokenAccount: false,
        estimatedFees: "420000000000000000",
        estimatedGas: 42000,
        maxFeePerGas: 20000000000000,
        maxPriorityFeePerGas: 2000000000000,
        spendableBalance: new BigNumber("3000000000000000000"),
        balance: new BigNumber("5000000000000000000"),
        tokenAccount: undefined,
      };

      mockedCalculateTransactionInfo.mockResolvedValue(customTransactionInfo);

      const result = await prepareTransaction(mockAccount, mockTransaction);

      expect(result.amount).toEqual(new BigNumber("2000000000000000000"));
      expect(result.estimatedFees).toBe("420000000000000000");
      expect(result.body.gas).toBe(42000);
      expect(result.body.maxFeePerGas).toBe(20000000000000);
      expect(result.body.maxPriorityFeePerGas).toBe(2000000000000);
    });
  });

  describe("blockRef handling", () => {
    it("should get blockRef when recipient is valid", async () => {
      await prepareTransaction(mockAccount, mockTransaction);

      expect(mockedGetBlockRef).toHaveBeenCalledTimes(1);
    });

    it("should not get blockRef when recipient is empty", async () => {
      const transactionWithoutRecipient = {
        ...mockTransaction,
        recipient: "",
      };

      await prepareTransaction(mockAccount, transactionWithoutRecipient);

      expect(mockedGetBlockRef).not.toHaveBeenCalled();
    });

    it("should not get blockRef when recipient is invalid", async () => {
      mockedParseAddress.mockReturnValue(false);

      await prepareTransaction(mockAccount, mockTransaction);

      expect(mockedGetBlockRef).not.toHaveBeenCalled();
    });

    it("should handle getBlockRef errors", async () => {
      const error = new Error("Network error");
      mockedGetBlockRef.mockRejectedValue(error);

      await expect(prepareTransaction(mockAccount, mockTransaction)).rejects.toThrow(
        "Network error",
      );
    });
  });

  describe("clause calculation", () => {
    it("should handle calculateClausesVet errors", async () => {
      const error = new Error("VET clause calculation failed");
      mockedCalculateClausesVet.mockRejectedValue(error);

      await expect(prepareTransaction(mockAccount, mockTransaction)).rejects.toThrow(
        "VET clause calculation failed",
      );
    });

    it("should handle calculateClausesVtho errors", async () => {
      const tokenTransactionInfo = {
        ...mockTransactionInfo,
        isTokenAccount: true,
        tokenAccount: {} as TokenAccount,
      };

      mockedCalculateTransactionInfo.mockResolvedValue(tokenTransactionInfo);

      const error = new Error("VTHO clause calculation failed");
      mockedCalculateClausesVtho.mockRejectedValue(error);

      await expect(prepareTransaction(mockAccount, mockTransaction)).rejects.toThrow(
        "VTHO clause calculation failed",
      );
    });
  });

  describe("body preservation", () => {
    it("should preserve existing body properties", async () => {
      const transactionWithBody = {
        ...mockTransaction,
        body: {
          ...mockTransaction.body,
          chainTag: 39, // testnet
          expiration: 32,
          dependsOn: "0xprevious123",
          nonce: "0xabcdef123456",
        },
      };

      const result = await prepareTransaction(mockAccount, transactionWithBody);

      expect(result.body.chainTag).toBe(39);
      expect(result.body.expiration).toBe(32);
      expect(result.body.dependsOn).toBe("0xprevious123");
      expect(result.body.nonce).toBe("0xabcdef123456");
    });

    it("should override gas-related properties", async () => {
      const transactionWithOldGas = {
        ...mockTransaction,
        body: {
          ...mockTransaction.body,
          gas: 999,
          maxFeePerGas: 999,
          maxPriorityFeePerGas: 999,
        },
      };

      const result = await prepareTransaction(mockAccount, transactionWithOldGas);

      expect(result.body.gas).toBe(21000);
      expect(result.body.maxFeePerGas).toBe(10000000000000);
      expect(result.body.maxPriorityFeePerGas).toBe(1000000000000);
    });
  });

  describe("address validation", () => {
    it("should call parseAddress with recipient", async () => {
      await prepareTransaction(mockAccount, mockTransaction);

      expect(mockedParseAddress).toHaveBeenCalledWith(mockTransaction.recipient);
    });

    it("should handle different recipient formats", async () => {
      const recipients = [
        "0x456789012345678901234567890123456789abcd",
        "0X456789012345678901234567890123456789ABCD",
        "456789012345678901234567890123456789abcd",
      ];

      for (const recipient of recipients) {
        const txWithRecipient = { ...mockTransaction, recipient };
        await prepareTransaction(mockAccount, txWithRecipient);

        expect(mockedParseAddress).toHaveBeenCalledWith(recipient);
      }
    });
  });
});
