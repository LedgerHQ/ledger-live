import { useCallback, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { AccountRef } from "@domain/entity-account";
import type { AccountDataBinding, AccountDatum } from "@domain/entity-account-data";
import { fetchAccountData, type AccountDataExtra } from "@domain/api-account-data-source";

export type UseAccountDataResult = {
  refresh: () => Promise<void>;
  /** Only for data that paginates. */
  loadMore?: () => Promise<void>;
};

const refKeyOf = (ref: AccountRef): string =>
  [ref.accountId, ref.currencyId, ref.address, ref.derivationMode].join("|");

/**
 * Reads a datum on mount and whenever the ref changes. The data itself is read with the entity's
 * own selectors: this hook only triggers and refreshes.
 */
export function useAccountData<K extends AccountDatum, S>(
  binding: AccountDataBinding<K, S>,
  ref: AccountRef | undefined,
  { maxAge }: { maxAge?: number } = {},
): UseAccountDataResult {
  const dispatch = useDispatch<ThunkDispatch<S, AccountDataExtra, UnknownAction>>();
  const latest = useRef(ref);
  latest.current = ref;
  const refKey = ref ? refKeyOf(ref) : undefined;

  useEffect(() => {
    if (latest.current) void dispatch(fetchAccountData(binding, latest.current, { maxAge }));
  }, [dispatch, binding, refKey, maxAge]);

  const refresh = useCallback(async () => {
    if (latest.current) await dispatch(fetchAccountData(binding, latest.current, { maxAge: 0 }));
  }, [dispatch, binding]);

  const loadMore = useCallback(async () => {
    if (latest.current) await dispatch(fetchAccountData(binding, latest.current, { more: true }));
  }, [dispatch, binding]);

  return binding.selectNextQuery ? { refresh, loadMore } : { refresh };
}
