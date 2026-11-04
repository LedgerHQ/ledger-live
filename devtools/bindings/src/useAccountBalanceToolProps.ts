import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData } from "@domain/api-account-data";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { AccountAssetBalance, WithAccountBalances } from "@domain/entity-account-balance";
import { accountDataQueryKey, type AccountDataRootState } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { formatAmount, useAssetUnits } from "./useAssetUnits";

type AccountBalanceToolProps = Extract<DevToolsConfig[number], { id: "account-balance" }>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = AccountDataRootState & WithAccountBalances & { accountEntries: AccountsState };

type Dispatch = ThunkDispatch<State, unknown, UnknownAction>;

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

export function useAccountBalanceToolProps(): AccountBalanceToolProps {
  const dispatch = useDispatch<Dispatch>();
  const entries = useSelector(selectAccountEntries);
  const balances = useSelector((state: State) => state.accountBalances);
  const statuses = useSelector((state: State) => state.accountData.balance);

  const assetIds = useMemo(
    () => [
      ...new Set(Object.values(balances).flatMap(rows => rows?.map(row => row.assetId) ?? [])),
    ],
    [balances],
  );
  const unitOf = useAssetUnits(assetIds, dispatch);

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

  const accounts = useMemo(() => {
    const toRow = ({ assetId, balance, spendableBalance }: AccountAssetBalance) => {
      const unit = unitOf(assetId);
      return {
        assetId,
        balance: formatAmount(unit, balance),
        spendableBalance:
          spendableBalance === balance ? undefined : formatAmount(unit, spendableBalance),
        empty: balance === "0",
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
        rows: balances[accountUUID]?.map(toRow),
      };
    });
  }, [entries, statuses, balances, unitOf]);

  return { accounts, onRead, onReadAll };
}
