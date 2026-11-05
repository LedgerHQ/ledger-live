import { useMemo } from "react";
import { shallowEqual } from "react-redux";
import type { AnalyticsCatalogState } from "@features/flow-account-analytics";
import { useChunkedAssetsData } from "@features/platform-aggregated-assets";
import { getAccountCurrency } from "@ledgerhq/ledger-wallet-framework/account";
import { useSelector } from "LLD/hooks/redux";
import { accountsSelector } from "~/renderer/reducers/accounts";
import {
  blacklistedTokenIdsSelector,
  confirmationsNbForCurrencySelector,
} from "~/renderer/reducers/settings";
import { useBatchMaybeAccountName } from "~/renderer/reducers/wallet";
import {
  buildAnalyticsCatalog,
  selectEligibleAnalyticsPositions,
} from "../utils/buildAnalyticsCatalog";

const EMPTY_CATALOG: AnalyticsCatalogState = {
  status: "ready",
  data: { assets: [], accounts: [], positions: [] },
};

export function useAnalyticsCatalogAdapter() {
  const accounts = useSelector(accountsSelector);
  const blacklisted = useSelector(blacklistedTokenIdsSelector);
  const names = useBatchMaybeAccountName(accounts);
  const namesById = useMemo(
    () => Object.fromEntries(accounts.map((account, index) => [account.id, names[index]])),
    [accounts, names],
  );
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
  const positions = useMemo(
    () => selectEligibleAnalyticsPositions(accounts, blacklisted, confirmations),
    [accounts, blacklisted, confirmations],
  );
  const currencyIds = useMemo(
    () => [...new Set(positions.map(position => getAccountCurrency(position).id))],
    [positions],
  );
  const isEmpty = currencyIds.length === 0;
  const { data, isSuccess, isError, refetch } = useChunkedAssetsData({
    currencyIds,
    product: "lld",
    version: __APP_VERSION__,
    skip: isEmpty,
  });
  const catalog = useMemo<AnalyticsCatalogState>(() => {
    if (isEmpty) return EMPTY_CATALOG;
    if (isSuccess && data)
      return {
        status: "ready",
        data: buildAnalyticsCatalog(positions, accounts, namesById, data),
      };
    return { status: isError ? "error" : "loading" };
  }, [isEmpty, isSuccess, data, isError, positions, accounts, namesById]);
  return { catalog, positions, refreshCatalog: isEmpty ? undefined : refetch };
}
