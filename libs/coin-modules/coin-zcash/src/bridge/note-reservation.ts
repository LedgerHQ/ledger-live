import { getEnv } from "@ledgerhq/live-env";

/**
 * Session-scoped, in-memory reservation store for shielded note nullifiers.
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
 * therefore shared for the lifetime of the process. It is not persisted across
 * restarts — on the next startup, sync will re-establish isSpent: true for any
 * confirmed notes, which is the durable exclusion mechanism.
 *
 * The transparent analog is inputRefs written into operation.extra; the
 * reservation store provides the same intra-session dedup for shielded spends.
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
 * Returns the nullifiers reserved across the account's in-flight operations
 * (read-only). Returns an empty set when nothing is reserved.
 */
export function getReservedNullifiers(accountId: string): ReadonlySet<string> {
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

/**
 * Resets all reservation state. Intended for test isolation only.
 * @internal
 */
export function _resetReservationsForTest(): void {
  _reserved.clear();
}
