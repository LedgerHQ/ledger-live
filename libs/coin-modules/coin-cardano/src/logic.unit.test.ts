import BigNumber from "bignumber.js";
import { canStake, computeAdaBalance, isAlreadyStaking, isValidNumString } from "./logic";
import { CardanoAccount } from "./types";

describe("canStake", () => {
  it("should return false when acc has no funds", () => {
    const accWithNoFunds = {
      balance: new BigNumber(0),
    } as CardanoAccount;
    expect(canStake(accWithNoFunds)).toEqual(false);
  });

  it("should return true when acc has funds", () => {
    const accWithFunds = {
      balance: new BigNumber(1),
    } as CardanoAccount;
    expect(canStake(accWithFunds)).toEqual(true);
  });
});

describe("isAlreadyStaking", () => {
  it("should return false when acc isn't delegating", () => {
    const noResourcesAcc = {} as CardanoAccount;
    expect(isAlreadyStaking(noResourcesAcc)).toEqual(false);
    const noDelegationAcc = {
      cardanoResources: {},
    } as CardanoAccount;
    expect(isAlreadyStaking(noDelegationAcc)).toEqual(false);
    const noPoolIdAcc = { cardanoResources: { delegation: {} } } as CardanoAccount;
    expect(isAlreadyStaking(noPoolIdAcc)).toEqual(false);
  });

  it("should return true when acc is delegating", () => {
    const noResourcesAcc = {
      cardanoResources: { delegation: { poolId: "itspoolid" } },
    } as CardanoAccount;
    expect(isAlreadyStaking(noResourcesAcc)).toEqual(true);
  });
});

describe("isValidNumString", () => {
  it("should return false for invalid number", () => {
    expect(isValidNumString("")).toEqual(false);
    expect(isValidNumString(undefined)).toEqual(false);
    expect(isValidNumString(null)).toEqual(false);
    expect(isValidNumString({})).toEqual(false);
    expect(isValidNumString([])).toEqual(false);
  });

  it("should return true for valid number", () => {
    expect(isValidNumString(123)).toEqual(true);
    expect(isValidNumString(123.321)).toEqual(true);
    expect(isValidNumString("123")).toEqual(true);
    expect(isValidNumString("123.321")).toEqual(true);
  });
});

describe("computeAdaBalance", () => {
  const bn = (n: number | string) => new BigNumber(n);

  it("totals UTXO ADA plus rewards; spends everything when nothing is locked", () => {
    const { total, spendable } = computeAdaBalance({
      utxosSum: bn(5_000_000),
      minAdaForTokens: bn(0),
      rewards: bn(0),
      delegatedToDRep: false,
    });
    expect(total.toFixed()).toBe("5000000");
    expect(spendable.toFixed()).toBe("5000000");
  });

  it("locks the min-ADA backing held tokens", () => {
    const { total, spendable } = computeAdaBalance({
      utxosSum: bn(5_000_000),
      minAdaForTokens: bn(1_500_000),
      rewards: bn(0),
      delegatedToDRep: false,
    });
    expect(total.toFixed()).toBe("5000000");
    expect(spendable.toFixed()).toBe("3500000"); // locked = 1,500,000
  });

  it("keeps rewards out of spendable until delegated to a dRep", () => {
    const args = {
      utxosSum: bn(5_000_000),
      minAdaForTokens: bn(0),
      rewards: bn(1_500_000),
    };
    const withoutDRep = computeAdaBalance({ ...args, delegatedToDRep: false });
    expect(withoutDRep.total.toFixed()).toBe("6500000");
    expect(withoutDRep.spendable.toFixed()).toBe("5000000"); // rewards locked

    const withDRep = computeAdaBalance({ ...args, delegatedToDRep: true });
    expect(withDRep.total.toFixed()).toBe("6500000");
    expect(withDRep.spendable.toFixed()).toBe("6500000"); // rewards now spendable
  });

  it("never reports negative spendable when min-ADA exceeds the UTXO ADA", () => {
    // Edge case: tokens require more backing ADA than the address holds. spendable floors at 0
    // (the dRep rewards are still added on top), so locked never exceeds the total.
    const { total, spendable } = computeAdaBalance({
      utxosSum: bn(1_000_000),
      minAdaForTokens: bn(1_500_000),
      rewards: bn(800_000),
      delegatedToDRep: true,
    });
    expect(total.toFixed()).toBe("1800000");
    expect(spendable.toFixed()).toBe("800000"); // max(0, 1,000,000 - 1,500,000) + 800,000
    expect(total.minus(spendable).gte(0)).toBe(true);
  });
});
