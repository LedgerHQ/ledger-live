import { fetchEarnedStakerRewards, fetchPoxInfo, fetchStakerInfo } from "../network/pox";
import { getStakes } from "./getStakes";

jest.mock("../network/pox");

describe("getStakes", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (fetchPoxInfo as jest.Mock).mockResolvedValue({
      contract_id: "SP000000000000000000002Q6VF78.pox-5",
      current_burnchain_block_height: 961566,
      current_cycle: { id: 141, min_threshold_ustx: 0, stacked_ustx: 0, is_pox_active: true },
      reward_cycle_length: 2100,
      first_burnchain_block_height: 0,
    });
  });

  it("returns an empty page when the address has never staked", async () => {
    (fetchStakerInfo as jest.Mock).mockResolvedValue(undefined);

    await expect(getStakes("SP_ADDRESS")).resolves.toEqual({ items: [] });
  });

  it("returns a synthetic active Stake when the lock is mid-term", async () => {
    (fetchStakerInfo as jest.Mock).mockResolvedValue({
      amountUstx: 200000000000n,
      firstRewardCycle: 100,
      numCycles: 96,
      signer: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.native-pool-signer-manager",
    });
    (fetchEarnedStakerRewards as jest.Mock).mockResolvedValue(500n);

    const { items } = await getStakes("SP_ADDRESS");

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      uid: "SP_ADDRESS",
      address: "SP_ADDRESS",
      delegate: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.native-pool-signer-manager",
      state: "active",
      actions: ["undelegate"],
      asset: { type: "native" },
      amount: 200000000000n,
      details: {
        firstRewardCycle: 100,
        numCycles: 96,
        rewardAsset: "sbtc",
        amountRewarded: "500",
      },
    });
  });

  it("classifies the stake as deactivating on its final reward cycle", async () => {
    (fetchStakerInfo as jest.Mock).mockResolvedValue({
      amountUstx: 200000000000n,
      firstRewardCycle: 46,
      numCycles: 96,
      signer: "SP3K8BC0PPEVCV7NZ6QSRWPQ2JE9E5B6N3PA0KBR9.native-pool-signer-manager",
    });
    (fetchEarnedStakerRewards as jest.Mock).mockResolvedValue(0n);

    const { items } = await getStakes("SP_ADDRESS");

    expect(items[0].state).toBe("deactivating");
    expect(items[0].actions).toEqual([]);
  });
});
