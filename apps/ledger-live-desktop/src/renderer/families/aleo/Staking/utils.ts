import type { AleoStakingPositionView } from "@ledgerhq/live-common/families/aleo/react";
import type { AleoUnbondingDisplayState } from "@ledgerhq/live-common/families/aleo/types";

export type AleoUnbondingStatus =
  | "claimPending"
  | "unbondPending"
  | "claimable"
  | "settling"
  | "countingDown";

/**
 * The one place the unbonding row's state is decided, so the status column and the completion
 * column cannot disagree about it.
 *
 * A pending operation comes first: both `unbond_public` and its claim rewrite the same single
 * `unbonding` slot, which the balances still describe as it was before the broadcast — so the
 * claim is unavailable regardless of what those balances say is claimable.
 */
export const getUnbondingStatus = ({
  pendingKind,
  isClaimable,
  isSettling,
}: Pick<AleoStakingPositionView, "pendingKind"> &
  Pick<AleoUnbondingDisplayState, "isClaimable" | "isSettling">): AleoUnbondingStatus => {
  if (pendingKind === "claim") return "claimPending";
  if (pendingKind === "unbond") return "unbondPending";
  if (isClaimable) return "claimable";
  if (isSettling) return "settling";
  return "countingDown";
};
