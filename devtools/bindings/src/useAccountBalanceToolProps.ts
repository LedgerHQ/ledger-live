import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import { BigNumber } from "bignumber.js";
import { formatCurrencyUnit } from "@ledgerhq/coin-module-framework/currencies";
import type { DevToolsConfig } from "@devtools/registry";
import { fetchAccountData } from "@domain/api-account-data";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import { accountsSlice, type AccountsState } from "@domain/entity-account";
import type { AccountAssetBalance, WithAccountBalances } from "@domain/entity-account-balance";
import type { AccountDataRootState } from "@domain/entity-account-data";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import { CRYPTO_CURRENCIES_REGISTRY } from "@domain/entity-currency-crypto";
import type { Unit } from "@domain/entity-currency-unit";

type AccountBalanceToolProps = Extract<DevToolsConfig[number], { id: "account-balance" }>["config"];

/** Both apps mount the accounts slice at `accountEntries`. */
type State = AccountDataRootState & WithAccountBalances & { accountEntries: AccountsState };

type Dispatch = ThunkDispatch<State, unknown, UnknownAction>;

const { selectAccountEntries } = accountsSlice.getSelectors((state: State) => state.accountEntries);

const format = (unit: Unit | undefined, amount: string) =>
  unit
    ? formatCurrencyUnit(unit, new BigNumber(amount), { showCode: true, disableRounding: true })
    : amount;

/** The default unit of each asset: coins from the registry, tokens from CAL as they resolve. */
function useAssetUnits(assetIds: readonly string[], dispatch: Dispatch) {
  const [tokenUnits, setTokenUnits] = useState<Record<string, Unit>>({});

  const tokenIds = useMemo(
    () => assetIds.filter(id => !CRYPTO_CURRENCIES_REGISTRY[id] && !tokenUnits[id]),
    [assetIds, tokenUnits],
  );

  useEffect(() => {
    const queries = tokenIds.map(id => {
      const query = dispatch(cryptoAssetsApi.endpoints.findTokenById.initiate({ id }));
      query
        .unwrap()
        .then(token => {
          if (token) setTokenUnits(units => ({ ...units, [id]: token.units[0] }));
        })
        .catch(() => undefined);
      return query;
    });
    return () => queries.forEach(query => query.unsubscribe());
  }, [tokenIds, dispatch]);

  return useCallback(
    (assetId: string): Unit | undefined =>
      CRYPTO_CURRENCIES_REGISTRY[assetId]?.units[0] ?? tokenUnits[assetId],
    [tokenUnits],
  );
}

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
        balance: format(unit, balance),
        spendableBalance: spendableBalance === balance ? undefined : format(unit, spendableBalance),
        empty: balance === "0",
      };
    };
    return entries.map(({ accountUUID, descriptor }) => {
      const status = statuses?.[accountUUID];
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
