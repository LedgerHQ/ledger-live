import type { AccountRef } from "@domain/entity-account";
import type {
  AccountDataAction,
  AccountDataBinding,
  AccountDataQuery,
  AccountDatum,
} from "@domain/entity-account-data";
import type { AccountDataRouter } from "./router";

/** What the store must provide as thunk `extraArgument`. */
export type AccountDataExtra = { accountData: AccountDataRouter };

export const DEFAULT_MAX_AGE = 30_000;

export type FetchAccountDataOptions<K extends AccountDatum> = {
  maxAge?: number;
  /** Overrides the binding's head query. */
  query?: AccountDataQuery<K>;
  /** Read the next page from the stored cursor and append it. */
  more?: boolean;
  signal?: AbortSignal;
};

const refKeyOf = (ref: AccountRef): string =>
  [ref.accountId, ref.currencyId, ref.address, ref.derivationMode].join("|");

// Which ref each in-flight head read is for: the pending flag alone would drop a read for another
// ref of the same account (a rotated address) with nothing left to re-trigger it.
const inflightRefKey = new Map<string, string>();

export function fetchAccountData<K extends AccountDatum, S>(
  binding: AccountDataBinding<K, S>,
  ref: AccountRef,
  { maxAge = DEFAULT_MAX_AGE, query, more = false, signal }: FetchAccountDataOptions<K> = {},
) {
  return async (
    dispatch: (action: AccountDataAction) => unknown,
    getState: () => S,
    extra: AccountDataExtra,
  ): Promise<void> => {
    const state = getState();
    const { accountId } = ref;
    const key = `${binding.datum}|${accountId}`;
    const refKey = refKeyOf(ref);
    const pending = binding.selectPending(state, accountId);

    let readQuery: AccountDataQuery<K>;
    let sourceId: string | undefined;
    if (more) {
      const next = binding.selectNextQuery?.(state, accountId);
      if (pending || next === undefined) return;
      readQuery = next;
      sourceId = binding.selectSourceId?.(state, accountId);
    } else {
      if (pending && inflightRefKey.get(key) === refKey) return;
      const at = binding.selectAt(state, accountId);
      // A negative age is a clock that moved, not a fresh read.
      const age = at === undefined ? undefined : Date.now() - at;
      if (maxAge > 0 && age !== undefined && age >= 0 && age < maxAge) return;
      readQuery = query ?? binding.headQuery;
    }

    if (!more) inflightRefKey.set(key, refKey);
    dispatch(binding.requested(accountId));
    try {
      const result = await extra.accountData.read(binding.datum, ref, readQuery, {
        signal,
        sourceId,
      });
      dispatch(
        binding.received({ accountId, data: result.data, sourceId: result.sourceId, append: more }),
      );
    } catch (error) {
      dispatch(
        binding.failed({
          accountId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      if (!more && inflightRefKey.get(key) === refKey) inflightRefKey.delete(key);
    }
  };
}
