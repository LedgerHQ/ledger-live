import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountBalancesSlice,
  type AccountBalance,
  type AccountBalanceStatus,
  type WithAccountBalances,
} from "@domain/entity-account-balance";
import { useAccountDataRouter } from "@features/platform-account-data/react";
import { fetchAccountBalance } from "./fetchAccountBalance";
import { type AccountRef, refKeyOf } from "@features/platform-account-data";

const NO_BALANCES: readonly AccountBalance[] = [];
const IDLE: AccountBalanceStatus = { pending: false };

const { selectAccountBalance, selectSubAccountBalances, selectAccountBalanceStatus } =
  accountBalancesSlice.selectors;

export type UseAccountBalanceResult = {
  balance: AccountBalance | undefined;
  subAccountBalances: readonly AccountBalance[];
  status: AccountBalanceStatus;
  refresh: () => Promise<void>;
};

export function useAccountBalance(
  ref: AccountRef | undefined,
  { maxAge }: { maxAge?: number } = {},
): UseAccountBalanceResult {
  const dispatch = useDispatch<ThunkDispatch<WithAccountBalances, unknown, UnknownAction>>();
  const router = useAccountDataRouter();
  const accountId = ref?.accountId;
  const refKey = ref ? refKeyOf(ref) : undefined;
  const latest = useRef(ref);
  latest.current = ref;

  useEffect(() => {
    if (latest.current) void dispatch(fetchAccountBalance(router, latest.current, { maxAge }));
  }, [dispatch, router, refKey, maxAge]);

  const balance = useSelector((s: WithAccountBalances) =>
    accountId ? selectAccountBalance(s, accountId) : undefined,
  );
  const subAccountBalances = useSelector((s: WithAccountBalances) =>
    accountId ? selectSubAccountBalances(s, accountId) : NO_BALANCES,
  );
  const status = useSelector((s: WithAccountBalances) =>
    accountId ? selectAccountBalanceStatus(s, accountId) : IDLE,
  );

  const refresh = useCallback(async () => {
    if (latest.current) await dispatch(fetchAccountBalance(router, latest.current, { maxAge: 0 }));
  }, [dispatch, router]);

  return { balance, subAccountBalances, status, refresh };
}
