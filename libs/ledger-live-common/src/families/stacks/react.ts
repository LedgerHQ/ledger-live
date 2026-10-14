import type { StacksAccount, StacksStakeDetails, StakingPosition } from "./types";

// Re-exported for the existing live-common consumers (LLD's StakeFlowModal and LLM's staking flow
// resolve pox info through here). Both apps now also depend on @ledgerhq/coin-stacks directly, and
// new coin-stacks helpers are imported from there rather than added to live-common.
export { fetchPoxInfo } from "@ledgerhq/coin-stacks/network/pox";
// Same c32-checksum decoder getTransactionStatus.ts uses for the send recipient -- reused here so a
// pool address is validated the same way, rather than a hand-rolled shape check that can diverge.
// Imported from the concrete file (not the "./common-logic" directory): coin-stacks's wildcard
// package export is a plain string substitution to "./src/*.ts", it doesn't resolve a directory's
// index.ts.
export { validateAddress as validateStacksAddress } from "@ledgerhq/coin-stacks/common-logic/addresses";

/** pox-5 exposes at most one active `Stake` per address; `stakingPositions[0]` is always the one of interest. */
export function getStacksStakingPosition(account: StacksAccount): StakingPosition | undefined {
  return account.stakingPositions?.[0];
}

function isStacksStakeDetails(details: unknown): details is StacksStakeDetails {
  if (typeof details !== "object" || details === null) return false;
  const { firstRewardCycle, numCycles } = details as Record<string, unknown>;
  return typeof firstRewardCycle === "number" && typeof numCycles === "number";
}

/** `undefined` when `details` doesn't carry the pox-5 cycle fields `getStakes` writes. */
export function getStacksUnlockCycle(position: StakingPosition): number | undefined {
  const { details } = position;
  if (!isStacksStakeDetails(details)) return undefined;
  return details.firstRewardCycle + details.numCycles;
}
