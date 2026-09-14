import type BigNumber from "bignumber.js";
import type { AleoStakingPosition } from "./react";

export type AleoUnbondingDisplayState = {
  isClaimable: boolean;
  isCountingDown: boolean;
  isSettling: boolean;
  blocksLeft: number | null;
};

/** The only rule for whether a position's unbonding entry can be claimed. */
export function isPositionClaimable(position: AleoStakingPosition): boolean {
  return position.claimableBalance.gt(0);
}

/**
 * `syncedHeight` is `account.blockHeight` and decides claimability, because the bridge
 * validates the claim against the same height; `currentHeight` is the live poll and only
 * drives the countdown the user reads.
 */
export function getUnbondingDisplayState({
  position,
  syncedHeight,
  currentHeight,
}: {
  position: AleoStakingPosition;
  syncedHeight: number;
  currentHeight: number;
}): AleoUnbondingDisplayState {
  const { unbondingHeight } = position;

  const isClaimable = isPositionClaimable(position);
  const isCountingDown = !isClaimable && unbondingHeight !== null && unbondingHeight > syncedHeight;
  const blocksLeft = unbondingHeight !== null ? Math.max(0, unbondingHeight - currentHeight) : null;
  const isSettling = !isClaimable && blocksLeft === 0;

  return { isClaimable, isCountingDown, isSettling, blocksLeft };
}

/**
 * The part of the unbonding entry still locked, which is what the "Unstaking" figure means
 * next to a separate "Claimable" one — `claimableBalance` is the whole entry or nothing, so
 * the two never overlap and never sum to more than `unbondingBalance`.
 */
export function getUnstakingBalance(position: AleoStakingPosition): BigNumber {
  return position.unbondingBalance.minus(position.claimableBalance);
}
