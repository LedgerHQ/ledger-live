import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountBalancesSlice,
  type AccountBalance,
  type AccountBalanceStatus,
  type WithAccountBalances,
} from "@domain/entity-account-balance";
import { fetchAccountBalance } from "./thunk";
import { refKeyOf, type AccountRef } from "./source";

const NO_BALANCES: readonly AccountBalance[] = [];
const IDLE: AccountBalanceStatus = { pending: false };

const { selectAccountBalance, selectSubAccountBalances, selectAccountBalanceStatus } =
  accountBalancesSlice.selectors;

/** What the hook honours. Not `FetchAccountBalanceOptions`: a source list is the app's to register,
 * and a caller's signal must not cancel a read other consumers are waiting on. */
export type UseAccountBalanceOptions = { maxAge?: number };

export type UseAccountBalanceResult = {
  balance: AccountBalance | undefined;
  subAccountBalances: readonly AccountBalance[];
  status: AccountBalanceStatus;
  refresh: () => Promise<void>;
};

export function useAccountBalance(
  ref: AccountRef | undefined,
  options?: UseAccountBalanceOptions,
): UseAccountBalanceResult {
  const dispatch = useDispatch<ThunkDispatch<WithAccountBalances, unknown, UnknownAction>>();
  const accountId = ref?.accountId;
  const maxAge = options?.maxAge;
  const refKey = ref ? refKeyOf(ref) : undefined;

  const latest = useRef(ref);
  latest.current = ref;

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
    if (!current) return;
    await dispatch(fetchAccountBalance(current, { maxAge: 0 }));
  }, [dispatch]);

  return { balance, subAccountBalances, status, refresh };
}
