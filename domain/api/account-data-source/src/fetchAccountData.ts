import { accountRefKey, type AccountRef } from "@domain/entity-account";
import type {
  AccountDataAction,
  AccountDataBinding,
  AccountDataQuery,
  AccountDataQueryValue,
  AccountDatum,
} from "@domain/entity-account-data";
import type { AccountDataRouter } from "./router";

export const DEFAULT_ACCOUNT_DATA_MAX_AGE = 30_000;

/** This package's slice of the thunk `extraArgument`. */
export type AccountDataExtra = { accountData: AccountDataRouter };

export function getAccountDataRouter(extra: unknown): AccountDataRouter {
  const router = (extra as Partial<AccountDataExtra> | undefined)?.accountData;
  if (!router) throw new Error("No account data router in the thunk extraArgument (`accountData`)");
  return router;
}

export type FetchAccountDataOptions<K extends AccountDatum> = {
  /** A head read younger than this is not repeated. `0` always reads. */
  maxAge?: number;
  query?: AccountDataQuery<K>;
  /** Read the next page instead of the head. Only a paginated datum has one. */
  more?: boolean;
  signal?: AbortSignal;
};

type Trackers = {
  // The latest read of each slot (datum + account). A read that is no longer the latest when it
  // completes is dropped: it must neither overwrite a newer result nor clear its pending state.
  latest: Map<string, { token: symbol; identity: string }>;
  // What the data in each slot was last successfully read for.
  lastIdentity: Map<string, string>;
};

// Per store: two stores sharing this module must not drop each other's reads.
const trackersByStore = new WeakMap<object, Trackers>();

function trackersOf(getState: object): Trackers {
  let trackers = trackersByStore.get(getState);
  if (!trackers) {
    trackers = { latest: new Map(), lastIdentity: new Map() };
    trackersByStore.set(getState, trackers);
  }
  return trackers;
}

/** The identity of a query: tagged and key-sorted, so every admitted value keeps its own key. */
export function accountDataQueryKey(query: AccountDataQueryValue): string {
  if (query === undefined) return "undefined";
  if (query === null) return "null";
  if (Array.isArray(query)) return `[${query.map(accountDataQueryKey).join(",")}]`;
  if (typeof query === "object") {
    const entries = Object.entries(query).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${accountDataQueryKey(v)}`).join(",")}}`;
  }
  return JSON.stringify(query);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// A paginated query is usually a record (`limit` + `cursor`): the next page's fields are laid over
// the caller's. Any other shape (a bare cursor, say) is replaced by the next page's.
function withNextPage<K extends AccountDatum>(
  query: AccountDataQuery<K> | undefined,
  next: AccountDataQuery<K>,
): AccountDataQuery<K> {
  return isPlainObject(query) && isPlainObject(next) ? Object.assign({}, query, next) : next;
}

/**
 * Read one datum of one account into its slice, through whichever source the router picks. Head
 * reads are guarded by freshness and by an in-flight read of the same ref and query, and a read that
 * a newer one superseded is dropped; a next page is guarded
 * only by the pending flag, and pinned to the source that answered the head.
 */
export function fetchAccountData<K extends AccountDatum, S>(
  binding: AccountDataBinding<K, S>,
  ref: AccountRef,
  options: FetchAccountDataOptions<K> = {},
) {
  const { maxAge = DEFAULT_ACCOUNT_DATA_MAX_AGE, query, more = false, signal } = options;

  return async (
    dispatch: (action: AccountDataAction) => unknown,
    getState: () => S,
    extra: unknown,
  ): Promise<void> => {
    const state = getState();
    const { latest, lastIdentity } = trackersOf(getState);
    const { accountId } = ref;
    const slot = JSON.stringify([binding.datum, accountId]);
    const identity = JSON.stringify([accountRefKey(ref), accountDataQueryKey(query)]);
    const pending = binding.selectPending(state, accountId);

    let readQuery = query;
    let sourceId: string | undefined;
    if (more) {
      if (pending) return;
      // The stored cursor belongs to the last head read; another ref or query has none, and an
      // unpinned cursor would be routed to any source.
      if (lastIdentity.get(slot) !== identity) return;
      const next = binding.selectNextQuery?.(state, accountId);
      if (next === undefined) return;
      readQuery = withNextPage(query, next);
      sourceId = binding.selectSourceId(state, accountId);
      if (sourceId === undefined) return;
    } else {
      if (pending && latest.get(slot)?.identity === identity) return;
      const at = binding.selectAt(state, accountId);
      // A negative age is a clock that moved, not a fresh read: treated as stale rather than trusted
      // for however long the stamp is ahead.
      const age = at === undefined ? undefined : Date.now() - at;
      // Fresh only for the ref and query it was read for: another one, or an unknown one (state
      // restored from elsewhere), is a different question.
      const sameRead = lastIdentity.get(slot) === identity;
      if (maxAge > 0 && sameRead && age !== undefined && age >= 0 && age < maxAge) return;
    }

    const token = Symbol(slot);
    latest.set(slot, { token, identity: more ? JSON.stringify([identity, "more"]) : identity });
    const isLatest = () => latest.get(slot)?.token === token;

    dispatch(binding.requested(accountId));
    try {
      const { data, sourceId: answeredBy } = await getAccountDataRouter(extra).read(
        binding.datum,
        ref,
        readQuery,
        { signal, sourceId },
      );
      if (!isLatest()) return;
      if (!more) lastIdentity.set(slot, identity);
      dispatch(
        binding.received({
          accountId,
          data,
          sourceId: answeredBy,
          append: more,
          at: new Date().toISOString(),
        }),
      );
    } catch (error) {
      if (!isLatest()) return;
      dispatch(
        binding.failed({
          accountId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      if (isLatest()) latest.delete(slot);
    }
  };
}
