import type { AccountOperation } from "@domain/entity-account-operations";
import { NoAccountSourceError } from "./errors";
import { pickSource, type AccountRef, type AccountSource } from "./source";

/** How far back to read, and from where. */
export type AccountOperationsQuery = {
  /**
   * Where to resume. Absent means "the head" — the newest operations.
   *
   * Opaque to this layer, and non-volatile by the coin-module contract: a cursor stays valid long
   * after the request that produced it, so a stored one survives a reload.
   */
  cursor?: string;
  /** Soft limit. A source may return fewer or more; it must not be treated as a page size. */
  limit?: number;
};

/**
 * One page of history.
 *
 * `complete` and `nextCursor` say different things and both are needed: a source that cannot
 * paginate at all returns the whole history with no cursor and `complete: true`, while a paginated
 * source that has reached the end returns no cursor and `complete: true` too — but a source that
 * simply does not know whether more exists returns no cursor and `complete: false`, and the UI must
 * not claim the list is exhaustive.
 */
export type AccountOperationsPage = {
  operations: AccountOperation[];
  nextCursor?: string;
  complete: boolean;
  /**
   * Total operations the account has, when the source can say.
   *
   * A full sync holds the whole history and therefore knows it. A paginated read does not, and must
   * leave this `undefined` rather than report the page size.
   */
  total?: number;
};

/**
 * One way of reading an account's operation history.
 *
 * The second datum, and the first that is *unbounded*. Everything about the shape below that differs
 * from {@link AccountBalanceSource} is a consequence of that one fact.
 */
export type AccountOperationsSource = AccountSource & {
  /**
   * Whether this source can resume from a cursor.
   *
   * `false` means it only ever answers with the entire history — which is what a legacy full sync
   * does, since `bridge.sync()` has no notion of a page. Selection still prefers the cheaper source,
   * but a caller asking for "the next page" has to know that on this source there is no such thing.
   */
  readonly paginated: boolean;
  getOperations(
    ref: AccountRef,
    query: AccountOperationsQuery,
    signal?: AbortSignal,
  ): Promise<AccountOperationsPage>;
};

/**
 * Read one page of an account's history through the best available source.
 *
 * A plain function for the same reason as `readAccountBalances`: wallet-cli calls it with no Redux
 * around it.
 *
 * @throws {NoAccountSourceError} when nothing registered supports the ref.
 */
export async function readAccountOperations(
  ref: AccountRef,
  sources: readonly AccountOperationsSource[],
  query: AccountOperationsQuery = {},
  signal?: AbortSignal,
): Promise<AccountOperationsPage & { sourceId: string }> {
  const source = pickSource(ref, sources);
  if (!source) throw new NoAccountSourceError(ref.accountId, "operations");
  // A cursor belongs to the source that issued it. Handing it to a different one — a source list
  // that changed between two reads, a fallback taking over after a failure — would at best be
  // rejected and at worst silently resume somewhere else in the history.
  const resumable = source.paginated ? query : { ...query, cursor: undefined };
  return { ...(await source.getOperations(ref, resumable, signal)), sourceId: source.id };
}
