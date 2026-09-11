import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountOperationsSlice,
  type AccountOperation,
  type AccountOperationsStatus,
  type WithAccountOperations,
} from "@domain/entity-account-operations";
import {
  fetchAccountOperations,
  fetchMoreAccountOperations,
  type FetchAccountOperationsOptions,
} from "./operationsThunk";
import { refKeyOf, type AccountRef } from "./source";

const NO_OPERATIONS: readonly AccountOperation[] = [];
const IDLE: AccountOperationsStatus = { pending: false };

const {
  selectAccountOperations,
  selectAccountOperationsStatus,
  selectHasMoreAccountOperations,
  selectAccountOperationsTotal,
} = accountOperationsSlice.selectors;

export type UseAccountOperationsResult = {
  operations: readonly AccountOperation[];
  hasMore: boolean;
  total: number | undefined;
  status: AccountOperationsStatus;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
};

export function useAccountOperations(
  ref: AccountRef | undefined,
  options?: FetchAccountOperationsOptions,
): UseAccountOperationsResult {
  const dispatch = useDispatch<ThunkDispatch<WithAccountOperations, unknown, UnknownAction>>();
  const accountId = ref?.accountId;
  const maxAge = options?.maxAge;
  const limit = options?.limit;
  const refKey = ref ? refKeyOf(ref) : undefined;

  const latest = useRef(ref);
  latest.current = ref;

  useEffect(() => {
    const current = latest.current;
    if (!refKey || !current) return;
    void dispatch(fetchAccountOperations(current, { maxAge, limit }));
  }, [dispatch, refKey, maxAge, limit]);

  const operations = useSelector((state: WithAccountOperations) =>
    accountId ? selectAccountOperations(state, accountId) : NO_OPERATIONS,
  );
  const hasMore = useSelector((state: WithAccountOperations) =>
    accountId ? selectHasMoreAccountOperations(state, accountId) : false,
  );
  const total = useSelector((state: WithAccountOperations) =>
    accountId ? selectAccountOperationsTotal(state, accountId) : undefined,
  );
  const status = useSelector((state: WithAccountOperations) =>
    accountId ? selectAccountOperationsStatus(state, accountId) : IDLE,
  );

  const loadMore = useCallback(async () => {
    const current = latest.current;
    if (!current) return;
    await dispatch(fetchMoreAccountOperations(current, { limit }));
  }, [dispatch, limit]);

  const refresh = useCallback(async () => {
    const current = latest.current;
    if (!current) return;
    await dispatch(fetchAccountOperations(current, { maxAge: 0, limit }));
  }, [dispatch, limit]);

  return { operations, hasMore, total, status, loadMore, refresh };
}
