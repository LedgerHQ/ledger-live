import BigNumber from "bignumber.js";
import { canStake, isAlreadyStaking } from "./logic";
import { CardanoAccount } from "./types";

describe("canStake", () => {
  it("should return false when acc not present", () => {
    const noResourcesAcc = {} as CardanoAccount;
    expect(canStake(noResourcesAcc)).toEqual(false);
  });

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
