import BigNumber from "bignumber.js";
import { buildStakes } from "./toStakes";

describe("logic/staking/toStakes", () => {
  it("maps a bonded delegation to an active stake with principal amount", () => {
    const [s] = buildStakes("cosmos1a", {
      delegations: [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("1000000"),
          pendingRewards: new BigNumber("2500"),
          status: "bonded",
        },
      ],
      unbondings: [],
    } as any);
    expect(s.state).toBe("active");
    expect(s.delegate).toBe("cosmosvaloper1v");
    expect(s.amount).toBe(1_000_000n); // principal, excludes rewards
    expect(s.amountDeposited).toBe(1_000_000n);
    expect(s.amountRewarded).toBe(2_500n);
    expect(s.actions).toContain("claim_reward");
  });

  it("keeps a delegation to a non-bonded validator as an active position (matches legacy inclusion)", () => {
    const [s] = buildStakes("cosmos1a", {
      delegations: [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("1000000"),
          pendingRewards: new BigNumber("0"),
          status: "unbonding",
        },
      ],
      unbondings: [],
    } as any);
    expect(s.state).toBe("active");
  });

  it("maps an in-progress unbonding to a deactivating stake carrying its completion date", () => {
    const completionDate = new Date(Date.now() + 86_400_000);
    const [s] = buildStakes("cosmos1a", {
      delegations: [],
      unbondings: [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("500000"),
          completionDate,
        },
      ],
    } as any);
    expect(s.state).toBe("deactivating");
    // the framework surfaces stateUpdatedAt as the unbonding's completionDate
    expect(s.stateUpdatedAt).toEqual(completionDate);
    expect(s.amount).toBe(500_000n);
    expect(s.amountRewarded).toBe(0n);
  });
});
