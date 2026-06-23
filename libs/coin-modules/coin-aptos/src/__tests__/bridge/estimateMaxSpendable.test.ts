import BigNumber from "bignumber.js";
import { createFixtureAccount, createFixtureTransaction } from "../../bridge/bridge.fixture";
import estimateMaxSpendable from "../../bridge/estimateMaxSpendable";
import { DEFAULT_GAS, DEFAULT_GAS_PRICE } from "../../constants";

const DEFAULT_TOTAL_GAS = DEFAULT_GAS.multipliedBy(DEFAULT_GAS_PRICE);

describe("estimateMaxSpendable Test", () => {
  describe("spendable balance is lower than the default total gas", () => {
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

  describe("spendable balance is higher than the default total gas", () => {
    it("should return spendable amount minus the default total gas", async () => {
      const account = createFixtureAccount();

      const spendableBalance = new BigNumber(100000);

      account.spendableBalance = spendableBalance;

      const result = await estimateMaxSpendable({
        account,
      });

      const expected = spendableBalance.minus(DEFAULT_TOTAL_GAS);

      expect(result.isEqualTo(expected)).toBe(true);
    });
  });

  describe("transaction spendable balance is lower than the default total gas", () => {
    it("should return 0", async () => {
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

  describe("transaction spendable balance is higher than the default total gas", () => {
    it("should return transaction spendable amount minus the default total gas", async () => {
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction();

      const spendableBalance = new BigNumber(100000);

      account.spendableBalance = spendableBalance;

      const result = await estimateMaxSpendable({
        account,
        transaction,
      });

      const expected = spendableBalance.minus(DEFAULT_TOTAL_GAS);

      expect(result.isEqualTo(expected)).toBe(true);
    });
  });

  describe("when a transaction has a non-zero amount", () => {
    it("should ignore the amount and reserve the default total gas", async () => {
      const account = createFixtureAccount();
      const transaction = createFixtureTransaction({ amount: new BigNumber(12345) });

      const spendableBalance = new BigNumber(100000);
      account.spendableBalance = spendableBalance;

      const result = await estimateMaxSpendable({ account, transaction });

      const expected = spendableBalance.minus(DEFAULT_TOTAL_GAS);

      expect(result.isEqualTo(expected)).toBe(true);
    });
  });
});
