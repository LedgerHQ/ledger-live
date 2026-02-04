import type { StakeState } from "@ledgerhq/coin-framework/api/types";

import type { MultiversXDelegation } from "../types";

/**
 * Documentation constant mapping MultiversX delegation states to StakeState.
 *
 * MultiversX does NOT use explicit state strings. State is derived from delegation
 * field values (userActiveStake, userUnBondable, userUndelegatedList).
 *
 * This constant documents the MultiversX-to-StakeState mapping convention used
 * in planning docs and acceptance criteria:
 * - "staked" -> "active"
 * - "unstaking" -> "deactivating"
 * - "withdrawable" -> "inactive"
 *
 * Note: "activating" is not used for MultiversX as staking is immediate.
 */
export const DELEGATION_STATE_MAP: Record<string, StakeState> = {
  staked: "active",
  unstaking: "deactivating",
  withdrawable: "inactive",
} as const;

/**
 * Determines the StakeState for a MultiversX delegation based on field analysis.
 *
 * MultiversX uses field-based state determination, not explicit state strings.
 * State is derived by analyzing:
 * - userActiveStake: Currently staked amount earning rewards
 * - userUnBondable: Amount ready to withdraw (unbonding complete)
 * - userUndelegatedList: Pending undelegations with seconds remaining
 *
 * State precedence (most actionable first):
 * 1. "deactivating": Has pending undelegations (seconds > 0 with amount > 0)
 * 2. "inactive": Has withdrawable amounts OR no active stake
 * 3. "active": Has active stake earning rewards
 *
 * @param delegation - Raw delegation data from MultiversX API
 * @returns StakeState: "active", "deactivating", or "inactive"
 */
export function mapDelegationState(delegation: MultiversXDelegation): StakeState {
  const hasActiveStake = BigInt(delegation.userActiveStake || "0") > 0n;
  const hasUnbondable = BigInt(delegation.userUnBondable || "0") > 0n;

  // Check for pending undelegations (seconds > 0 means still waiting)
  // Only consider undelegations with actual amounts
  const hasPendingUndelegations = delegation.userUndelegatedList.some(
    u => u.seconds > 0 && BigInt(u.amount) > 0n,
  );

  // Check for completed undelegations (seconds === 0 means ready to withdraw)
  // Only consider undelegations with actual amounts
  const hasCompletedUndelegations = delegation.userUndelegatedList.some(
    u => u.seconds === 0 && BigInt(u.amount) > 0n,
  );

  // Priority 1: Deactivating takes precedence
  // Has pending undelegations that are still waiting
  if (hasPendingUndelegations) {
    return "deactivating";
  }

  // Priority 2: Inactive
  // Has withdrawable amounts (unbondable or completed undelegations)
  if (hasUnbondable || hasCompletedUndelegations) {
    return "inactive";
  }

  // Priority 3: Active
  // Has stake earning rewards
  if (hasActiveStake) {
    return "active";
  }

  // Default: No active stake, no pending actions = inactive
  return "inactive";
}
