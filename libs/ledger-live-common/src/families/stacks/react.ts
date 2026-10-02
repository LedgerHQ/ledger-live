import type { StacksAccount, StacksStakeDetails, StakingPosition } from "./types";

// Re-exported so LLD can resolve pox info / validate an address through live-common rather than
// depending directly on @ledgerhq/coin-stacks, which it does not declare as a dependency.
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
