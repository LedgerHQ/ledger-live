import BigNumber from "bignumber.js";
import { CosmosAPI } from "../../network/Cosmos";
import { getStakes } from "./getStakes";

function mkStakes(delegations: unknown[], unbondings: unknown[]): CosmosAPI {
  return {
    getCurrency: () => ({ id: "cosmos", units: [{}, { code: "uatom" }] }),
    getDelegations: jest.fn().mockResolvedValue(delegations),
    getUnbondings: jest.fn().mockResolvedValue(unbondings),
  } as unknown as CosmosAPI;
}

describe("logic/staking/getStakes", () => {
  it("maps an active delegation with rewards", async () => {
    const api = mkStakes(
      [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("1000000"),
          pendingRewards: new BigNumber("2500"),
          status: "bonded",
        },
      ],
      [],
    );

    const page = await getStakes(api, "cosmos1a");

    expect(page.items).toHaveLength(1);
    const s = page.items[0];
    expect(s.state).toBe("active");
    expect(s.delegate).toBe("cosmosvaloper1v");
    expect(s.amountDeposited).toBe(1000000n);
    expect(s.amountRewarded).toBe(2500n);
    expect(s.amount).toBe(1002500n);
    expect(s.actions).toContain("claim_reward");
    expect(s.actions).toContain("undelegate");
  });

  it("maps an in-progress unbonding as deactivating", async () => {
    const future = new Date(Date.now() + 86_400_000);
    const api = mkStakes(
      [],
      [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("500000"),
          completionDate: future,
        },
      ],
    );

    const page = await getStakes(api, "cosmos1a");

    expect(page.items).toHaveLength(1);
    expect(page.items[0].state).toBe("deactivating");
    expect(page.items[0].amount).toBe(500000n);
  });

  it("maps a completed unbonding as withdrawable", async () => {
    const past = new Date(Date.now() - 86_400_000);
    const api = mkStakes(
      [],
      [
        {
          validatorAddress: "cosmosvaloper1v",
          amount: new BigNumber("500000"),
          completionDate: past,
        },
      ],
    );

    const page = await getStakes(api, "cosmos1a");

    expect(page.items[0].state).toBe("withdrawable");
  });

  it("returns empty items for a non-delegated account", async () => {
    const page = await getStakes(mkStakes([], []), "cosmos1a");
    expect(page.items).toEqual([]);
  });
});
