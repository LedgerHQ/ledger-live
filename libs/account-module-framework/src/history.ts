import type { Cursor, Page } from "@ledgerhq/coin-module-framework/api/types";
import type { AccountOperation, HistoryStore } from "./types";

/** Newest first; pending operations (no block) before confirmed ones of the same date. */
export function compareNewestFirst(a: AccountOperation, b: AccountOperation): number {
  const byDate = b.date.getTime() - a.date.getTime();
  if (byDate !== 0) return byDate;
  const height = (op: AccountOperation) => op.block?.height ?? Number.MAX_SAFE_INTEGER;
  const byHeight = height(b) - height(a);
  return byHeight === 0 ? a.id.localeCompare(b.id) : byHeight;
}

/** A page of `items` from an offset cursor. */
export function paginate<T>(
  items: T[],
  options: { cursor?: Cursor; limit?: number } = {},
): Page<T> {
  const start = options.cursor ? Number.parseInt(options.cursor, 10) : 0;
  if (!Number.isInteger(start) || start < 0) throw new Error(`Invalid cursor ${options.cursor}`);
  const end = options.limit === undefined ? items.length : start + options.limit;
  const page = items.slice(start, end);
  return end < items.length ? { items: page, next: String(end) } : { items: page };
}

/** Every operation of a store, newest first, walking its pages. */
export async function readHistory(store: HistoryStore): Promise<AccountOperation[]> {
  const operations: AccountOperation[] = [];
  let cursor: Cursor | undefined;
  do {
    const page = await store.list(cursor ? { cursor } : {});
    operations.push(...page.items);
    cursor = page.next && page.next !== cursor ? page.next : undefined;
  } while (cursor);
  return operations;
}

export type MemoryHistoryStore = HistoryStore & {
  /** Synchronous snapshot, newest first. */
  snapshot: () => AccountOperation[];
};

/** A history kept in memory: for tests, and for clients that persist the snapshot themselves. */
export function createMemoryHistoryStore(initial: AccountOperation[] = []): MemoryHistoryStore {
  const byId = new Map(initial.map(op => [op.id, op]));
  const snapshot = () => [...byId.values()].sort(compareNewestFirst);
  return {
    snapshot,
    upsert: async operations => {
      for (const op of operations) byId.set(op.id, op);
    },
    remove: async ids => {
      for (const id of ids) byId.delete(id);
    },
    list: async options => paginate(snapshot(), options),
  };
}
