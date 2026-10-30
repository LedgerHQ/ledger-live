import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData, fetchMoreAccountData } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import { accountDataQueryKey, type AccountDataRootState } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import {
  selectAccountOperations,
  type AccountOperation,
  type WithAccountOperations,
} from "@domain/entity-account-operation";
import { formatAmount, useAssetUnits } from "./useAssetUnits";

type AccountOperationToolProps = Extract<
  DevToolsConfig[number],
  { id: "account-operation" }
>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = AccountDataRootState & WithAccountOperations & { accountEntries: AccountsState };

type Dispatch = ThunkDispatch<State, unknown, UnknownAction>;

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

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
    (descriptor: AccountDescriptor) =>
      dispatch(fetchAccountData("operations", descriptor, { maxAge: 0 })),
    [dispatch],
  );

  const onRead = useCallback(
    (accountUUID: string) => {
      const descriptor = descriptors.get(accountUUID);
      if (descriptor) read(descriptor);
    },
    [descriptors, read],
  );

  const onReadMore = useCallback(
    (accountUUID: string) => {
      const descriptor = descriptors.get(accountUUID);
      if (descriptor) dispatch(fetchMoreAccountData("operations", descriptor));
    },
    [descriptors, dispatch],
  );

  const onReadAll = useCallback(() => descriptors.forEach(read), [descriptors, read]);

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
      const status = statuses?.[accountUUID]?.[accountDataQueryKey(undefined)];
      return {
        accountUUID,
        descriptor: JSON.stringify(descriptor, null, 2),
        reading: status?.request !== undefined,
        error: status?.error && `${status.error.name}: ${status.error.message}`,
        sourceId: status?.sourceId,
        readAt: status?.readAt,
        hasMore: status?.nextCursor !== undefined,
        rows: selectAccountOperations({ accountOperations: operations }, accountUUID)?.map(toRow),
      };
    });
  }, [entries, statuses, operations, unitOf]);

  return { accounts, onRead, onReadMore, onReadAll };
}
