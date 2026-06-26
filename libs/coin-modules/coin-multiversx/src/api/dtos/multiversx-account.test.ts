import BigNumber from "bignumber.js";
import { MultiversXAccount } from "./multiversx-account";

describe("MultiversXAccount", () => {
  describe("constructor", () => {
    it("creates account with all properties", () => {
      const balance = new BigNumber("1000000000000000000");
      const nonce = 5;
      const isGuarded = true;
      const blockHeight = 12345;

      const account = new MultiversXAccount(balance, nonce, isGuarded, blockHeight);

      expect(account.balance).toEqual(balance);
      expect(account.nonce).toBe(5);
      expect(account.isGuarded).toBe(true);
      expect(account.blockHeight).toBe(12345);
    });

    it("converts null isGuarded to false", () => {
      const account = new MultiversXAccount(new BigNumber("0"), 0, null, 0);

      expect(account.isGuarded).toBe(false);
    });

    it("converts undefined isGuarded to false", () => {
      const account = new MultiversXAccount(new BigNumber("0"), 0, undefined, 0);

      expect(account.isGuarded).toBe(false);
    });

    it("converts false isGuarded to false", () => {
      const account = new MultiversXAccount(new BigNumber("0"), 0, false, 0);

      expect(account.isGuarded).toBe(false);
    });

    it("handles zero balance", () => {
      const account = new MultiversXAccount(new BigNumber("0"), 0, false, 0);

      expect(account.balance.toString()).toBe("0");
    });

    it("handles large balance values", () => {
      const largeBalance = new BigNumber("999999999999999999999999999");
      const account = new MultiversXAccount(largeBalance, 0, false, 0);

      // BigNumber may use exponential notation for very large values
      expect(account.balance.isEqualTo(largeBalance)).toBe(true);
    });

    it("handles high nonce values", () => {
      const account = new MultiversXAccount(new BigNumber("0"), 999999, false, 0);

      expect(account.nonce).toBe(999999);
    });

    it("handles high blockHeight values", () => {
      const account = new MultiversXAccount(new BigNumber("0"), 0, false, 9999999);

      expect(account.blockHeight).toBe(9999999);
    });
  });
});
