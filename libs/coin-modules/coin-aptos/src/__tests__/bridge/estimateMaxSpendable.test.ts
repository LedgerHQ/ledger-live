import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../../bridge/bridge.fixture";
import estimateMaxSpendable from "../../bridge/estimateMaxSpendable";

jest.mock("../../bridge/getFeesForTransaction", () => ({
  getEstimatedGas: jest.fn(() => ({
    fees: new BigNumber(0),
    estimate: {
      maxGasAmount: 1,
      gasUnitPrice: 2,
    },
    errors: {},
  })),
}));

describe("estimateMaxSpendable Test", () => {
  describe("spendable balance is lower than the total gas", () => {
    it("should return 0", async () => {
      const account = createFixtureAccount();

      const spendableBalance = new BigNumber(0);

      account.spendableBalance = spendableBalance;

      const result = await estimateMaxSpendable({
        account,
      });

      const expected = spendableBalance;

      expect(result.isEqualTo(expected)).toBe(true);
    });
  });

  describe("spendable balance is higher than the total gas", () => {
    it("should return spendable amount minus total gas", async () => {
      const account = createFixtureAccount();

      const spendableBalance = new BigNumber(100000);

      account.spendableBalance = spendableBalance;

      const result = await estimateMaxSpendable({
        account,
      });

      const expected = new BigNumber(80000);

      expect(result.isEqualTo(expected)).toBe(true);
    });
  });

  describe("transaction spendable balance is higher than the total gas", () => {
    it("should return transaction spendable amount minus total gas", async () => {
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction();

      const spendableBalance = new BigNumber(1);

      account.spendableBalance = spendableBalance;

      const result = await estimateMaxSpendable({
        account,
        transaction,
      });

      const expected = new BigNumber(0);

      expect(result.isEqualTo(expected)).toBe(true);
    });
  });

  describe("transaction spendable balance is higher than the total gas", () => {
    it("should return transaction spendable amount minus total gas", async () => {
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction();

      const spendableBalance = new BigNumber(100000);

      account.spendableBalance = spendableBalance;

      const result = await estimateMaxSpendable({
        account,
        transaction,
      });

      const expected = new BigNumber(99998);

      expect(result.isEqualTo(expected)).toBe(true);
    });
  });
});
