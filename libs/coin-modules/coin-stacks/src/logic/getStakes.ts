import type { Cursor, Page, Stake, StakeState } from "@ledgerhq/coin-module-framework/api/index";
import { fetchEarnedStakerRewards, fetchPoxInfo, fetchStakerInfo } from "../network/pox";

const NATIVE_ASSET = { type: "native" as const };

/**
 * Single synthetic Stake built from pox-5's `get-staker-info` (locked amount + pool signer) and
 * `get-earned-staker-rewards` (accrued sBTC rewards, a different asset than the stake itself).
 *
 * `state` is a heuristic: pox-5 has no "unstake requested" flag, so a stake in its final reward
 * cycle is approximated as "deactivating" -- this can't distinguish that from a full-term stake
 * that already called `unstake` but hasn't reached its (shortened) final cycle yet.
 */
export async function getStakes(address: string, _cursor?: Cursor): Promise<Page<Stake>> {
  const poxInfo = await fetchPoxInfo();
  const staker = await fetchStakerInfo(poxInfo.contract_id, address);

  if (!staker) {
    return { items: [] };
  }

  const { amountUstx, firstRewardCycle, numCycles, signer } = staker;
  const currentCycle = poxInfo.current_cycle.id;

  const state: StakeState =
    currentCycle >= firstRewardCycle + numCycles - 1 ? "deactivating" : "active";

  const earnedRewards = await fetchEarnedStakerRewards(
    poxInfo.contract_id,
    signer,
    currentCycle,
    address,
  );

  const stake: Stake = {
    uid: address,
    address,
    delegate: signer,
    state,
    // `delegate` is never valid on an existing stake (pox-5's `stake` would abort with
    // ERR_ALREADY_STAKED); nothing useful to do once already deactivating.
    actions: state === "active" ? ["undelegate"] : [],
    asset: NATIVE_ASSET,
    amount: amountUstx,
    details: {
      firstRewardCycle,
      numCycles,
      // sBTC-denominated, distinct from the native-STX `asset`/`amount` above.
      rewardAsset: "sbtc",
      amountRewarded: earnedRewards.toString(),
    },
  };

  return { items: [stake] };
}
