import { readHistory } from "./history";
import type { AccountOperation, HistoryStore } from "./types";

/** Age after which an optimistic operation never seen on the network is dropped: 2 hours. */
export const DEFAULT_OPTIMISTIC_EXPIRY_MS = 2 * 60 * 60 * 1000;

/**
 * Removes the optimistic operations a sync settled: their transaction is now synced, they are
 * older than `expiryMs`, or `isSettled` says so (replaced, double spent).
 */
export async function settleOptimisticOperations(
  history: HistoryStore,
  {
    now = Date.now(),
    expiryMs = DEFAULT_OPTIMISTIC_EXPIRY_MS,
    isSettled,
  }: {
    now?: number;
    expiryMs?: number;
    isSettled?: (optimistic: AccountOperation, synced: AccountOperation[]) => boolean;
  } = {},
): Promise<void> {
  const operations = await readHistory(history);
  const optimistic = operations.filter(op => op.optimistic);
  if (optimistic.length === 0) return;
  const synced = operations.filter(op => !op.optimistic);
  const syncedHashes = new Set(synced.map(op => op.hash));
  const settled = optimistic.filter(
    op =>
      syncedHashes.has(op.hash) ||
      now - op.date.getTime() > expiryMs ||
      (isSettled?.(op, synced) ?? false),
  );
  if (settled.length > 0) await history.remove(settled.map(op => op.id));
}
