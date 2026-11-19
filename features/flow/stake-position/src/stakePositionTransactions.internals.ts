import type { EarnPositions } from "@domain/entity-earn-position";
import { findStakePositionRow } from "./logic/stakePositionData";
import type { StakePositionExitAction, StakePositionTransaction } from "./types";

/** How long after a transaction the opens of its position wait for the backend to show it. */
export const TRANSACTED_WINDOW_MS = 10 * 60_000;
/** How often the backend is read while a position waits for its transaction. */
export const POLL_INTERVAL_MS = 3_000;
/** One open stops waiting after this long; a later open within the window waits again. */
export const POLL_TIMEOUT_MS = 60_000;

export type StakePositionKey = Pick<StakePositionTransaction, "ownerAddress" | "positionId">;

export type TransactedPosition = Readonly<{ action: StakePositionExitAction; at: number }>;

// Module-level, so the surface that opens the position after its transaction sees it.
const transactions = new Map<string, TransactedPosition>();
const listeners = new Set<() => void>();

export const positionKeyOf = ({ ownerAddress, positionId }: StakePositionKey) =>
  `${ownerAddress}:${positionId}`;

export const getStakePositionTransaction = (key: string) => transactions.get(key);

export function subscribeToStakePositionTransactions(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function recordStakePositionTransaction(
  { action, ...position }: StakePositionTransaction,
  at: number,
) {
  transactions.set(positionKeyOf(position), { action, at });
  listeners.forEach(listener => listener());
}

export function clearStakePositionTransaction(position: StakePositionKey) {
  if (transactions.delete(positionKeyOf(position))) listeners.forEach(listener => listener());
}

export function isWithinTransactedWindow({ at }: TransactedPosition, now: number): boolean {
  return now - at <= TRANSACTED_WINDOW_MS;
}

/**
 * Whether the backend shows the transaction: a deactivation once the row is deactivating or
 * deactivated, a withdrawal once the row is gone, closed or empty. A row missing behind a provider
 * failure shows nothing yet.
 */
export function showsStakePositionTransaction(
  action: StakePositionExitAction,
  positions: EarnPositions,
  positionId: string,
): boolean {
  const row = findStakePositionRow(positions, positionId);
  if (row.kind === "duplicate") return false;
  if (action === "deactivate") {
    return (
      row.kind === "one" &&
      (row.position.status === "deactivating" || row.position.status === "deactivated")
    );
  }
  if (row.kind === "none") return positions.failures.length === 0;
  const { status, balance } = row.position;
  return status === "archived" || (balance !== undefined && BigInt(balance) === 0n);
}
