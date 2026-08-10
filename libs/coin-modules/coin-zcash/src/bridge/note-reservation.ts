import { getEnv } from "@ledgerhq/live-env";
import type { Operation } from "@ledgerhq/types-live";
import type { ZcashOperationExtra } from "../types/bridge";

/**
 * Reservation store for shielded note nullifiers: an in-memory part scoped to
 * the session, and a persisted part read back off the account's pending
 * operations.
 *
 * After a shielded send is built and signed, the notes it spends are reserved
 * under the hash of the operation spending them, so that a concurrent or
 * immediately-following send cannot select the same notes. Selection filters the
 * account's reserved nullifiers out of the spendable pool (prepareTransaction,
 * estimateMaxSpendable).
 *
 * A reservation is released only on evidence about its own operation:
 *
 * - the scan reports its notes spent on-chain — `releaseConfirmedNullifiers`,
 *   from the shielded sync reducer;
 * - its operation has a confirmed counterpart in `account.operations`, the same
 *   signal `reconcileConfirmedPendingOperations` retires the optimistic
 *   operation on — `releaseRetiredReservations`, from `postSync`;
 * - it outlived OPERATION_OPTIMISTIC_RETENTION, measured from signing time just
 *   as `shouldRetainPendingOperation` measures the optimistic operation's own
 *   date: a broadcast that never confirmed stops holding notes at the moment
 *   Ledger Wallet itself stops believing in the operation — same function;
 * - broadcast failed, so nothing can confirm — `releaseReservation`, from the
 *   bridge's `broadcast`.
 *
 * A sync reaching the chain tip is deliberately not one of them: catching up to
 * the tip a run started from is the outcome of nearly every poll of an account
 * that is not backlogged, and says nothing about a spend in flight, which needs
 * a block (~75s) at the very least to confirm.
 *
 * Scope: single-user desktop/mobile session. The store is module-level and
 * therefore shared for the lifetime of the process. It does not survive a
 * restart, and does not need to: `signOperation` also records the nullifiers on
 * the optimistic operation it produces, and that operation is persisted, so
 * `getReservedNullifiers` reads a still-in-flight spend back from
 * `account.pendingOperations` on the next startup. Notes of a spend that did
 * confirm are excluded by isSpent: true from then on.
 *
 * The transparent analog is inputRefs written into operation.extra; shielded
 * spends record shieldedNullifiers the same way. What this store adds is the
 * precision the persisted list cannot have on its own: notes are committed from
 * signing, while a pending operation exists only from broadcast onwards.
 */

type Reservation = {
  nullifiers: Set<string>;
  /** Signing time — the date the optimistic operation carries too. */
  reservedAt: number;
};

/** accountId → operation hash → the notes that operation spends. */
const _reserved = new Map<string, Map<string, Reservation>>();

function pruneAccount(accountId: string, byOperation: Map<string, Reservation>): void {
  if (byOperation.size === 0) _reserved.delete(accountId);
}

/**
 * Reserves the notes an operation spends, keyed by the operation's hash.
 * A second call for the same operation unions with what it already holds.
 */
export function reserveNotes(
  accountId: string,
  operationHash: string,
  nullifiers: ReadonlyArray<string>,
): void {
  if (nullifiers.length === 0) return;
  let byOperation = _reserved.get(accountId);
  if (!byOperation) {
    byOperation = new Map<string, Reservation>();
    _reserved.set(accountId, byOperation);
  }
  const existing = byOperation.get(operationHash);
  if (existing) {
    for (const nf of nullifiers) {
      existing.nullifiers.add(nf);
    }
    return;
  }
  byOperation.set(operationHash, { nullifiers: new Set(nullifiers), reservedAt: Date.now() });
}

/**
 * Drops nullifiers the scan reported spent on-chain from every reservation of
 * the account. Those notes are excluded by isSpent: true from here on, so
 * holding them reserved would only grow the store.
 */
export function releaseConfirmedNullifiers(
  accountId: string,
  confirmedSpentNullifiers: ReadonlyArray<string>,
): void {
  if (confirmedSpentNullifiers.length === 0) return;
  const byOperation = _reserved.get(accountId);
  if (!byOperation) return;

  for (const [operationHash, reservation] of byOperation) {
    for (const nf of confirmedSpentNullifiers) {
      reservation.nullifiers.delete(nf);
    }
    if (reservation.nullifiers.size === 0) byOperation.delete(operationHash);
  }
  pruneAccount(accountId, byOperation);
}

/**
 * Releases the reservations whose operation the account has done with: it now
 * has a confirmed counterpart, or it has aged past the window Ledger Wallet
 * keeps an unconfirmed optimistic operation for.
 *
 * Absence from the pending list is not the test used here. An operation is
 * pending only from broadcast onwards, while its notes are reserved from
 * signing, and a scan of a fresh account carries no pending operation at all —
 * either would read as "done with" a spend that has not even been sent yet.
 */
export function releaseRetiredReservations(
  accountId: string,
  confirmedOperationHashes: ReadonlySet<string>,
  now: number = Date.now(),
): void {
  const byOperation = _reserved.get(accountId);
  if (!byOperation) return;

  const retention = getEnv("OPERATION_OPTIMISTIC_RETENTION");
  for (const [operationHash, reservation] of byOperation) {
    const confirmed = confirmedOperationHashes.has(operationHash);
    const expired = now - reservation.reservedAt >= retention;
    if (confirmed || expired) byOperation.delete(operationHash);
  }
  pruneAccount(accountId, byOperation);
}

/**
 * Releases a single operation's reservation, for a spend that cannot reach the
 * chain any more — a failed broadcast.
 */
export function releaseReservation(accountId: string, operationHash: string): void {
  const byOperation = _reserved.get(accountId);
  if (!byOperation) return;
  byOperation.delete(operationHash);
  pruneAccount(accountId, byOperation);
}

/**
 * Returns the nullifiers this session holds for the account, across every
 * operation reserved in it. Empty when nothing is reserved.
 *
 * Covers the running process only. Callers deciding what a new spend may select
 * want `getReservedNullifiers`, which also accounts for a spend in flight from
 * a previous session.
 */
export function getSessionReservedNullifiers(accountId: string): ReadonlySet<string> {
  const byOperation = _reserved.get(accountId);
  if (!byOperation) return new Set<string>();
  const reserved = new Set<string>();
  for (const reservation of byOperation.values()) {
    for (const nf of reservation.nullifiers) {
      reserved.add(nf);
    }
  }
  return reserved;
}

/** Only `extra` is read off a pending operation. */
type ReservingAccount = {
  id: string;
  pendingOperations?: ReadonlyArray<Pick<Operation, "extra">>;
};

/**
 * The nullifiers the account's pending operations still hold.
 *
 * `extra` is persisted verbatim and typed `unknown` on the way back in, hence
 * the narrowing — the same shape coin-bitcoin's `isBtcOperationExtra` guards.
 */
function pendingReservedNullifiers(
  pendingOperations: ReadonlyArray<Pick<Operation, "extra">>,
): string[] {
  return pendingOperations.flatMap(({ extra }) => {
    if (extra === null || typeof extra !== "object") return [];
    const nullifiers = (extra as ZcashOperationExtra).shieldedNullifiers;
    if (!Array.isArray(nullifiers)) return [];
    return nullifiers.filter(nf => typeof nf === "string");
  });
}

/**
 * The nullifiers unavailable to a new spend: what this session reserved, plus
 * what the account's pending operations hold.
 *
 * Nothing releases the pending-operation half, because the operation carrying it
 * is what expires. It leaves `pendingOperations` once a confirmed counterpart
 * retires it — its notes read isSpent: true from then on — or once it ages past
 * OPERATION_OPTIMISTIC_RETENTION, the window `releaseRetiredReservations`
 * measures too. A broadcast that failed never became a pending operation.
 */
export function getReservedNullifiers(account: ReservingAccount): ReadonlySet<string> {
  const reserved = new Set(pendingReservedNullifiers(account.pendingOperations ?? []));
  for (const nf of getSessionReservedNullifiers(account.id)) {
    reserved.add(nf);
  }
  return reserved;
}

/**
 * Resets all reservation state. Intended for test isolation only.
 * @internal
 */
export function _resetReservationsForTest(): void {
  _reserved.clear();
}
