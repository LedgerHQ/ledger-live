import { accountRefKey, type AccountRef } from "@domain/entity-account";
import type {
  AccountDataAction,
  AccountDataBinding,
  AccountDataQuery,
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

// Which ref each in-flight head read is for. The pending flag alone would drop a read for a
// *different* ref of the same account (a rotated fresh address, say), and nothing would re-trigger it.
const inflightRefKey = new Map<string, string>();

// Both sides are the datum's own query type; spreading them loses that to TypeScript, not at runtime.
function withNextPage<K extends AccountDatum>(
  query: AccountDataQuery<K> | undefined,
  next: AccountDataQuery<K>,
): AccountDataQuery<K> {
  return { ...(query as object), ...(next as object) } as AccountDataQuery<K>;
}

/**
 * Read one datum of one account into its slice, through whichever source the router picks. Head
 * reads are guarded by freshness and by an in-flight read of the same ref; a next page is guarded
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
    const { accountId } = ref;
    const slot = `${binding.datum}|${accountId}`;
    const refKey = accountRefKey(ref);
    const pending = binding.selectPending(state, accountId);

    let readQuery = query;
    let sourceId: string | undefined;
    if (more) {
      if (pending) return;
      const next = binding.selectNextQuery?.(state, accountId);
      if (next === undefined) return;
      readQuery = withNextPage(query, next);
      sourceId = binding.selectSourceId(state, accountId);
    } else {
      if (pending && inflightRefKey.get(slot) === refKey) return;
      const at = binding.selectAt(state, accountId);
      // A negative age is a clock that moved, not a fresh read: treated as stale rather than trusted
      // for however long the stamp is ahead.
      const age = at === undefined ? undefined : Date.now() - at;
      if (maxAge > 0 && age !== undefined && age >= 0 && age < maxAge) return;
      inflightRefKey.set(slot, refKey);
    }

    dispatch(binding.requested(accountId));
    try {
      const { data, sourceId: answeredBy } = await getAccountDataRouter(extra).read(
        binding.datum,
        ref,
        readQuery,
        { signal, sourceId },
      );
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
      dispatch(
        binding.failed({
          accountId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      if (!more && inflightRefKey.get(slot) === refKey) inflightRefKey.delete(slot);
    }
  };
}
