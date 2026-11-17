import type {
  StakePositionExitAction,
  StakePositionNotice,
  StakePositionSnapshot,
  StakePositionState,
} from "../types";

/** Older account data is synced before the exit action can be used. */
export const STAKE_POSITION_MAX_DATA_AGE_MS = 60_000;

const isEarning = (state: StakePositionState) => state === "active" || state === "activating";

/** The one exit the position offers: never an activation, gated by its state. */
export function getExitAction({
  state,
  canStake,
  canWithdraw,
  withdrawableAmount,
}: StakePositionSnapshot): StakePositionExitAction | null {
  if (isEarning(state) && canStake) return "deactivate";
  if (state === "inactive" && canWithdraw && withdrawableAmount > 0n) return "withdraw";
  return null;
}

export function getDisplayedAmount({ amount, withdrawableAmount }: StakePositionSnapshot): bigint {
  return amount > 0n ? amount : withdrawableAmount;
}

export function getExitAmount(
  { amount, withdrawableAmount }: StakePositionSnapshot,
  action: StakePositionExitAction,
): bigint {
  return action === "deactivate" ? amount : withdrawableAmount;
}

/**
 * Says why the position offers no exit, so the view never reaches a dead end. The host also clears
 * `canWithdraw` while a lockup is in force, so the authority notice names both causes.
 */
export function getPositionNotice({
  state,
  canStake,
  canWithdraw,
}: StakePositionSnapshot): StakePositionNotice | null {
  if (state === "deactivating") return "deactivating";
  const isControlledElsewhere =
    (isEarning(state) && !canStake) || (state === "inactive" && !canWithdraw);
  return isControlledElsewhere ? "missingAuthority" : null;
}

export function isPositionDataStale(lastSyncTime: number, now: number): boolean {
  return now - lastSyncTime > STAKE_POSITION_MAX_DATA_AGE_MS;
}
