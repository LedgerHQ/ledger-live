import {
  accountBalanceFailed,
  accountBalanceReceived,
  accountBalanceRequested,
  accountBalancesSlice,
  type WithAccountBalances,
} from "@domain/entity-account-balance";
import { getAccountBalanceSources } from "./register";
import { readAccountBalances, type AccountBalanceSource, type AccountRef } from "./source";

/** A balance younger than this is not worth a round-trip. */
export const DEFAULT_MAX_AGE = 30_000;

export type FetchAccountBalanceOptions = {
  /** Max acceptable age in ms. `0` forces a round-trip. Defaults to {@link DEFAULT_MAX_AGE}. */
  maxAge?: number;
  /** Sources to read from. Defaults to the ones registered at the composition root. */
  sources?: readonly AccountBalanceSource[];
  signal?: AbortSignal;
};

/**
 * Typed loosely on purpose: any real store's `dispatch` and `getState` satisfy these, and so does
 * wallet-cli's local reducer with no store around it.
 */
type Dispatch = (action: { type: string }) => unknown;
type GetState = () => WithAccountBalances;

const { selectAccountBalanceAt, selectAccountBalanceStatus } = accountBalancesSlice.selectors;

/**
 * Read one account's balances, unless the answer is already there.
 *
 * The two guards below are what the scheduler used to be. Both read state that is already in the
 * store, which is the whole reason the scheduler could go:
 *
 * - **fresh enough** — freshness is a property of the row (`at`), not of who fetched it, so it
 *   survives a reload and needs nothing kept on the side;
 * - **already pending** — `accountBalanceRequested` lands synchronously, so forty portfolio rows
 *   mounting in the same tick produce one read per account and thirty-nine no-ops.
 *
 * There is no polling and no reference-counted demand: a read happens because something asked for
 * it, and stops mattering when nothing does.
 */
export function fetchAccountBalance(ref: AccountRef, options: FetchAccountBalanceOptions = {}) {
  const { maxAge = DEFAULT_MAX_AGE, sources = getAccountBalanceSources(), signal } = options;

  return async (dispatch: Dispatch, getState: GetState): Promise<void> => {
    // A token account's balance is produced by its parent's read; asking for it on its own could
    // only ever fail. Read its row, let the parent's fetch fill it.
    if (ref.parentId) return;

    const state = getState();
    if (selectAccountBalanceStatus(state, ref.accountId).pending) return;
    const at = selectAccountBalanceAt(state, ref.accountId);
    if (maxAge > 0 && at !== undefined && Date.now() - at < maxAge) return;

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
    }
  };
}
