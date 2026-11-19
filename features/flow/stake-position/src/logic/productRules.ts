import type {
  StakePositionChainNotice,
  StakePositionExitAction,
  StakePositionNotice,
  StakePositionSnapshot,
  StakePositionState,
} from "../types";

// The choices the product has not confirmed yet. Each one is a single line here, and the README
// lists them.

/** The one exit each chain state offers, once the account holds the authority it needs. */
export const EXIT_ACTION_BY_STATE = {
  active: "deactivate",
  activating: "deactivate",
  deactivating: null,
  inactive: "withdraw",
} as const satisfies Record<StakePositionState, StakePositionExitAction | null>;

/** The chain states whose details offer Earn more. */
export const EARN_MORE_STATES: ReadonlySet<StakePositionState> = new Set(["active", "activating"]);

/** The displayed statuses whose details show the Current APY row, when the APY is known. */
export const APY_ROW_STATES: ReadonlySet<StakePositionState> = new Set([
  "active",
  "activating",
  "deactivating",
  "inactive",
]);

/** The web details show the Initial deposit row when the backend sends the amount. */
export const SHOWS_INITIAL_DEPOSIT = true;

/** The snapshot amount the confirmation names for each exit. */
export const CONFIRM_AMOUNT = {
  deactivate: "amount",
  withdraw: "withdrawableAmount",
} as const satisfies Record<
  StakePositionExitAction,
  keyof Pick<StakePositionSnapshot, "amount" | "withdrawableAmount">
>;

/** A backend status this version does not know cannot be shown. */
export const UNKNOWN_STATUS_READS_AS: "notFound" | "error" = "notFound";

/** A stale backend snapshot shows the updating notice. */
export const STALE_SHOWS_UPDATING = true;

/** The exit waits while the backend has not shown the user's own transaction yet. */
export const EXIT_WAITS_FOR_POLLING = true;

/**
 * One notice at a time: the wait for the user's own transaction first, then why the chain offers
 * no exit, then details that may be out of date.
 */
export function selectNotice({
  isPolling,
  chainNotice,
  isOutOfDate,
}: Readonly<{
  isPolling: boolean;
  chainNotice: StakePositionChainNotice | null;
  isOutOfDate: boolean;
}>): StakePositionNotice | null {
  if (isPolling) return "updating";
  if (chainNotice !== null) return chainNotice;
  return isOutOfDate ? "updating" : null;
}
