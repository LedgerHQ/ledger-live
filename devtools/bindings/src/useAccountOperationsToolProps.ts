import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import {
  fetchAccountOperations,
  fetchMoreAccountOperations,
  getAccountOperationsSources,
  type AccountRef,
} from "@features/platform-account-data";
import {
  accountOperationsSlice,
  type WithAccountOperations,
} from "@domain/entity-account-operations";

type AccountOperationsToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-operations" }
>["config"];

type Row = AccountOperationsToolProps["accounts"][number];

export type AccountOperationsInput = {
  ref: AccountRef;
  name: string;
  granular: boolean;
  units: Readonly<Record<string, { code: string; magnitude: number }>>;
};

const {
  selectAccountOperations,
  selectAccountOperationsEntry,
  selectAccountOperationsStatus,
  selectAccountOperationsTotal,
} = accountOperationsSlice.getSelectors();

export function useAccountOperationsToolProps(
  inputs: readonly AccountOperationsInput[],
): AccountOperationsToolProps {
  const dispatch = useDispatch<ThunkDispatch<WithAccountOperations, unknown, UnknownAction>>();
  const operations = useSelector((state: WithAccountOperations) => state.accountOperations);

  const accounts = useMemo<Row[]>(
    () =>
      inputs.map(({ ref, name, granular, units }) => {
        const window = selectAccountOperations(operations, ref.accountId);
        const entry = selectAccountOperationsEntry(operations, ref.accountId);

        return {
          accountId: ref.accountId,
          name,
          currencyId: ref.currencyId,
          address: ref.address,
          granular,
          operations: window.map(operation => ({
            id: operation.id,
            type: operation.type,
            value: operation.value,
            assetId: operation.assetId,
            unit: units[operation.assetId],
            date: operation.date,
            blockHeight: operation.blockHeight,
            nested: operation.parentOperationId !== undefined,
            onTokenAccount: operation.accountId !== ref.accountId,
          })),
          total: selectAccountOperationsTotal(operations, ref.accountId),
          hasMore: entry.nextCursor !== undefined,
          complete: entry.complete,
          status: selectAccountOperationsStatus(operations, ref.accountId),
        };
      }),
    [inputs, operations],
  );

  const refsById = useMemo(
    () => new Map(inputs.map(({ ref }) => [String(ref.accountId), ref])),
    [inputs],
  );

  const onRefresh = useCallback(
    (accountId: string) => {
      const ref = refsById.get(accountId);
      if (!ref) return;
      void dispatch(fetchAccountOperations(ref, { maxAge: 0 }));
    },
    [dispatch, refsById],
  );

  const onLoadMore = useCallback(
    (accountId: string) => {
      const ref = refsById.get(accountId);
      if (!ref) return;
      void dispatch(fetchMoreAccountOperations(ref));
    },
    [dispatch, refsById],
  );

  return { accounts, onRefresh, onLoadMore, ready: getAccountOperationsSources().length > 0 };
}
