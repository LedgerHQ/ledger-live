import BigNumber from "bignumber.js";
import { getWithdrawMaxAmount, validateWithdrawAmount } from "./amount";

describe("getWithdrawMaxAmount", () => {
  it("keeps the 1 USDC Hyperliquid fee out of the max", () => {
    expect(getWithdrawMaxAmount(new BigNumber("1000"))).toEqual(new BigNumber("999"));
  });

  it("never goes below zero", () => {
    expect(getWithdrawMaxAmount(new BigNumber("0.5"))).toEqual(new BigNumber(0));
  });
});

describe("validateWithdrawAmount", () => {
  const availableBalance = new BigNumber("100");

  it("accepts an amount that leaves room for the fee", () => {
    expect(validateWithdrawAmount({ amount: new BigNumber("99"), availableBalance })).toBeNull();
  });

  it("rejects an amount that leaves no room for the fee", () => {
    expect(validateWithdrawAmount({ amount: new BigNumber("99.01"), availableBalance })).toBe(
      "insufficientBalance",
    );
  });

  it("does not flag an empty amount", () => {
    expect(validateWithdrawAmount({ amount: new BigNumber(0), availableBalance })).toBeNull();
  });
});
