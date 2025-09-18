import { BigNumber } from "bignumber.js";
import { prepareTransaction } from "./prepareTransaction";
import { getEstimatedFees } from "./bridgeHelpers/fee";
import { updateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";
import { createMockAccount, createMockTransaction } from "../test/fixtures";

// Mock dependencies
jest.mock("./bridgeHelpers/fee", () => ({
  getEstimatedFees: jest.fn(),
}));

jest.mock("@ledgerhq/coin-framework/bridge/jsHelpers", () => ({
  updateTransaction: jest.fn((tx, updates) => ({ ...tx, ...updates })),
}));

describe("prepareTransaction", () => {
  const mockAccount = createMockAccount({
    id: "casper:0:testAccount",
    spendableBalance: new BigNumber(10000000),
  });

  const mockTransaction = createMockTransaction({
    recipient: "01fedcba0987654321",
    amount: new BigNumber(5000000),
    useAllAmount: false,
    fees: new BigNumber(1000000),
    transferId: "1",
  });

  const mockEstimatedFees = new BigNumber(1000000);

  beforeEach(() => {
    jest.clearAllMocks();
    (getEstimatedFees as jest.Mock).mockReturnValue(mockEstimatedFees);
  });

  test("should prepare a regular transaction with estimated fees", async () => {
    const result = await prepareTransaction(mockAccount, mockTransaction);

    expect(getEstimatedFees).toHaveBeenCalled();
    expect(updateTransaction).toHaveBeenCalledWith(mockTransaction, {
      fees: mockEstimatedFees,
      amount: mockTransaction.amount,
    });

    expect(result).toEqual({
      ...mockTransaction,
      fees: mockEstimatedFees,
    });
  });

  test("should calculate correct amount for useAllAmount transactions", async () => {
    const useAllAmountTx = createMockTransaction({
      ...mockTransaction,
      useAllAmount: true,
    });

    const result = await prepareTransaction(mockAccount, useAllAmountTx);

    const expectedAmount = mockAccount.spendableBalance.minus(mockEstimatedFees);

    expect(updateTransaction).toHaveBeenCalledWith(useAllAmountTx, {
      fees: mockEstimatedFees,
      amount: expectedAmount,
    });

    expect(result).toEqual({
      ...useAllAmountTx,
      fees: mockEstimatedFees,
      amount: expectedAmount,
    });
  });

  test("should recalculate amount for useAllAmount transactions after fee update", async () => {
    const useAllAmountTx = createMockTransaction({
      ...mockTransaction,
      useAllAmount: true,
    });

    const result = await prepareTransaction(mockAccount, useAllAmountTx);

    const expectedAmount = mockAccount.spendableBalance.minus(mockEstimatedFees);

    expect(result.amount).toEqual(expectedAmount);
  });

  // Using parameterized testing with fixtures
  describe("with test case fixtures", () => {
    // Define test cases inline for controlled fee values
    test.each([
      {
        name: "Standard transaction",
        account: createMockAccount({
          spendableBalance: new BigNumber("10000000000"),
        }),
        transaction: createMockTransaction({
          amount: new BigNumber("1000000000"),
          useAllAmount: false,
        }),
        expectedResult: {
          fees: mockEstimatedFees,
          amount: new BigNumber("1000000000"),
        },
      },
      {
        name: "Use all amount transaction",
        account: createMockAccount({
          spendableBalance: new BigNumber("10000000000"),
        }),
        transaction: createMockTransaction({
          useAllAmount: true,
        }),
        expectedResult: {
          fees: mockEstimatedFees,
          amount: new BigNumber("10000000000").minus(mockEstimatedFees),
        },
      },
      {
        name: "Low balance account",
        account: createMockAccount({
          spendableBalance: new BigNumber(mockEstimatedFees.div(2)),
        }),
        transaction: createMockTransaction({
          useAllAmount: true,
        }),
        expectedResult: {
          fees: mockEstimatedFees,
          // For low balance, amount should be negative (will be handled in the test)
          amount: new BigNumber(mockEstimatedFees.div(2)).minus(mockEstimatedFees),
        },
      },
      {
        name: "Exactly enough for fees",
        account: createMockAccount({
          spendableBalance: mockEstimatedFees,
        }),
        transaction: createMockTransaction({
          useAllAmount: true,
        }),
        expectedResult: {
          fees: mockEstimatedFees,
          // For exact fee balance, amount should be zero
          amount: new BigNumber("0"),
        },
      },
      {
        name: "Custom fee override",
        account: createMockAccount({
          spendableBalance: new BigNumber("10000000000"),
        }),
        transaction: createMockTransaction({
          fees: new BigNumber("2000000"),
          useAllAmount: true,
        }),
        expectedResult: {
          fees: mockEstimatedFees,
          amount: new BigNumber("10000000000").minus(mockEstimatedFees),
        },
      },
    ])("$name", async ({ account, transaction, expectedResult }) => {
      const result = await prepareTransaction(account, transaction);
      expect(result.fees).toEqual(expectedResult.fees);

      // For negative balance scenarios, just check they're less than or equal to zero
      if (account.spendableBalance.lt(mockEstimatedFees) && transaction.useAllAmount) {
        expect(result.amount.lte(new BigNumber("0"))).toBe(true);
      } else if (account.spendableBalance.eq(mockEstimatedFees) && transaction.useAllAmount) {
        expect(result.amount.eq(new BigNumber("0"))).toBe(true);
      } else {
        expect(result.amount).toEqual(expectedResult.amount);
      }
    });
  });
});
