import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import {
  accountOperationsSlice,
  type AccountOperation,
  type AccountOperationsStatus,
  type WithAccountOperations,
} from "@domain/entity-account-operations";
import { useAccountDataRouter } from "@features/platform-account-data/react";
import { fetchAccountOperations, fetchMoreAccountOperations } from "./fetchAccountOperations";
import { type AccountRef, refKeyOf } from "@features/platform-account-data";

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
  { maxAge, limit }: { maxAge?: number; limit?: number } = {},
): UseAccountOperationsResult {
  const dispatch = useDispatch<ThunkDispatch<WithAccountOperations, unknown, UnknownAction>>();
  const router = useAccountDataRouter();
  const accountId = ref?.accountId;
  const refKey = ref ? refKeyOf(ref) : undefined;
  const latest = useRef(ref);
  latest.current = ref;

  useEffect(() => {
    if (latest.current) {
      void dispatch(fetchAccountOperations(router, latest.current, { maxAge, limit }));
    }
  }, [dispatch, router, refKey, maxAge, limit]);

  const operations = useSelector((s: WithAccountOperations) =>
    accountId ? selectAccountOperations(s, accountId) : NO_OPERATIONS,
  );
  const hasMore = useSelector((s: WithAccountOperations) =>
    accountId ? selectHasMoreAccountOperations(s, accountId) : false,
  );
  const total = useSelector((s: WithAccountOperations) =>
    accountId ? selectAccountOperationsTotal(s, accountId) : undefined,
  );
  const status = useSelector((s: WithAccountOperations) =>
    accountId ? selectAccountOperationsStatus(s, accountId) : IDLE,
  );

  const loadMore = useCallback(async () => {
    if (latest.current)
      await dispatch(fetchMoreAccountOperations(router, latest.current, { limit }));
  }, [dispatch, router, limit]);

  const refresh = useCallback(async () => {
    if (latest.current) {
      await dispatch(fetchAccountOperations(router, latest.current, { maxAge: 0, limit }));
    }
  }, [dispatch, router, limit]);

  return { operations, hasMore, total, status, loadMore, refresh };
}
