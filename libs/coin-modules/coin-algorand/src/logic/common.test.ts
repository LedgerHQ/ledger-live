import { ALGORAND_MIN_ACCOUNT_BALANCE, computeMinimumBalance, computeMaxSpendable } from "./common";

describe("ALGORAND_MIN_ACCOUNT_BALANCE", () => {
  it("should be 100000 microAlgos (0.1 ALGO)", () => {
    expect(ALGORAND_MIN_ACCOUNT_BALANCE).toBe(100000n);
  });
});

describe("computeMinimumBalance", () => {
  it("should return base balance for account with no assets", () => {
    const result = computeMinimumBalance(0);
    expect(result).toBe(100000n); // 0.1 ALGO
  });

  it("should add 0.1 ALGO per asset", () => {
    expect(computeMinimumBalance(1)).toBe(200000n); // 0.2 ALGO
    expect(computeMinimumBalance(2)).toBe(300000n); // 0.3 ALGO
    expect(computeMinimumBalance(5)).toBe(600000n); // 0.6 ALGO
    expect(computeMinimumBalance(10)).toBe(1100000n); // 1.1 ALGO
  });

  it("should add extra 0.1 ALGO when opting in", () => {
    expect(computeMinimumBalance(0, true)).toBe(200000n);
    expect(computeMinimumBalance(1, true)).toBe(300000n);
    expect(computeMinimumBalance(5, true)).toBe(700000n);
  });

  it("should not add extra when isOptingIn is false", () => {
    expect(computeMinimumBalance(3, false)).toBe(400000n);
  });
});

describe("computeMaxSpendable", () => {
  it("should return balance minus minimum balance", () => {
    const balance = 1000000n; // 1 ALGO
    const result = computeMaxSpendable(balance, 0);
    expect(result).toBe(900000n); // 0.9 ALGO
  });

  it("should account for assets in max spendable", () => {
    const balance = 1000000n;
    expect(computeMaxSpendable(balance, 1)).toBe(800000n);
    expect(computeMaxSpendable(balance, 2)).toBe(700000n);
    expect(computeMaxSpendable(balance, 5)).toBe(400000n);
  });

  it("should account for opt-in in max spendable", () => {
    const balance = 1000000n;
    expect(computeMaxSpendable(balance, 0, true)).toBe(800000n);
    expect(computeMaxSpendable(balance, 2, true)).toBe(600000n);
  });

  it("should return 0 when balance is less than minimum", () => {
    expect(computeMaxSpendable(50000n, 0)).toBe(0n);
    expect(computeMaxSpendable(100000n, 1)).toBe(0n);
    expect(computeMaxSpendable(0n, 0)).toBe(0n);
  });

  it("should return 0 when balance equals minimum", () => {
    expect(computeMaxSpendable(100000n, 0)).toBe(0n);
    expect(computeMaxSpendable(200000n, 1)).toBe(0n);
  });

  it("should handle large balances", () => {
    const balance = 10000000000n; // 10000 ALGO
    expect(computeMaxSpendable(balance, 100)).toBe(9989900000n);
  });
});
