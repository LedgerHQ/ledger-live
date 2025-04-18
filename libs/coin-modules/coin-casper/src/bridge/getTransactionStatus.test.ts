import { BigNumber } from "bignumber.js";
import { getTransactionStatus } from "./getTransactionStatus";
import {
  CASPER_MINIMUM_VALID_AMOUNT_MOTES,
  MayBlockAccountError,
  InvalidMinimumAmountError,
} from "../consts";
import {
  AmountRequired,
  InvalidAddress,
  InvalidAddressBecauseDestinationIsAlsoSource,
  NotEnoughBalance,
  RecipientRequired,
} from "@ledgerhq/errors";
import { CasperInvalidTransferId } from "../errors";
import { createMockAccount, createMockTransaction, TEST_ADDRESSES } from "../test/fixtures";

describe("getTransactionStatus", () => {
  // Create fixtures
  const mockAccount = createMockAccount();
  const validTransaction = createMockTransaction();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should validate a valid transaction", async () => {
    const status = await getTransactionStatus(mockAccount, validTransaction);

    expect(status.errors).toEqual({});
    expect(status.warnings).toEqual({});
    expect(status.estimatedFees).toEqual(validTransaction.fees);
    expect(status.amount).toEqual(validTransaction.amount);
    expect(status.totalSpent).toEqual(validTransaction.amount.plus(validTransaction.fees));
  });

  test("should return error when recipient is missing", async () => {
    const txWithoutRecipient = {
      ...validTransaction,
      recipient: "",
    };

    const status = await getTransactionStatus(mockAccount, txWithoutRecipient);

    expect(status.errors.recipient).toBeInstanceOf(RecipientRequired);
  });

  test("should return error when recipient is invalid", async () => {
    const txWithInvalidRecipient = {
      ...validTransaction,
      recipient: TEST_ADDRESSES.INVALID,
    };

    const status = await getTransactionStatus(mockAccount, txWithInvalidRecipient);

    expect(status.errors.recipient).toBeInstanceOf(InvalidAddress);
  });

  test("should return error when recipient is same as sender", async () => {
    const txToSelf = {
      ...validTransaction,
      recipient: mockAccount.freshAddress,
    };

    const status = await getTransactionStatus(mockAccount, txToSelf);

    expect(status.errors.recipient).toBeInstanceOf(InvalidAddressBecauseDestinationIsAlsoSource);
  });

  test("should return error when transfer ID is invalid", async () => {
    const txWithInvalidTransferId = {
      ...validTransaction,
      transferId: "invalid-id",
    };

    const status = await getTransactionStatus(mockAccount, txWithInvalidTransferId);

    expect(status.errors.sender).toBeInstanceOf(CasperInvalidTransferId);
  });

  test("should handle useAllAmount correctly", async () => {
    const useAllAmountTx = {
      ...validTransaction,
      useAllAmount: true,
    };

    const status = await getTransactionStatus(mockAccount, useAllAmountTx);

    expect(status.amount).toEqual(mockAccount.spendableBalance.minus(useAllAmountTx.fees));
    expect(status.totalSpent).toEqual(mockAccount.spendableBalance);
    expect(status.errors).toEqual({});
  });

  test("should return error when useAllAmount but not enough balance for fees", async () => {
    const lowBalanceAccount = createMockAccount({
      spendableBalance: new BigNumber(500000), // Less than the fee
    });

    const useAllAmountTx = {
      ...validTransaction,
      useAllAmount: true,
      fees: new BigNumber(1000000),
    };

    const status = await getTransactionStatus(lowBalanceAccount, useAllAmountTx);

    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  test("should return error when amount is zero", async () => {
    const zeroAmountTx = {
      ...validTransaction,
      amount: new BigNumber(0),
    };

    const status = await getTransactionStatus(mockAccount, zeroAmountTx);

    expect(status.errors.amount).toBeInstanceOf(AmountRequired);
  });

  test("should return error when amount is below minimum", async () => {
    const lowAmountTx = {
      ...validTransaction,
      amount: new BigNumber(CASPER_MINIMUM_VALID_AMOUNT_MOTES).minus(1),
    };

    const status = await getTransactionStatus(mockAccount, lowAmountTx);

    expect(status.errors.amount).toBe(InvalidMinimumAmountError);
  });

  test("should return error when not enough balance for transaction", async () => {
    const lowBalanceAccount = createMockAccount({
      spendableBalance: new BigNumber(5000000),
    });

    const expensiveTx = {
      ...validTransaction,
      amount: new BigNumber(5000000),
      fees: new BigNumber(1000000),
    };

    const status = await getTransactionStatus(lowBalanceAccount, expensiveTx);

    expect(status.errors.amount).toBeInstanceOf(NotEnoughBalance);
  });

  test("should return warning when spending more than 90% of balance", async () => {
    const expensiveTx = {
      ...validTransaction,
      amount: mockAccount.spendableBalance.multipliedBy(0.95), // 95% of balance
    };

    const status = await getTransactionStatus(mockAccount, expensiveTx);

    expect(status.warnings.amount).toBe(MayBlockAccountError);
  });

  // Test using the predefined test cases
  describe("transaction status test cases", () => {
    const testCases = [
      {
        name: "Valid transaction",
        account: createMockAccount(),
        transaction: createMockTransaction(),
        expectedStatus: { errors: {}, warnings: {}, estimatedFees: createMockTransaction().fees },
      },
      {
        name: "Invalid recipient",
        account: createMockAccount(),
        transaction: createMockTransaction({ recipient: TEST_ADDRESSES.INVALID }),
        expectedStatus: {
          errors: { recipient: new InvalidAddress() },
          warnings: {},
          estimatedFees: createMockTransaction().fees,
        },
      },
      {
        name: "Zero amount",
        account: createMockAccount(),
        transaction: createMockTransaction({ amount: new BigNumber("0") }),
        expectedStatus: {
          errors: { amount: new AmountRequired() },
          warnings: {},
        },
      },
      {
        name: "High amount (warning)",
        account: createMockAccount(),
        transaction: createMockTransaction({
          amount: new BigNumber(
            createMockAccount().balance.minus(createMockTransaction().fees).toString(),
          ),
        }),
        expectedStatus: {
          errors: {},
          warnings: { amount: MayBlockAccountError },
        },
      },
      {
        name: "Insufficient funds",
        account: createMockAccount({
          balance: new BigNumber("2000000"), // 0.002 CSPR
          spendableBalance: new BigNumber("2000000"),
        }),
        transaction: createMockTransaction({
          amount: new BigNumber("2000000"),
        }),
        expectedStatus: {
          errors: { amount: new NotEnoughBalance() },
          warnings: { amount: MayBlockAccountError },
        },
      },
      {
        name: "Empty account",
        account: createMockAccount({
          balance: new BigNumber("0"),
          spendableBalance: new BigNumber("0"),
        }),
        transaction: createMockTransaction(),
        expectedStatus: {
          errors: { amount: new NotEnoughBalance() },
          warnings: { amount: MayBlockAccountError },
        },
      },
    ];

    testCases.forEach(testCase => {
      test(`should handle ${testCase.name}`, async () => {
        const status = await getTransactionStatus(testCase.account, testCase.transaction);

        // Check if errors match expected errors
        if (Object.keys(testCase.expectedStatus.errors).length) {
          // Simplified error checking
          expect(Object.keys(status.errors).length).toBeGreaterThan(0);

          // Check only specific known error keys
          if ("recipient" in testCase.expectedStatus.errors) {
            expect(status.errors.recipient).toBeTruthy();
          }

          if ("amount" in testCase.expectedStatus.errors) {
            expect(status.errors.amount).toBeTruthy();
          }
        } else {
          expect(Object.keys(status.errors).length).toBe(0);
        }

        // Check if warnings match expected warnings
        if (Object.keys(testCase.expectedStatus.warnings).length) {
          // Simplified warning checking
          expect(Object.keys(status.warnings).length).toBeGreaterThan(0);

          // Check only specific known warning keys
          if ("amount" in testCase.expectedStatus.warnings) {
            expect(status.warnings.amount).toBeTruthy();
          }
        } else {
          expect(Object.keys(status.warnings).length).toBe(0);
        }
      });
    });
  });
});
