import { BigNumber } from "bignumber.js";
import { craftTransaction } from "../logic";
import type { SuiAccount, Transaction } from "../types";
import { createFixtureAccount } from "../types/bridge.fixture";
import { buildTransaction } from "./buildTransaction";

// Mock the craftTransaction function
jest.mock("../logic", () => ({
  craftTransaction: jest.fn(),
}));

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
    it("should call craftTransaction with correct parameters for native asset", async () => {
      // WHEN
      await buildTransaction(mockAccount, mockTransaction);

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        {
          intentType: "transaction",
          sender: mockAccount.freshAddress,
          recipient: mockTransaction.recipient,
          type: mockTransaction.mode,
          amount: BigInt(mockTransaction.amount!.toString()),
          asset: { type: "native" },
          useAllAmount: false,
          stakedSuiId: "",
        },
        undefined,
        undefined,
      );
    });

    it("should call craftTransaction with correct parameters for token asset", async () => {
      const account = createFixtureAccount({
        id: "parentAccountId",
        balance: BigNumber(0),
        spendableBalance: BigNumber(0),
        subAccounts: [
          createFixtureAccount({
            id: "subAccountId",
            parentId: "parentAccountId",
            type: "TokenAccount",
            token: {
              contractAddress: "0x3::usdt::USDT",
            },
          }),
        ],
      });

      // WHEN
      await buildTransaction(account, {
        ...mockTransaction,
        subAccountId: "subAccountId",
        coinType: "0x3::usdt::USDT",
      });

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        {
          intentType: "transaction",
          sender: account.freshAddress,
          recipient: mockTransaction.recipient,
          type: mockTransaction.mode,
          useAllAmount: false,
          stakedSuiId: "",
          amount: BigInt(mockTransaction.amount!.toString()),
          asset: { type: "token", assetReference: "0x3::usdt::USDT" },
        },
        undefined,
        undefined,
      );
    });

    it("should call craftTransaction with correct parameters for token asset with resolution data", async () => {
      const account = createFixtureAccount({
        id: "parentAccountId",
        balance: BigNumber(0),
        spendableBalance: BigNumber(0),
        subAccounts: [
          createFixtureAccount({
            id: "subAccountId",
            parentId: "parentAccountId",
            type: "TokenAccount",
            token: {
              contractAddress: "0x3::usdt::USDT",
            },
          }),
        ],
      });

      // WHEN
      await buildTransaction(account, {
        ...mockTransaction,
        subAccountId: "subAccountId",
        coinType: "0x3::usdt::USDT",
        tokenId: "tokenId",
        mode: "token.send",
      });

      // THEN
      expect(craftTransaction).toHaveBeenCalledWith(
        {
          intentType: "transaction",
          sender: account.freshAddress,
          recipient: mockTransaction.recipient,
          type: "token.send",
          useAllAmount: false,
          stakedSuiId: "",
          amount: BigInt(mockTransaction.amount!.toString()),
          asset: { type: "token", assetReference: "0x3::usdt::USDT" },
        },
        undefined,
        {
          certificateSignatureKind: undefined,
          deviceModelId: undefined,
          tokenAddress: "0x3::usdt::USDT",
          tokenId: "tokenId",
        },
      );
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
        undefined,
        undefined,
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
        undefined,
        undefined,
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
        undefined,
        undefined,
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
        undefined,
        undefined,
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
        undefined,
        undefined,
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
        undefined,
        undefined,
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
        undefined,
        undefined,
      );
    });
  });
});
