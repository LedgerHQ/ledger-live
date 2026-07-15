import { getStakes } from "./getStakes";
import type { MultiversXNetworkApi } from "../../network/api";

const ADDR = "erd1spyavw0956vq68xj8y4tenjpq2wd5a9p2c6j8gsz7ztyrnpxrruqzu66jx";
const CONTRACT = "erd1qqqqqqqqqqqqqqqpqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqplllst77y4l";

function makeApi(delegations: unknown[] = []): MultiversXNetworkApi {
  return {
    getAccountDelegations: jest.fn().mockResolvedValue(delegations),
  } as unknown as MultiversXNetworkApi;
}

describe("getStakes", () => {
  it("returns empty page for non-delegated account", async () => {
    const api = makeApi([]);
    const result = await getStakes(api, ADDR);
    expect(result.items).toHaveLength(0);
  });

  it("propagates a delegation API failure instead of returning an empty page", async () => {
    const api = {
      getAccountDelegations: jest.fn().mockRejectedValue(new Error("delegation api down")),
    } as unknown as MultiversXNetworkApi;
    await expect(getStakes(api, ADDR)).rejects.toThrow("delegation api down");
  });

  it("returns active stake for delegated account", async () => {
    const api = makeApi([
      {
        address: ADDR,
        contract: CONTRACT,
        userUnBondable: "0",
        userActiveStake: "1000000000000000000",
        claimableRewards: "50000000000000000",
        userUndelegatedList: [],
      },
    ]);
    const result = await getStakes(api, ADDR);

    expect(result.items).toHaveLength(1);
    const stake = result.items[0];
    expect(stake.state).toBe("active");
    expect(stake.delegate).toBe(CONTRACT);
    expect(stake.amount).toBe(1050000000000000000n); // active + rewards
    expect(stake.amountDeposited).toBe(1000000000000000000n);
    expect(stake.amountRewarded).toBe(50000000000000000n);
  });

  it("returns deactivating stake for unbonding positions", async () => {
    const api = makeApi([
      {
        address: ADDR,
        contract: CONTRACT,
        userUnBondable: "0",
        userActiveStake: "0",
        claimableRewards: "0",
        userUndelegatedList: [{ amount: "500000000000000000", seconds: 86400 }],
      },
    ]);
    const result = await getStakes(api, ADDR);

    // active (0) + 1 unbonding
    const deactivating = result.items.filter(s => s.state === "deactivating");
    expect(deactivating).toHaveLength(1);
    expect(deactivating[0].amount).toBe(500000000000000000n);
    expect(deactivating[0].details?.unbondingSeconds).toBe(86400);
    // still unbonding → no action yet
    expect(deactivating[0].actions).toEqual([]);
  });

  it("returns a withdrawable stake with a withdraw action for matured unbonding", async () => {
    const api = makeApi([
      {
        address: ADDR,
        contract: CONTRACT,
        userUnBondable: "0",
        userActiveStake: "0",
        claimableRewards: "0",
        userUndelegatedList: [{ amount: "500000000000000000", seconds: 0 }],
      },
    ]);
    const result = await getStakes(api, ADDR);

    const withdrawable = result.items.filter(s => s.state === "withdrawable");
    expect(withdrawable).toHaveLength(1);
    expect(withdrawable[0].amount).toBe(500000000000000000n);
    expect(withdrawable[0].actions).toEqual(["withdraw"]);
    // never surfaces claim_reward on an unbonded position
    expect(withdrawable[0].actions).not.toContain("claim_reward");
  });

  it("uid is unique across stakes", async () => {
    const api = makeApi([
      {
        address: ADDR,
        contract: CONTRACT,
        userUnBondable: "0",
        userActiveStake: "1000000000000000000",
        claimableRewards: "0",
        userUndelegatedList: [
          { amount: "100000000000000000", seconds: 3600 },
          { amount: "200000000000000000", seconds: 7200 },
        ],
      },
    ]);
    const result = await getStakes(api, ADDR);
    const uids = result.items.map(s => s.uid);
    const unique = new Set(uids);
    expect(unique.size).toBe(result.items.length);
  });
});
