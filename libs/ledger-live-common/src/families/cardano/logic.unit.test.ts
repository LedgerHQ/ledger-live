import BigNumber from "bignumber.js";
import { canStake } from "./logic";
import { CardanoAccount } from "./types";

describe("canStake", () => {
  it("should return false when acc delegation data is incomplete", () => {
    const noResourcesAcc = {} as CardanoAccount;
    expect(canStake(noResourcesAcc)).toEqual(false);
    const noDelegationAcc = {
      cardanoResources: {},
      balance: new BigNumber(1),
    } as CardanoAccount;
    expect(canStake(noDelegationAcc)).toEqual(false);
    const noPoolIdAcc = {
      balance: new BigNumber(1),
      cardanoResources: {
        delegation: {},
      },
    } as CardanoAccount;
    expect(canStake(noPoolIdAcc)).toEqual(false);
  });

  it("should return false when acc already has a delegation but no funds", () => {
    const poolIdNoFundsAcc = {
      balance: new BigNumber(0),
      cardanoResources: {
        delegation: {
          poolId: "helloiamapoolid",
        },
      },
    } as CardanoAccount;
    expect(canStake(poolIdNoFundsAcc)).toEqual(false);
  });

  it("should return false when acc has no funds", () => {
    const noResourcesAcc = { balance: new BigNumber(0) } as CardanoAccount;
    expect(canStake(noResourcesAcc)).toEqual(false);
  });

  it("should return true when acc already has a delegation and funds", () => {
    const poolIdAcc = {
      balance: new BigNumber(1),
      cardanoResources: {
        delegation: {
          poolId: "helloiamapoolid",
        },
      },
    } as CardanoAccount;
    expect(canStake(poolIdAcc)).toEqual(true);
  });
});
