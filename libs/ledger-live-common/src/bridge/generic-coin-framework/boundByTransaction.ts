/**
 * Cuts a newest-first operation list at a transaction boundary, never inside one.
 *
 * One transaction hash can produce several rows — two top-level rows for a self-send, several
 * token rows for a swap or a batch — and a flat `slice(0, max)` can keep some of a transaction's
 * rows while dropping its siblings. The account then shows half a transaction, and the sibling is
 * lost for good: the next sync's watermark derives from the newest *retained* operation, so it
 * never goes back below the cut to refetch it.
 *
 * Two properties this has to hold at once:
 *
 * - **The result stays a prefix**, extended with the scattered siblings of the transactions that
 *   prefix contains. Keeping a whole group is not enough on its own: admitting an older group
 *   while dropping a newer one would leave a hole *above* the oldest retained operation, which is
 *   worse than a short history — a truncation from the tail is refetched by no one, but it is at
 *   least contiguous.
 * - **Siblings are found by hash, not by adjacency.** `mergeOps` orders newest-first and nothing
 *   more; every operation in one block carries that block's date, so rows of two transactions in
 *   the same block can interleave. Walking neighbours would miss the sibling sitting one row past
 *   another transaction's.
 *
 * The bound is therefore a floor rather than a ceiling: the returned list can exceed
 * `maxOperations` by the tail of the transactions crossing it. That is the same rule
 * `paginateOperations` applies a level up when it returns the entire page that reached the bound.
 *
 * An operation with a falsy hash is its own group — grouping those together would make one giant
 * group and retain everything, the opposite of what this is for.
 */
export function boundByTransaction<T extends { hash: string }>(
  operations: T[],
  maxOperations?: number,
): T[] {
  if (maxOperations === undefined || operations.length <= maxOperations) return operations;

  const keptHashes = new Set<string>();
  for (let i = 0; i < maxOperations; i++) {
    const { hash } = operations[i];
    if (hash) keptHashes.add(hash);
  }

  return operations.filter((op, index) => index < maxOperations || keptHashes.has(op.hash));
}
