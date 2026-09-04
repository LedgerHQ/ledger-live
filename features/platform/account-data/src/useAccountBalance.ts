import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountBalancesSlice,
  type AccountBalance,
  type AccountBalanceStatus,
  type WithAccountBalances,
} from "@domain/entity-account-balance";
import { fetchAccountBalance, type FetchAccountBalanceOptions } from "./thunk";
import type { AccountRef } from "./source";

const NO_BALANCES: readonly AccountBalance[] = [];
const IDLE: AccountBalanceStatus = { pending: false };

const { selectAccountBalance, selectSubAccountBalances, selectAccountBalanceStatus } =
  accountBalancesSlice.selectors;

/**
 * Every field of the ref, not just the id.
 *
 * The same account id can be handed a new `address` — a fresh receive address rotates on UTXO
 * families — or a corrected `derivationMode`, and keying on the id alone would keep reading the ref
 * captured at mount, i.e. balances for the wrong address. Keying on the *object* would be the
 * opposite bug: a caller building the ref inline would re-read on every render.
 */
const refKeyOf = (ref: AccountRef | undefined): string | undefined =>
  ref && !ref.parentId
    ? [ref.accountId, ref.currencyId, ref.address, ref.derivationMode].join("|")
    : undefined;

export type UseAccountBalanceResult = {
  /** The account's own balance, `undefined` until first read. */
  balance: AccountBalance | undefined;
  /** Balances of the token accounts this account holds — filled by the same single read. */
  subAccountBalances: readonly AccountBalance[];
  status: AccountBalanceStatus;
  /** Force a round-trip, ignoring freshness. For a pull-to-refresh. */
  refresh: () => Promise<void>;
};

/**
 * The account's balance, and nothing else.
 *
 * Mounting it is what triggers the read: no global sync has to have run first, and the account does
 * not have to be in the legacy store. On a chain whose coin module can serve a balance on its own
 * that costs one `getBalance` call — no operation history, no balance-history derivation, no family
 * resource bag. On a chain without one it falls back to the full sync, i.e. exactly today's cost.
 *
 * Takes the **main account's** ref. Passing a token account's ref reads its row without triggering
 * anything, since only the parent's read can produce it.
 */
export function useAccountBalance(
  ref: AccountRef | undefined,
  options?: FetchAccountBalanceOptions,
): UseAccountBalanceResult {
  const dispatch = useDispatch<ThunkDispatch<WithAccountBalances, unknown, UnknownAction>>();
  const accountId = ref?.accountId;
  const maxAge = options?.maxAge;
  const refKey = refKeyOf(ref);

  const latest = useRef(ref);
  latest.current = ref;

  // Deliberately no `AbortController`. A read is not *for* a component: its result lands in a shared
  // table, and because `fetchAccountBalance` coalesces on the account's pending status, only the
  // first of N mounted consumers actually runs one. Aborting on that one's unmount would cancel the
  // read the other N-1 are still waiting on. Ref-counting it back is the scheduler this layer just
  // removed; letting a cheap request finish and land is the cheaper answer.
  useEffect(() => {
    const current = latest.current;
    if (!refKey || !current) return;
    void dispatch(fetchAccountBalance(current, { maxAge }));
  }, [dispatch, refKey, maxAge]);

  const balance = useSelector((state: WithAccountBalances) =>
    accountId ? selectAccountBalance(state, accountId) : undefined,
  );
  const subAccountBalances = useSelector((state: WithAccountBalances) =>
    accountId ? selectSubAccountBalances(state, accountId) : NO_BALANCES,
  );
  const status = useSelector((state: WithAccountBalances) =>
    accountId ? selectAccountBalanceStatus(state, accountId) : IDLE,
  );

  const refresh = useCallback(async () => {
    const current = latest.current;
    if (!current || current.parentId) return;
    await dispatch(fetchAccountBalance(current, { maxAge: 0 }));
  }, [dispatch]);

  return { balance, subAccountBalances, status, refresh };
}
