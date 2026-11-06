import { useCallback, useMemo } from "react";
import { shallowEqual } from "react-redux";
import {
  createAnalyticsCatalogState,
  indexAnalyticsAccountNames,
  selectAnalyticsCurrencyIds,
  selectEligibleAnalyticsPositions,
} from "@features/flow-account-analytics";
import { useChunkedAssetsData } from "@features/platform-aggregated-assets";
import { isConfirmedOperation } from "@ledgerhq/ledger-wallet-framework/operation";
import type { Account, Operation } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  blacklistedTokenIdsSelector,
  confirmationsNbForCurrencySelector,
} from "~/renderer/reducers/settings";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";

export function useAnalyticsCatalogAdapter() {
  const accounts = useSelector(accountsSelector);
  const blacklisted = useSelector(blacklistedTokenIdsSelector);
  const names = useBatchMaybeAccountName(accounts);
  const namesById = useMemo(() => indexAnalyticsAccountNames(accounts, names), [accounts, names]);
  const accountCurrencies = useMemo(
    () => [...new Map(accounts.map(account => [account.currency.id, account.currency])).values()],
    [accounts],
  );
  const confirmations = useSelector(
    state =>
      Object.fromEntries(
        accountCurrencies.map(currency => [
          currency.id,
          confirmationsNbForCurrencySelector(state, { currency }),
        ]),
      ),
    shallowEqual,
  );
  const isConfirmed = useCallback(
    (operation: Operation, account: Account) =>
      isConfirmedOperation(operation, account, confirmations[account.currency.id]),
    [confirmations],
  );
  const positions = useMemo(
    () => selectEligibleAnalyticsPositions(accounts, blacklisted, isConfirmed),
    [accounts, blacklisted, isConfirmed],
  );
  const currencyIds = useMemo(() => selectAnalyticsCurrencyIds(positions), [positions]);
  const isEmpty = currencyIds.length === 0;
  const assets = useChunkedAssetsData({
    currencyIds,
    product: "lld",
    version: __APP_VERSION__,
    skip: isEmpty,
  });
  const { data, isSuccess, isError, refetch } = assets;
  const catalog = useMemo(
    () =>
      createAnalyticsCatalogState({
        positions,
        accounts,
        namesById,
        assets: { data, isSuccess, isError },
      }),
    [positions, accounts, namesById, data, isSuccess, isError],
  );
  return { catalog, positions, refreshCatalog: isEmpty ? undefined : refetch };
}
