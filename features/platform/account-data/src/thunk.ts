import {
  accountBalanceFailed,
  accountBalanceReceived,
  accountBalanceRequested,
  accountBalancesSlice,
  type WithAccountBalances,
} from "@domain/entity-account-balance";
import { getAccountBalanceSources } from "./register";
import {
  readAccountBalances,
  refKeyOf,
  type AccountBalanceSource,
  type AccountRef,
} from "./source";

export const DEFAULT_MAX_AGE = 30_000;

export type FetchAccountBalanceOptions = {
  maxAge?: number;
  sources?: readonly AccountBalanceSource[];
  signal?: AbortSignal;
};

type Dispatch = (action: { type: string }) => unknown;
type GetState = () => WithAccountBalances;

const { selectAccountBalanceAt, selectAccountBalanceStatus } = accountBalancesSlice.selectors;

// Which ref each in-flight read is for. The pending flag alone would drop a read for a *different*
// ref of the same account — a rotated fresh address, say — and nothing would re-trigger it.
const inflightRefKey = new Map<string, string>();

export function fetchAccountBalance(ref: AccountRef, options: FetchAccountBalanceOptions = {}) {
  const { maxAge = DEFAULT_MAX_AGE, sources = getAccountBalanceSources(), signal } = options;

  return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    const state = getState();
    const refKey = refKeyOf(ref);
    const pending = selectAccountBalanceStatus(state, ref.accountId).pending;
    if (pending && inflightRefKey.get(ref.accountId) === refKey) return;
    const at = selectAccountBalanceAt(state, ref.accountId);
    // A negative age is a clock that moved, not a fresh read: treated as stale rather than trusted
    // for however long the stamp is ahead.
    const age = at === undefined ? undefined : Date.now() - at;
    if (maxAge > 0 && age !== undefined && age >= 0 && age < maxAge) return;

    inflightRefKey.set(ref.accountId, refKey);
    dispatch(accountBalanceRequested(ref.accountId));
    try {
      const { balances, sourceId } = await readAccountBalances(ref, sources, signal);
      dispatch(accountBalanceReceived({ accountId: ref.accountId, balances, sourceId }));
    } catch (error) {
      dispatch(
        accountBalanceFailed({
          accountId: ref.accountId,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    } finally {
      if (inflightRefKey.get(ref.accountId) === refKey) inflightRefKey.delete(ref.accountId);
    }
  };
}
