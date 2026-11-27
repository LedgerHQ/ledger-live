import type { EarnPositionStatus } from "@domain/entity-earn-position";
import type {
  StakePositionChainExit,
  StakePositionChainNotice,
  StakePositionExitAction,
  StakePositionSnapshot,
  StakePositionState,
} from "../types";
import { CONFIRM_AMOUNT, EXIT_ACTION_BY_STATE } from "./productRules";

/** Older account data is synced before the exit action can be used. */
export const STAKE_POSITION_MAX_DATA_AGE_MS = 60_000;

/**
 * How long a surface waits for the sync it asked for on open. The bridge drops a queued sync when
 * another one of the same priority is scheduled: past this wait, the surface stops waiting for it
 * rather than block the position for good.
 */
export const STAKE_POSITION_SYNC_WAIT_MS = 20_000;

const DISPLAYED_STATE = {
  activated: "active",
  activating: "activating",
  deactivating: "deactivating",
  deactivated: "inactive",
  archived: null,
  unknown: null,
} as const satisfies Record<EarnPositionStatus, StakePositionState | null>;

/** The backend status as the details show it. A closed or unknown position has none. */
export function toDisplayedState(status: EarnPositionStatus): StakePositionState | null {
  return DISPLAYED_STATE[status];
}

/** Whether the backend status says what the chain says. */
export function isStatusConsistent(
  status: EarnPositionStatus,
  chainState: StakePositionState,
): boolean {
  return toDisplayedState(status) === chainState;
}

/** The one exit the position offers: never an activation, gated by its state and authority. */
export function getExitAction({
  state,
  canStake,
  canWithdraw,
  withdrawableAmount,
}: StakePositionSnapshot): StakePositionExitAction | null {
  const action = EXIT_ACTION_BY_STATE[state];
  if (action === "deactivate") return canStake ? action : null;
  if (action === "withdraw") return canWithdraw && withdrawableAmount > 0n ? action : null;
  return null;
}

/**
 * The figure the confirmation names, from the same chain snapshot as the prepared transaction. An
 * undelegation signs only the stake account and a withdrawal includes the rent reserve, so it can
 * differ from the backend balance the details show.
 */
export function getExitAmount(
  snapshot: StakePositionSnapshot,
  action: StakePositionExitAction,
): bigint {
  return snapshot[CONFIRM_AMOUNT[action]];
}

/**
 * Says why the position offers no exit, so the view never reaches a dead end. The host also clears
 * `canWithdraw` while a lockup is in force, so the authority notice names both causes.
 */
export function getPositionNotice({
  state,
  canStake,
  canWithdraw,
}: StakePositionSnapshot): StakePositionChainNotice | null {
  if (state === "deactivating") return "deactivating";
  const action = EXIT_ACTION_BY_STATE[state];
  const isControlledElsewhere =
    (action === "deactivate" && !canStake) || (action === "withdraw" && !canWithdraw);
  return isControlledElsewhere ? "missingAuthority" : null;
}

/** The exit of the details, from the chain only. */
export function toChainExit(
  snapshot: StakePositionSnapshot,
  isPending: boolean,
): StakePositionChainExit {
  return {
    state: snapshot.state,
    action: getExitAction(snapshot),
    notice: getPositionNotice(snapshot),
    isPending,
  };
}

export function isPositionDataStale(lastSyncTime: number, now: number): boolean {
  return now - lastSyncTime > STAKE_POSITION_MAX_DATA_AGE_MS;
}
