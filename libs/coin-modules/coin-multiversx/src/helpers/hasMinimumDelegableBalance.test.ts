import BigNumber from "bignumber.js";
import { hasMinimumDelegableBalance } from "./hasMinimumDelegableBalance";
import { MIN_DELEGATION_AMOUNT } from "../constants";
import type { Account } from "@ledgerhq/types-live";

describe("hasMinimumDelegableBalance", () => {
  const createMockAccount = (spendableBalance: string): Account =>
    ({
      spendableBalance: new BigNumber(spendableBalance),
    }) as Account;

  it("returns true when spendable balance equals minimum delegation amount", () => {
    const account = createMockAccount(MIN_DELEGATION_AMOUNT.toString());

    const result = hasMinimumDelegableBalance(account);

    expect(result).toBe(true);
  });

  it("returns true when spendable balance exceeds minimum delegation amount", () => {
    const account = createMockAccount(MIN_DELEGATION_AMOUNT.plus(1).toString());

    const result = hasMinimumDelegableBalance(account);

    expect(result).toBe(true);
  });

  it("returns false when spendable balance is below minimum delegation amount", () => {
    const account = createMockAccount(MIN_DELEGATION_AMOUNT.minus(1).toString());

    const result = hasMinimumDelegableBalance(account);

    expect(result).toBe(false);
  });

  it("returns false when spendable balance is zero", () => {
    const account = createMockAccount("0");

    const result = hasMinimumDelegableBalance(account);

    expect(result).toBe(false);
  });

  it("returns true when spendable balance is much larger than minimum", () => {
    // 100 EGLD
    const account = createMockAccount("100000000000000000000");

    const result = hasMinimumDelegableBalance(account);

    expect(result).toBe(true);
  });

  it("uses MIN_DELEGATION_AMOUNT constant (1 EGLD)", () => {
    // Verify the constant is 1 EGLD (10^18)
    expect(MIN_DELEGATION_AMOUNT.toString()).toBe("1000000000000000000");
  });
});
