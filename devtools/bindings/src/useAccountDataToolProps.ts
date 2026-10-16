import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData, fetchMoreAccountData } from "@domain/api-account-data";
import { accountsSlice, type AccountEntry, type AccountsState } from "@domain/entity-account";
import type { WithAccountBalances } from "@domain/entity-account-balance";
import type { AccountDataRootState, AccountDataStatus } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type { WithAccountOperations } from "@domain/entity-account-operations";

type AccountDataToolProps = Extract<DevToolsConfig[number], { id: "account-data" }>["config"];

/** The slices the tool shows, under the keys both apps mount them at. */
type State = AccountDataRootState &
  WithAccountBalances &
  WithAccountOperations & { accountEntries: AccountsState };

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

const OPERATIONS_PAGE = { limit: 20 };

const statusOf = (status: AccountDataStatus | undefined) =>
  status && {
    pending: status.request !== undefined,
    error: status.error?.message,
    sourceId: status.sourceId,
    readAt: status.readAt,
    queryKey: status.queryKey,
    nextCursor: status.nextCursor,
  };

const keyOf = (descriptor: AccountDescriptor) =>
  descriptor.type === "address" ? descriptor.address : descriptor.xpub;

/** What each account data store holds for every entry of the accounts slice, as stored. */
export function useAccountDataToolProps(): AccountDataToolProps {
  const dispatch = useDispatch<ThunkDispatch<State, unknown, UnknownAction>>();
  const entries = useSelector(selectAccountEntries);
  const accountData = useSelector((state: State) => state.accountData);
  const accountBalances = useSelector((state: State) => state.accountBalances);
  const accountOperations = useSelector((state: State) => state.accountOperations);

  const accounts = useMemo(
    () =>
      entries.map(({ accountUUID, descriptor, legacyId }: AccountEntry) => ({
        accountUUID,
        legacyId,
        network: `${descriptor.network.name}:${descriptor.network.env}`,
        key: keyOf(descriptor),
        path: descriptor.path,
        balanceStatus: statusOf(accountData.balance?.[accountUUID]),
        balances: accountBalances[accountUUID],
        operationsStatus: statusOf(accountData.operations?.[accountUUID]),
        operations: accountOperations[accountUUID]?.operations,
        operationsTotal: accountOperations[accountUUID]?.total,
      })),
    [entries, accountData, accountBalances, accountOperations],
  );

  const descriptors = useMemo(
    () => new Map(entries.map(entry => [String(entry.accountUUID), entry.descriptor])),
    [entries],
  );

  const withDescriptor = useCallback(
    (read: (descriptor: AccountDescriptor) => unknown) => (accountUUID: string) => {
      const descriptor = descriptors.get(accountUUID);
      if (descriptor) void read(descriptor);
    },
    [descriptors],
  );

  const onReadBalance = useMemo(
    () => withDescriptor(each => dispatch(fetchAccountData("balance", each, { maxAge: 0 }))),
    [dispatch, withDescriptor],
  );
  const onReadOperations = useMemo(
    () =>
      withDescriptor(each =>
        dispatch(fetchAccountData("operations", each, { maxAge: 0, query: OPERATIONS_PAGE })),
      ),
    [dispatch, withDescriptor],
  );
  const onLoadMoreOperations = useMemo(
    () =>
      withDescriptor(each =>
        dispatch(fetchMoreAccountData("operations", each, { query: OPERATIONS_PAGE })),
      ),
    [dispatch, withDescriptor],
  );
  const onReadAll = useCallback(() => {
    for (const { descriptor } of entries) void dispatch(fetchAccountData("balance", descriptor));
  }, [dispatch, entries]);

  return useMemo(
    () => ({ accounts, onReadBalance, onReadOperations, onLoadMoreOperations, onReadAll }),
    [accounts, onReadBalance, onReadOperations, onLoadMoreOperations, onReadAll],
  );
}
