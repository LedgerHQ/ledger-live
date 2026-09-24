import type { StacksAccount, StakingPosition } from "./types";

// Re-exported so LLD can resolve pox info through live-common rather than depending directly on
// @ledgerhq/coin-stacks, which it does not declare as a dependency.
export { fetchPoxInfo } from "@ledgerhq/coin-stacks/network/pox";

/** pox-5 exposes at most one active `Stake` per address; `stakingPositions[0]` is always the one of interest. */
export function getStacksStakingPosition(account: StacksAccount): StakingPosition | undefined {
  return account.stakingPositions?.[0];
}

type StacksStakeDetails = {
  firstRewardCycle: number;
  numCycles: number;
  rewardAsset: string;
  amountRewarded: string;
};

export function getStacksUnlockCycle(position: StakingPosition): number {
  const details = position.details as StacksStakeDetails;
  return details.firstRewardCycle + details.numCycles;
}
