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

/** The minimum a host must tell the tool about one of its accounts. */
export type AccountOperationsInput = {
  ref: AccountRef;
  name: string;
  /** Whether a coin module is allowed to serve this account's history on its own. */
  granular: boolean;
  /**
   * Display unit per asset id, so amounts render as `0.0153 ETH` rather than as smallest units.
   * The host supplies it because only it holds the resolved currencies and tokens.
   */
  units: Readonly<Record<string, { code: string; magnitude: number }>>;
};

// `getSelectors()` — over the slice state, not the root state, so the tool does not re-render on
// every unrelated slice change.
const {
  selectAccountOperations,
  selectAccountOperationsEntry,
  selectAccountOperationsStatus,
  selectAccountOperationsTotal,
} = accountOperationsSlice.getSelectors();

/**
 * Props for the Account Operations devtool.
 *
 * The host passes its accounts already shaped as `AccountRef`s; everything about the *history* is
 * read from the slice. Refresh forces a head read; load more resumes from the stored cursor and does
 * nothing when there is none — which on a full-sync family is always, because that source returned
 * the whole history on the first read.
 */
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
            // A row that landed elsewhere than the account asked for is a token account's — the
            // fan-out the flat model makes visible without walking anything.
            onTokenAccount: operation.accountId !== ref.accountId,
          })),
          // Straight from the slice, `undefined` included: the whole point is that a paginated read
          // cannot always answer this, and the tool must not invent a number.
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
