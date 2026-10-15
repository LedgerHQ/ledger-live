import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData, fetchMoreAccountData } from "@domain/api-account-data";
import {
  selectAccountDataStatus,
  type AccountDataKind,
  type AccountDataRootState,
  type AccountDataStatus,
} from "@domain/entity-account-data";
import { selectAccountBalances, type WithAccountBalances } from "@domain/entity-account-balance";
import {
  computeAccountUUID,
  currencyIdFromNetwork,
  type AccountDescriptor,
} from "@domain/entity-account-descriptor";
import {
  selectAccountOperations,
  selectAccountOperationsTotal,
  type WithAccountOperations,
} from "@domain/entity-account-operations";
import type { Currency } from "@domain/entity-currency";
import { useCountervaluesState } from "@features/platform-market-countervalues";
import { accountAssetRows } from "./accountAssetRows";

type AccountDataToolProps = Extract<DevToolsConfig[number], { id: "account-data" }>["config"];

export type AccountDataToolInput = { descriptor: AccountDescriptor; name: string };

type State = AccountDataRootState & WithAccountBalances & WithAccountOperations;

const OPERATIONS_PAGE = { limit: 20 };

const statusOf = (status: AccountDataStatus | undefined) => ({
  pending: status?.request !== undefined,
  error: status?.error?.message,
  sourceId: status?.sourceId,
  readAt: status?.readAt,
});

export function useAccountDataToolProps(
  inputs: readonly AccountDataToolInput[],
  fiat: Currency | undefined,
  /** The metadata of any asset id a source answered, known to the account or not. */
  currencyOf: (assetId: string) => Currency | undefined,
): AccountDataToolProps {
  const dispatch = useDispatch<ThunkDispatch<State, unknown, UnknownAction>>();
  const accountData = useSelector((each: State) => each.accountData);
  const accountBalances = useSelector((each: State) => each.accountBalances);
  const accountOperations = useSelector((each: State) => each.accountOperations);
  const state = useMemo(
    () => ({ accountData, accountBalances, accountOperations }),
    [accountData, accountBalances, accountOperations],
  );
  const countervalues = useCountervaluesState();

  const byUUID = useMemo(
    () => new Map(inputs.map(input => [String(computeAccountUUID(input.descriptor)), input])),
    [inputs],
  );

  const accounts = useMemo(
    () =>
      inputs.map(({ descriptor, name }) => {
        const accountUUID = computeAccountUUID(descriptor);
        const status = (kind: AccountDataKind) =>
          statusOf(selectAccountDataStatus(state, kind, accountUUID));
        const unitOf = (assetId: string) => currencyOf(assetId)?.units[0];
        const assets = accountAssetRows(
          selectAccountBalances(state, accountUUID) ?? [],
          countervalues,
          currencyOf,
          fiat,
        );
        return {
          accountUUID,
          name,
          currencyId: currencyIdFromNetwork(descriptor.network),
          address: descriptor.type === "address" ? descriptor.address : descriptor.xpub,
          assets: assets.map(asset => ({
            assetId: asset.assetId,
            unit: unitOf(asset.assetId),
            balance: asset.balance,
            spendable: asset.spendableBalance,
            value: asset.value,
            trend: asset.trend,
          })),
          balanceStatus: status("balance"),
          operations: selectAccountOperations(state, accountUUID).map(operation => ({
            id: operation.id,
            date: operation.date,
            type: operation.type,
            assetId: operation.assetId,
            unit: unitOf(operation.assetId),
            value: operation.value,
            hash: operation.hash,
          })),
          operationsStatus: status("operations"),
          hasMoreOperations:
            selectAccountDataStatus(state, "operations", accountUUID)?.nextCursor !== undefined,
          operationsTotal: selectAccountOperationsTotal(state, accountUUID),
        };
      }),
    [inputs, state, countervalues, fiat, currencyOf],
  );

  const withDescriptor = useCallback(
    (read: (descriptor: AccountDescriptor) => void) => (accountUUID: string) => {
      const input = byUUID.get(accountUUID);
      if (input) read(input.descriptor);
    },
    [byUUID],
  );

  const onReadBalance = useMemo(
    () => withDescriptor(each => void dispatch(fetchAccountData("balance", each, { maxAge: 0 }))),
    [dispatch, withDescriptor],
  );
  const onReadOperations = useMemo(
    () =>
      withDescriptor(
        each =>
          void dispatch(
            fetchAccountData("operations", each, { maxAge: 0, query: OPERATIONS_PAGE }),
          ),
      ),
    [dispatch, withDescriptor],
  );
  const onLoadMoreOperations = useMemo(
    () =>
      withDescriptor(
        each => void dispatch(fetchMoreAccountData("operations", each, { query: OPERATIONS_PAGE })),
      ),
    [dispatch, withDescriptor],
  );
  const onReadAll = useCallback(() => {
    for (const { descriptor } of inputs) void dispatch(fetchAccountData("balance", descriptor));
  }, [dispatch, inputs]);

  return {
    accounts,
    fiat: fiat?.units[0],
    onReadBalance,
    onReadOperations,
    onLoadMoreOperations,
    onReadAll,
  };
}
