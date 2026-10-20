import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { WithAccountBalances } from "@domain/entity-account-balance";
import type { AccountDataRootState } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";

type AccountBalanceToolProps = Extract<DevToolsConfig[number], { id: "account-balance" }>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = AccountDataRootState & WithAccountBalances & { accountEntries: AccountsState };

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

export function useAccountBalanceToolProps(): AccountBalanceToolProps {
  const dispatch = useDispatch<ThunkDispatch<State, unknown, UnknownAction>>();
  const entries = useSelector(selectAccountEntries);
  const balances = useSelector((state: State) => state.accountBalances);
  const statuses = useSelector((state: State) => state.accountData.balance);

  const read = useCallback(
    (descriptor: AccountDescriptor) =>
      dispatch(fetchAccountData("balance", descriptor, { maxAge: 0 })),
    [dispatch],
  );

  const descriptors = useMemo(
    () => new Map<string, AccountDescriptor>(entries.map(e => [e.accountUUID, e.descriptor])),
    [entries],
  );

  const onRead = useCallback(
    (accountUUID: string) => {
      const descriptor = descriptors.get(accountUUID);
      if (descriptor) read(descriptor);
    },
    [descriptors, read],
  );

  const onReadAll = useCallback(() => descriptors.forEach(read), [descriptors, read]);

  const accounts = useMemo(
    () =>
      entries.map(({ accountUUID, descriptor }) => {
        const status = statuses?.[accountUUID];
        return {
          accountUUID,
          network: `${descriptor.network.name} (${descriptor.network.env})`,
          reading: status?.request !== undefined,
          error: status?.error && `${status.error.name}: ${status.error.message}`,
          sourceId: status?.sourceId,
          readAt: status?.readAt,
          rows: balances[accountUUID],
        };
      }),
    [entries, statuses, balances],
  );

  return { accounts, onRead, onReadAll };
}
