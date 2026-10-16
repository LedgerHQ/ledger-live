import type { AccountRead, ReadOptions } from "./types";

/** A scope of the account: the part of its state and history one refresh brings up to date. */
export type ReadScope<T> = {
  /** Network calls; writes the refreshed scope to the account's stores. */
  refresh: () => Promise<void>;
  /** The stored value, without network call, and the epoch-ms time of the scope's last refresh. */
  read: () => Promise<{ value: T; updatedAt: number }>;
};

/**
 * Answers a read: with `refresh`, refreshes the scope, then answers the stored value, fresh (no
 * `updatedAt`); otherwise answers the stored value with the time of the scope's last refresh.
 */
export async function readScope<T>(
  options: ReadOptions | undefined,
  scope: ReadScope<T>,
): Promise<AccountRead<T>> {
  if (!options?.refresh) return scope.read();
  await scope.refresh();
  const { value } = await scope.read();
  return { value };
}

/** Runs an async iterable to its end: a sync whose events the caller does not need. */
export async function drain(events: AsyncIterable<unknown>): Promise<void> {
  const iterator = events[Symbol.asyncIterator]();
  while (!(await iterator.next()).done);
}
