import { BigNumber } from "bignumber.js";
import {
  NotEnoughBalance,
  RecipientRequired,
  InvalidAddress,
  FeeNotLoaded,
  AmountRequired,
  InvalidAddressBecauseDestinationIsAlsoSource,
} from "@ledgerhq/errors";
import { AccountCreationFeeWarning, InvalidMemoMina, AmountTooSmall } from "./errors";
import getTransactionStatus from "./getTransactionStatus";
import { createMockAccount, createMockTransaction } from "../test/fixtures";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { Transaction } from "../types/common";
import getEstimatedFees from "./getEstimatedFees";

// Mock dependencies
jest.mock("@ledgerhq/coin-framework/currencies", () => ({
  formatCurrencyUnit: jest.fn().mockReturnValue("0.1 MINA"),
}));
jest.mock("./getEstimatedFees");

describe("getTransactionStatus", () => {
  // Standard test fixtures
  const mockAccount = createMockAccount();
  const mockTransaction = createMockTransaction({ amount: new BigNumber(800) });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a valid transaction status with no errors for valid inputs", async () => {
    const result = await getTransactionStatus(mockAccount, mockTransaction);

    expect(result.errors).toEqual({});
    expect(result.warnings).toEqual({});
    expect(result.estimatedFees).toEqual(new BigNumber(10));
    expect(result.amount).toEqual(new BigNumber(800));
    expect(result.totalSpent).toEqual(new BigNumber(810)); // amount + fee
  });

  it("should handle missing fees with FeeNotLoaded error", async () => {
    (getEstimatedFees as jest.Mock).mockResolvedValue({
      fee: new BigNumber(10),
      accountCreationFee: new BigNumber(0),
    });
    // Using Type casting to handle the null fees for testing purposes
    const txWithoutFees: Transaction = {
      ...mockTransaction,
      fees: {
        fee: new BigNumber(0),
        accountCreationFee: new BigNumber(0),
      },
    };

    const result = await getTransactionStatus(mockAccount, txWithoutFees);

    expect(result.errors.fees).toBeInstanceOf(FeeNotLoaded);
  });

  it("should handle missing recipient with RecipientRequired error", async () => {
    const txWithoutRecipient = {
      ...mockTransaction,
      recipient: "",
    };

    const result = await getTransactionStatus(mockAccount, txWithoutRecipient);

    expect(result.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  it("should handle invalid recipient address with InvalidAddress error", async () => {
    const txWithInvalidRecipient = {
      ...mockTransaction,
      recipient: "invalid-address",
    };

    const result = await getTransactionStatus(mockAccount, txWithInvalidRecipient);

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  it("should handle self-transfer with InvalidAddressBecauseDestinationIsAlsoSource error", async () => {
    const txWithSelfTransfer = {
      ...mockTransaction,
      recipient: mockAccount.freshAddress,
    };

    const result = await getTransactionStatus(mockAccount, txWithSelfTransfer);

    expect(result.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  it("should handle invalid memo with InvalidMemoMina error", async () => {
    const veryLongMemo = "a".repeat(33); // Create memo longer than MAX_MEMO_LENGTH (32)
    const txWithInvalidMemo = {
      ...mockTransaction,
      memo: veryLongMemo,
    };

    const result = await getTransactionStatus(mockAccount, txWithInvalidMemo);

    expect(result.errors.transaction).toBeInstanceOf(InvalidMemoMina);
  });

  it("should add AccountCreationFeeWarning when account creation fee is present", async () => {
    const txWithAccountCreationFee = {
      ...mockTransaction,
      fees: {
        fee: new BigNumber(10),
        accountCreationFee: new BigNumber(100),
      },
    };

    const result = await getTransactionStatus(mockAccount, txWithAccountCreationFee);

    expect(result.warnings.recipient).toBeInstanceOf(AccountCreationFeeWarning);
    expect(formatCurrencyUnit).toHaveBeenCalled();
  });

  it("should add AmountTooSmall error when amount is less than account creation fee", async () => {
    const txWithSmallAmount = {
      ...mockTransaction,
      amount: new BigNumber(50),
      fees: {
        fee: new BigNumber(10),
        accountCreationFee: new BigNumber(100),
      },
    };

    const result = await getTransactionStatus(mockAccount, txWithSmallAmount);

    expect(result.errors.amount).toBeInstanceOf(AmountTooSmall);
  });

  it("should handle zero amount with AmountRequired error when useAllAmount is false", async () => {
    const txWithZeroAmount = {
      ...mockTransaction,
      amount: new BigNumber(0),
      useAllAmount: false,
    };

    const result = await getTransactionStatus(mockAccount, txWithZeroAmount);

    expect(result.errors.amount).toBeInstanceOf(AmountRequired);
  });

  it("should handle amount greater than max with NotEnoughBalance error", async () => {
    // Account has spendable balance of 900
    const txWithTooLargeAmount = {
      ...mockTransaction,
      amount: new BigNumber(1000),
      useAllAmount: false,
    };

    const result = await getTransactionStatus(mockAccount, txWithTooLargeAmount);

    expect(result.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  it("should calculate correct amount and totalSpent when useAllAmount is true", async () => {
    const txWithUseAllAmount = {
      ...mockTransaction,
      amount: new BigNumber(0), // Amount should be ignored when useAllAmount is true
      useAllAmount: true,
    };

    const result = await getTransactionStatus(mockAccount, txWithUseAllAmount);

    // Should return spendableBalance - fee as the amount
    expect(result.amount).toEqual(new BigNumber(890)); // spendableBalance(900) - fee(10)
    expect(result.totalSpent).toEqual(new BigNumber(900)); // spendableBalance
    expect(result.errors).toEqual({});
  });
});
