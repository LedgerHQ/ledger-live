import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData } from "@domain/api-account-data-source";
import { computeAccountId } from "@domain/entity-account-alias";
import {
  accountKeyOf,
  currencyIdFromNetwork,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import {
  accountOperationsBinding,
  accountOperationsSlice,
  type WithAccountOperations,
} from "@domain/entity-account-operations";

const PAGE = { limit: 50 };

type AccountOperationsToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-operations" }
>["config"];

type Row = AccountOperationsToolProps["accounts"][number];

export type AccountOperationsInput = {
  descriptor: AccountDescriptor;
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
      inputs.map(({ descriptor, name, granular, units }) => {
        const accountId = computeAccountId(descriptor);
        const window = selectAccountOperations(operations, accountId);
        const entry = selectAccountOperationsEntry(operations, accountId);

        return {
          accountId: accountId,
          name,
          currencyId: currencyIdFromNetwork(descriptor.network),
          address: accountKeyOf(descriptor),
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
            onTokenAccount: operation.accountId !== accountId,
          })),
          total: selectAccountOperationsTotal(operations, accountId),
          hasMore: entry.nextCursor !== undefined,
          complete: entry.complete,
          status: selectAccountOperationsStatus(operations, accountId),
        };
      }),
    [inputs, operations],
  );

  const descriptorsById = useMemo(
    () =>
      new Map(inputs.map(({ descriptor }) => [String(computeAccountId(descriptor)), descriptor])),
    [inputs],
  );

  const onRefresh = useCallback(
    (accountId: string) => {
      const descriptor = descriptorsById.get(accountId);
      if (!descriptor) return;
      void dispatch(
        fetchAccountData(accountOperationsBinding, descriptor, { maxAge: 0, query: PAGE }),
      );
    },
    [dispatch, descriptorsById],
  );

  const onLoadMore = useCallback(
    (accountId: string) => {
      const descriptor = descriptorsById.get(accountId);
      if (!descriptor) return;
      void dispatch(
        fetchAccountData(accountOperationsBinding, descriptor, { query: PAGE, more: true }),
      );
    },
    [dispatch, descriptorsById],
  );

  return { accounts, onRefresh, onLoadMore, ready: true };
}
