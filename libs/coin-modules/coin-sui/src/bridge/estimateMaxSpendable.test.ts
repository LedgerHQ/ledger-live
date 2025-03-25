import { BigNumber } from "bignumber.js";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { createFixtureAccount, createFixtureTransaction } from "../types/bridge.fixture";
import { SuiAccount, Transaction } from "../types";

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
});
