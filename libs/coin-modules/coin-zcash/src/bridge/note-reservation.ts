/**
 * Session-scoped, in-memory reservation store for shielded note nullifiers.
 *
 * After a shielded send is built and signed, the selected notes are reserved
 * here so that a concurrent or immediately-following send cannot select the
 * same notes. The store is reconciled against on-chain reality on every
 * shielded sync pass via reconcileReservations.
 *
 * Scope: single-user desktop/mobile session. The store is module-level and
 * therefore shared for the lifetime of the process. It is not persisted across
 * restarts — on the next startup, sync will re-establish isSpent: true for any
 * confirmed notes, which is the durable exclusion mechanism.
 *
 * The transparent analog is inputRefs written into operation.extra; the
 * reservation store provides the same intra-session dedup for shielded spends.
 *
 * Risk note: a complete sync (remainingBlocks === 0) triggered immediately after
 * signOperation but before broadcast confirmation clears the reservation
 * prematurely. The mempool TTL and node-side nullifier rejection provide a safety
 * net; this store is an intra-session dedup helper, not the sole double-spend guard.
 */

const _reserved = new Map<string, Set<string>>();

/**
 * Adds nullifiers to the reservation set for the given account.
 * A second call for the same account unions with the existing set (no overwrite).
 */
export function reserveNotes(accountId: string, nullifiers: ReadonlyArray<string>): void {
  if (nullifiers.length === 0) return;
  let set = _reserved.get(accountId);
  if (!set) {
    set = new Set<string>();
    _reserved.set(accountId, set);
  }
  for (const nf of nullifiers) {
    set.add(nf);
  }
}

/**
 * Reconciles the reservation store against on-chain reality.
 *
 * - Removes each confirmedSpentNullifier from the account's reservation set
 *   (these notes are already excluded by isSpent: true after sync; removing
 *   them avoids growing the set unboundedly).
 * - When syncComplete is true, clears ALL remaining reservations for the account.
 *   Any nullifier still reserved at chain tip was never confirmed on-chain — the
 *   spend either was not broadcast or was rejected. Clearing releases those notes
 *   for future selection (fail-closed principle).
 *
 * A no-op when the account has no reservations.
 */
export function reconcileReservations(
  accountId: string,
  confirmedSpentNullifiers: string[],
  syncComplete: boolean,
): void {
  const set = _reserved.get(accountId);
  if (!set) return;

  for (const nf of confirmedSpentNullifiers) {
    set.delete(nf);
  }

  if (syncComplete) {
    set.clear();
    _reserved.delete(accountId);
  } else if (set.size === 0) {
    _reserved.delete(accountId);
  }
}

/**
 * Returns the current reservation set for the given account (read-only).
 * Returns an empty set when nothing is reserved.
 */
export function getReservedNullifiers(accountId: string): ReadonlySet<string> {
  return _reserved.get(accountId) ?? new Set<string>();
}

/**
 * Resets all reservation state. Intended for test isolation only.
 * @internal
 */
export function _resetReservationsForTest(): void {
  _reserved.clear();
}
