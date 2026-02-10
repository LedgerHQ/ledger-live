import { BigNumber } from "bignumber.js";
import { SuiAccount, Transaction } from "../types";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { estimateMaxSpendable } from "./estimateMaxSpendable";

const mockEstimateFees = jest.fn();
jest.mock("../logic", () => ({
  estimateFees: () => mockEstimateFees(),
}));

describe("estimateMaxSpendable", () => {
  it("should return the correct spendable amount when fees are deducted", async () => {
    // GIVEN
    const balance = new BigNumber(100);
    const account: SuiAccount = createFixtureAccount({ spendableBalance: balance });
    const transaction: Transaction = createFixtureTransaction();
    const fees = new BigNumber(10);
    mockEstimateFees.mockResolvedValue(fees);

    // WHEN
    const result = await estimateMaxSpendable({ account, transaction });

    // THEN
    expect(mockEstimateFees).toHaveBeenCalledTimes(1);
    expect(result).toEqual(balance.minus(fees));
  });

  it("should apply delegation-specific constraints and gas reservation", async () => {
    // GIVEN
    const balance = new BigNumber("5000000000"); // 5 SUI
    const account: SuiAccount = createFixtureAccount({ spendableBalance: balance });
    const transaction: Transaction = createFixtureTransaction({ mode: "delegate" });
    const fees = new BigNumber("100000000"); // 0.1 SUI
    mockEstimateFees.mockResolvedValue(fees);

    // WHEN
    const result = await estimateMaxSpendable({ account, transaction });

    // THEN
    // Should deduct fees (0.1 SUI) = 0.1 SUI from 5 SUI = 4.9 SUI
    const expectedAmount = balance.minus(fees); // 4.8 SUI
    expect(result).toEqual(expectedAmount);
  });

  it("should return 0 for delegation when balance is below minimum threshold", async () => {
    // GIVEN
    const balance = new BigNumber("800000000"); // 0.8 SUI (below 1 SUI minimum after fees/reserve)
    const account: SuiAccount = createFixtureAccount({ spendableBalance: balance });
    const transaction: Transaction = createFixtureTransaction({ mode: "delegate" });
    const fees = new BigNumber("100000000"); // 0.1 SUI
    mockEstimateFees.mockResolvedValue(fees);

    // WHEN
    const result = await estimateMaxSpendable({ account, transaction });

    // THEN
    // After deducting fees (0.1) + gas reserve (0.1) = 0.6 SUI, which is < 1 SUI minimum
    expect(result).toEqual(new BigNumber(0));
  });
});
