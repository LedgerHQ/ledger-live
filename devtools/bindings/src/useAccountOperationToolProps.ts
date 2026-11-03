import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData, fetchMoreAccountData } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { AccountDataRootState } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  selectAccountOperations,
  type AccountOperation,
  type AccountOperationsQuery,
  type WithAccountOperations,
} from "@domain/entity-account-operation";
import { formatAmount, useAssetUnits } from "./useAssetUnits";

type AccountOperationToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-operation" }
>["config"];

type AccountOperationToolQuery = Parameters<AccountOperationToolProps["onReadAll"]>[0];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = AccountDataRootState & WithAccountOperations & { accountEntries: AccountsState };

type Dispatch = ThunkDispatch<State, unknown, UnknownAction>;

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

const labelOf = (query: AccountOperationsQuery | undefined): string =>
  query?.limit === undefined ? "default" : `limit ${query.limit}`;

/** The query a window key stands for: the key is the query's JSON, `""` for no query. */
function queryOf(queryKey: string): AccountOperationsQuery | undefined {
  if (!queryKey) return undefined;
  const parsed: unknown = JSON.parse(queryKey);
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const limit = "limit" in parsed ? parsed.limit : undefined;
  return { limit: typeof limit === "number" ? limit : undefined };
}

export function useAccountOperationToolProps(): AccountOperationToolProps {
  const dispatch = useDispatch<Dispatch>();
  const entries = useSelector(selectAccountEntries);
  const operations = useSelector((state: State) => state.accountOperations);
  const statuses = useSelector((state: State) => state.accountData.operations);

  const assetIds = useMemo(
    () => [
      ...new Set(
        Object.values(operations).flatMap(entry =>
          Object.values(entry?.byId ?? {}).flatMap(row => (row ? [row.assetId] : [])),
        ),
      ),
    ],
    [operations],
  );
  const unitOf = useAssetUnits(assetIds, dispatch);

  const descriptors = useMemo(
    () => new Map<string, AccountDescriptor>(entries.map(e => [e.accountUUID, e.descriptor])),
    [entries],
  );

  const read = useCallback(
    (descriptor: AccountDescriptor, query: AccountOperationsQuery | undefined) =>
      dispatch(fetchAccountData("operations", descriptor, { query, maxAge: 0 })),
    [dispatch],
  );

  const onRead = useCallback(
    (accountUUID: string, queryKey: string) => {
      const descriptor = descriptors.get(accountUUID);
      if (descriptor) read(descriptor, queryOf(queryKey));
    },
    [descriptors, read],
  );

  const onReadMore = useCallback(
    (accountUUID: string, queryKey: string) => {
      const descriptor = descriptors.get(accountUUID);
      const query = queryOf(queryKey);
      if (descriptor) dispatch(fetchMoreAccountData("operations", descriptor, { query }));
    },
    [descriptors, dispatch],
  );

  const onReadAll = useCallback(
    (query: AccountOperationToolQuery) => {
      descriptors.forEach(descriptor => read(descriptor, query));
    },
    [descriptors, read],
  );

  const accounts = useMemo(() => {
    const toRow = (operation: AccountOperation) => {
      const unit = unitOf(operation.assetId);
      return {
        id: operation.id,
        hash: operation.hash,
        type: operation.type,
        assetId: operation.assetId,
        value: formatAmount(unit, operation.value),
        fee: formatAmount(unit, operation.fee),
        date: operation.date,
        pending: operation.blockHeight === null,
        failed: operation.hasFailed === true,
        child: operation.parentId !== undefined,
      };
    };
    return entries.map(({ accountUUID, descriptor }) => {
      const byQuery = statuses?.[accountUUID] ?? {};
      const windows = operations[accountUUID]?.windows ?? {};
      const queryKeys = [...new Set(["", ...Object.keys(byQuery), ...Object.keys(windows)])];
      return {
        accountUUID,
        descriptor: JSON.stringify(descriptor, null, 2),
        windows: queryKeys.map(queryKey => {
          const status = byQuery[queryKey];
          const query = queryOf(queryKey);
          return {
            queryKey,
            label: labelOf(query),
            reading: status?.request !== undefined,
            error: status?.error && `${status.error.name}: ${status.error.message}`,
            sourceId: status?.sourceId,
            readAt: status?.readAt,
            hasMore: status?.nextCursor !== undefined,
            rows: selectAccountOperations(
              { accountOperations: operations },
              accountUUID,
              query,
            )?.map(toRow),
          };
        }),
      };
    });
  }, [entries, statuses, operations, unitOf]);

  return { accounts, onRead, onReadMore, onReadAll };
}
