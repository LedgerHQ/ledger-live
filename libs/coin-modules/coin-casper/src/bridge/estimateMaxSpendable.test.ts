import { Account } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { getEstimatedFees } from "./bridgeHelpers/fee";
import { Transaction } from "../types";
import { createMockAccount } from "../test/fixtures";

// Mock the fee helper
jest.mock("./bridgeHelpers/fee", () => ({
  getEstimatedFees: jest.fn().mockReturnValue(new BigNumber(1000000)),
}));

describe("estimateMaxSpendable", () => {
  const mockAccount: Partial<Account> = {
    id: "casper:0:testAccount",
    type: "Account",
    spendableBalance: new BigNumber(10000000),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should return zero when balance is zero", async () => {
    const zeroBalanceAccount = {
      ...mockAccount,
      spendableBalance: new BigNumber(0),
    };

    const result = await estimateMaxSpendable({
      account: zeroBalanceAccount as Account,
      parentAccount: undefined,
    });

    expect(result.toNumber()).toBe(0);
    expect(getEstimatedFees).not.toHaveBeenCalled();
  });

  test("should return balance minus fees when no transaction is provided", async () => {
    const result = await estimateMaxSpendable({
      account: mockAccount as Account,
      parentAccount: undefined,
    });

    const expectedFees = new BigNumber(1000000);
    const expectedMaxSpendable = mockAccount.spendableBalance!.minus(expectedFees);

    expect(result.toString()).toBe(expectedMaxSpendable.toString());
    expect(getEstimatedFees).toHaveBeenCalled();
  });

  test("should use transaction fees when transaction is provided", async () => {
    const transactionFees = new BigNumber(500000);
    const mockTransaction: Partial<Transaction> = {
      fees: transactionFees,
    };

    const result = await estimateMaxSpendable({
      account: mockAccount as Account,
      parentAccount: undefined,
      transaction: mockTransaction as Transaction,
    });

    const expectedMaxSpendable = mockAccount.spendableBalance!.minus(transactionFees);

    expect(result.toString()).toBe(expectedMaxSpendable.toString());
    expect(getEstimatedFees).not.toHaveBeenCalled();
  });

  test("should return zero when balance is less than fees", async () => {
    const lowBalanceAccount = {
      ...mockAccount,
      spendableBalance: new BigNumber(500000), // Less than default fee of 1000000
    };

    const result = await estimateMaxSpendable({
      account: lowBalanceAccount as Account,
      parentAccount: undefined,
    });

    expect(result.toString()).toBe("0");
  });

  test("should use main account when parentAccount is provided", async () => {
    const parentAccount = {
      id: "casper:parent",
      spendableBalance: new BigNumber(0),
    };

    const result = await estimateMaxSpendable({
      account: mockAccount as Account,
      parentAccount: parentAccount as Account,
    });

    const expectedFees = new BigNumber(1000000);
    const expectedMaxSpendable = mockAccount.spendableBalance!.minus(expectedFees);

    expect(result.toString()).toBe(expectedMaxSpendable.toString());
  });
});

// Add test cases from fixtures
describe("estimateMaxSpendable with standard test cases", () => {
  const standardFees = new BigNumber("1000000");

  beforeEach(() => {
    (getEstimatedFees as jest.Mock).mockReturnValue(standardFees);
  });

  test.each([
    {
      name: "Standard account",
      account: createMockAccount(),
      expectedResult: new BigNumber("10000000000").minus(standardFees),
    },
    {
      name: "Empty account",
      account: createMockAccount({
        balance: new BigNumber("0"),
        spendableBalance: new BigNumber("0"),
      }),
      expectedResult: new BigNumber("0"),
    },
    {
      name: "Account with balance less than fees",
      account: createMockAccount({
        balance: standardFees.div(2),
        spendableBalance: standardFees.div(2),
      }),
      expectedResult: new BigNumber("0"),
    },
    {
      name: "Account with balance equal to fees",
      account: createMockAccount({
        balance: standardFees,
        spendableBalance: standardFees,
      }),
      expectedResult: new BigNumber("0"),
    },
    {
      name: "Account with high balance",
      account: createMockAccount({
        balance: new BigNumber("100000000000000"),
        spendableBalance: new BigNumber("100000000000000"),
      }),
      expectedResult: new BigNumber("100000000000000").minus(standardFees),
    },
  ])("should handle $name", async ({ account, expectedResult }) => {
    const result = await estimateMaxSpendable({
      account: account,
      parentAccount: undefined,
    });
    expect(result.toString()).toBe(expectedResult.toString());
  });
});
