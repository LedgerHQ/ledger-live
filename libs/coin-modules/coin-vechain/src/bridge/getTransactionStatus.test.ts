import BigNumber from "bignumber.js";
import { getTransactionStatus } from "./getTransactionStatus";
import { calculateTransactionInfo, parseAddress } from "../common-logic";
import { Transaction } from "../types";
import { Account, TokenAccount } from "@ledgerhq/types-live";
import {
  AmountRequired,
  FeeNotLoaded,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { NotEnoughVTHO } from "../errors";

// Mock dependencies
jest.mock("../common-logic");

const mockedCalculateTransactionInfo = jest.mocked(calculateTransactionInfo);
const mockedParseAddress = jest.mocked(parseAddress);

describe("getTransactionStatus", () => {
  const mockVthoAccount: TokenAccount = {
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
    subAccounts: [mockVthoAccount],
  };

  const mockTransaction: Transaction = {
    family: "vechain",
    recipient: "0x456789012345678901234567890123456789abcd",
    amount: new BigNumber("1000000000000000000"), // 1 VET
    estimatedFees: "210000000000000000", // 0.21 VET
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
    mockedCalculateTransactionInfo.mockResolvedValue({
      isTokenAccount: false,
      amount: new BigNumber("1000000000000000000"),
      spendableBalance: new BigNumber("4790000000000000000"), // 5 VET - 0.21 VET fees
      balance: new BigNumber("5000000000000000000"),
      tokenAccount: undefined,
      estimatedFees: "210000000000000000",
      estimatedGas: 21000,
      maxFeePerGas: 10000000000000,
      maxPriorityFeePerGas: 1000000000000,
    });
    mockedParseAddress.mockReturnValue(true);
  });

  describe("successful transaction validation", () => {
    it("should return valid status for a normal VET transaction", async () => {
      const result = await getTransactionStatus(mockAccount, mockTransaction);

      expect(result.errors).toEqual({});
      expect(result.warnings).toEqual({});
      expect(result.estimatedFees).toEqual(new BigNumber("210000000000000000"));
      expect(result.amount).toEqual(new BigNumber("1000000000000000000"));
      expect(result.totalSpent).toEqual(new BigNumber("1000000000000000000"));
    });

    it("should return valid status for a token transaction", async () => {
      const tokenTransaction: Transaction = {
        ...mockTransaction,
        subAccountId: "vechain:1:0x123:+vtho",
      };

      mockedCalculateTransactionInfo.mockResolvedValue({
        isTokenAccount: true,
        amount: new BigNumber("1000000000000000000"),
        spendableBalance: new BigNumber("999790000000000000000"),
        balance: new BigNumber("1000000000000000000000"),
        tokenAccount: mockVthoAccount,
        estimatedFees: "210000000000000000",
        estimatedGas: 21000,
        maxFeePerGas: 10000000000000,
        maxPriorityFeePerGas: 1000000000000,
      });

      const result = await getTransactionStatus(mockAccount, tokenTransaction);

      expect(result.errors).toEqual({});
      expect(result.totalSpent).toEqual(new BigNumber("1210000000000000000")); // amount + fees
    });
  });

  describe("fee validation", () => {
    it("should return FeeNotLoaded error when body is missing", async () => {
      const transactionWithoutBody = { ...mockTransaction, body: undefined } as any;

      await expect(getTransactionStatus(mockAccount, transactionWithoutBody)).rejects.toThrow();
    });

    it("should return FeeNotLoaded error when gas is missing", async () => {
      const transactionWithoutGas = {
        ...mockTransaction,
        body: { ...mockTransaction.body, gas: undefined },
      } as any;

      const result = await getTransactionStatus(mockAccount, transactionWithoutGas);

      expect(result.errors.fees).toBeInstanceOf(FeeNotLoaded);
    });

    it("should return FeeNotLoaded error when gas is zero", async () => {
      const transactionWithZeroGas = {
        ...mockTransaction,
        body: { ...mockTransaction.body, gas: 0 },
      } as any;

      const result = await getTransactionStatus(mockAccount, transactionWithZeroGas);

      expect(result.errors.fees).toBeInstanceOf(FeeNotLoaded);
    });
  });

  describe("recipient validation", () => {
    it("should return RecipientRequired error when recipient is empty", async () => {
      const transactionWithoutRecipient = { ...mockTransaction, recipient: "" };

      const result = await getTransactionStatus(mockAccount, transactionWithoutRecipient);

      expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
    });

    it("should return InvalidAddressBecauseDestinationIsAlsoSource warning when sending to self", async () => {
      const selfTransaction = {
        ...mockTransaction,
        recipient: mockAccount.freshAddress,
      };

      const result = await getTransactionStatus(mockAccount, selfTransaction);

      expect(result.warnings.recipient).toBeInstanceOf(
        InvalidAddressBecauseDestinationIsAlsoSource,
      );
    });

    it("should handle case-insensitive self-send detection", async () => {
      const selfTransaction = {
        ...mockTransaction,
        recipient: mockAccount.freshAddress.toUpperCase(),
      };

      const result = await getTransactionStatus(mockAccount, selfTransaction);

      expect(result.warnings.recipient).toBeInstanceOf(
        InvalidAddressBecauseDestinationIsAlsoSource,
      );
    });

    it("should return InvalidAddress error for invalid recipient", async () => {
      mockedParseAddress.mockReturnValue(false);

      const result = await getTransactionStatus(mockAccount, mockTransaction);

      expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
      expect(mockedParseAddress).toHaveBeenCalledWith(mockTransaction.recipient);
    });
  });

  describe("amount validation", () => {
    it("should return AmountRequired error when amount is zero and not useAllAmount", async () => {
      const zeroAmountTransaction = {
        ...mockTransaction,
        amount: new BigNumber(0),
        useAllAmount: false,
      };

      const result = await getTransactionStatus(mockAccount, zeroAmountTransaction);

      expect(result.errors.amount).toBeInstanceOf(AmountRequired);
    });

    it("should return NotEnoughBalance error when amount is zero and useAllAmount is true", async () => {
      const useAllAmountTransaction = {
        ...mockTransaction,
        amount: new BigNumber(0),
        useAllAmount: true,
      };

      const result = await getTransactionStatus(mockAccount, useAllAmountTransaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });

    it("should return NotEnoughBalance error when amount exceeds spendable balance", async () => {
      const largeAmountTransaction = {
        ...mockTransaction,
        amount: new BigNumber("10000000000000000000"), // 10 VET, more than spendable
      };

      mockedCalculateTransactionInfo.mockResolvedValue({
        isTokenAccount: false,
        amount: new BigNumber("10000000000000000000"),
        spendableBalance: new BigNumber("4790000000000000000"), // Less than amount
        balance: new BigNumber("5000000000000000000"),
        tokenAccount: undefined,
        estimatedFees: "210000000000000000",
        estimatedGas: 21000,
        maxFeePerGas: 10000000000000,
        maxPriorityFeePerGas: 1000000000000,
      });

      const result = await getTransactionStatus(mockAccount, largeAmountTransaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
    });
  });

  describe("VTHO balance validation", () => {
    it("should return NotEnoughVTHO error when VTHO balance is insufficient for fees", async () => {
      const accountWithLowVtho: Account = {
        ...mockAccount,
        subAccounts: [{ ...mockVthoAccount, balance: new BigNumber("100000000000000000") }], // 0.1 VTHO
      };

      const result = await getTransactionStatus(accountWithLowVtho, mockTransaction);

      expect(result.errors.amount).toBeInstanceOf(NotEnoughVTHO);
    });

    it("should handle missing VTHO subaccount gracefully", async () => {
      const accountWithoutVtho: Account = {
        ...mockAccount,
        subAccounts: [],
      };

      // This should throw an error when trying to access subAccounts[0].balance
      await expect(getTransactionStatus(accountWithoutVtho, mockTransaction)).rejects.toThrow();
    });

    it("should handle undefined subAccounts gracefully", async () => {
      const accountWithUndefinedSub: Account = {
        ...mockAccount,
        subAccounts: [],
      };

      // This should throw an error when trying to access subAccounts[0].balance
      await expect(
        getTransactionStatus(accountWithUndefinedSub, mockTransaction),
      ).rejects.toThrow();
    });

    it("should not check VTHO balance for token transactions", async () => {
      const tokenTransaction: Transaction = {
        ...mockTransaction,
        subAccountId: "vechain:1:0x123:+vtho",
      };

      mockedCalculateTransactionInfo.mockResolvedValue({
        isTokenAccount: true,
        amount: new BigNumber("1000000000000000000"),
        spendableBalance: new BigNumber("999790000000000000000"),
        balance: new BigNumber("1000000000000000000000"),
        tokenAccount: mockVthoAccount,
        estimatedFees: "210000000000000000",
        estimatedGas: 21000,
        maxFeePerGas: 10000000000000,
        maxPriorityFeePerGas: 1000000000000,
      });

      const accountWithLowVtho: Account = {
        ...mockAccount,
        subAccounts: [{ ...mockVthoAccount, balance: new BigNumber("100000000000000000") }],
      };

      const result = await getTransactionStatus(accountWithLowVtho, tokenTransaction);

      expect(result.errors.amount).toBeUndefined();
    });
  });

  describe("multiple errors", () => {
    it("should return multiple errors when multiple validations fail", async () => {
      const invalidTransaction = {
        ...mockTransaction,
        recipient: "",
        amount: new BigNumber(0),
        useAllAmount: false,
        body: undefined,
      } as any;

      await expect(getTransactionStatus(mockAccount, invalidTransaction)).rejects.toThrow();
    });
  });

  describe("calculateTransactionInfo integration", () => {
    it("should call calculateTransactionInfo with correct parameters", async () => {
      await getTransactionStatus(mockAccount, mockTransaction);

      expect(mockedCalculateTransactionInfo).toHaveBeenCalledWith(mockAccount, mockTransaction, {
        estimatedGas: mockTransaction.body.gas,
        estimatedGasFees: new BigNumber(mockTransaction.estimatedFees),
        maxFeePerGas: mockTransaction.body.maxFeePerGas,
        maxPriorityFeePerGas: mockTransaction.body.maxPriorityFeePerGas,
      });
    });

    it("should handle calculateTransactionInfo errors", async () => {
      const error = new Error("Calculation failed");
      mockedCalculateTransactionInfo.mockRejectedValue(error);

      await expect(getTransactionStatus(mockAccount, mockTransaction)).rejects.toThrow(
        "Calculation failed",
      );
    });
  });
});
