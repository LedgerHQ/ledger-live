import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData, fetchMoreAccountData } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { AccountDataRootState } from "@domain/entity-account-data";
import { BalanceAssetIdSchema, type WithAccountBalances } from "@domain/entity-account-balance";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  CountervalueTickerSchema,
  selectAccountOperations,
  type AccountOperation,
  type AccountOperationsQuery,
  type WithAccountOperations,
} from "@domain/entity-account-operation";
import { findFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { formatAmount, useAssetUnits } from "./useAssetUnits";

type AccountOperationToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-operation" }
>["config"];

type AccountOperationToolQuery = Parameters<AccountOperationToolProps["onReadAll"]>[0];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = AccountDataRootState &
  WithAccountOperations &
  Partial<WithAccountBalances> & { accountEntries: AccountsState };

type Dispatch = ThunkDispatch<State, unknown, UnknownAction>;

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

/** The tool's options as a query, the invalid ones left out. */
function toQuery(options: AccountOperationToolQuery, fiat: string): AccountOperationsQuery {
  return {
    limit: options.limit,
    filterAsset: BalanceAssetIdSchema.optional().safeParse(options.filterAsset).data,
    countervalue: options.countervalue ? CountervalueTickerSchema.safeParse(fiat).data : undefined,
  };
}

function labelOf(query: AccountOperationsQuery | undefined): string {
  const parts = [
    query?.filterAsset && `filter ${query.filterAsset}`,
    query?.countervalue && `in ${query.countervalue}`,
    query?.limit !== undefined && `limit ${query.limit}`,
  ].filter(part => typeof part === "string");
  return parts.length ? parts.join(" · ") : "default";
}

/** The query a window key stands for: the key is the query's JSON, `""` for no query. */
function queryOf(queryKey: string): AccountOperationsQuery | undefined {
  if (!queryKey) return undefined;
  const parsed: unknown = JSON.parse(queryKey);
  if (typeof parsed !== "object" || parsed === null) return undefined;
  const field = (name: string) => (name in parsed ? Reflect.get(parsed, name) : undefined);
  const limit = field("limit");
  const filterAsset = BalanceAssetIdSchema.optional().safeParse(field("filterAsset"));
  const countervalue = CountervalueTickerSchema.optional().safeParse(field("countervalue"));
  return {
    limit: typeof limit === "number" ? limit : undefined,
    filterAsset: filterAsset.data,
    countervalue: countervalue.data,
  };
}

const formatCountervalues = (countervalues: AccountOperation["countervalues"]) =>
  Object.entries(countervalues ?? {}).flatMap(([ticker, amount]) => {
    const unit = findFiatCurrencyByTicker(ticker)?.units[0];
    return unit && amount ? [formatAmount(unit, amount)] : [];
  });

/** `fiat` is the app's countervalue setting, the one fiat its rates are loaded for. */
export function useAccountOperationToolProps(fiat: string): AccountOperationToolProps {
  const dispatch = useDispatch<Dispatch>();
  const entries = useSelector(selectAccountEntries);
  const operations = useSelector((state: State) => state.accountOperations);
  const statuses = useSelector((state: State) => state.accountData.operations);
  const balances = useSelector((state: State) => state.accountBalances);

  const assetIds = useMemo(
    () => [
      ...new Set([
        ...Object.values(balances ?? {}).flatMap(rows => rows?.map(row => row.assetId) ?? []),
        ...Object.values(operations).flatMap(entry =>
          Object.values(entry?.byId ?? {}).flatMap(row => (row ? [row.assetId] : [])),
        ),
      ]),
    ],
    [balances, operations],
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
    (options: AccountOperationToolQuery) => {
      const query = toQuery(options, fiat);
      descriptors.forEach(descriptor => read(descriptor, query));
    },
    [descriptors, read, fiat],
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
        countervalues: formatCountervalues(operation.countervalues),
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

  return { accounts, assetIds, fiat, onRead, onReadMore, onReadAll };
}
