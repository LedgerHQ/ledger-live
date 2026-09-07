import { useMemo } from "react";
import { getAccountCurrency } from "@ledgerhq/live-common/account/index";
import type { AccountLike } from "@ledgerhq/types-live";
import { useDistribution } from "~/renderer/actions/general";
import {
  useStablecoinTickers,
  useDefaultStablecoins,
  type DefaultStablecoin,
} from "@features/platform-aggregated-assets";
import { useCategorizedAssets } from "@ledgerhq/asset-aggregation/assetCategorization/index";
import {
  buildStablecoinHoldings,
  type HeldAccount,
  type StablecoinItem,
} from "@features/flow-pay-balance";
import { useSelector } from "LLD/hooks/redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";

export type PayStablecoins = Readonly<{
  stablecoins: StablecoinItem[];
  defaultStablecoins: DefaultStablecoin[];
  isLoading: boolean;
  isError: boolean;
}>;

function toHeldAccount(account: AccountLike): HeldAccount {
  const currency = getAccountCurrency(account);
  return {
    type: account.type,
    balance: account.balance.toNumber(),
    currency: {
      id: currency.id,
      name: currency.name,
      ticker: currency.ticker,
      units: currency.units.map(unit => ({
        name: unit.name,
        code: unit.code,
        magnitude: unit.magnitude,
      })),
    },
  };
}

export function usePayStablecoins(): PayStablecoins {
  const hideEmptyTokenAccount = useSelector(hideEmptyTokenAccountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const heldAccounts = useSelector(flattenAccountsSelector);

  // groupBy: "asset" aggregates each ticker across chains into one row.
  // This path does not read the aggregatedAssets wallet flag.
  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
    groupBy: "asset",
  });

  const {
    tickers: stablecoinTickers,
    isLoading: isLoadingStablecoinTickers,
    isError: isStablecoinTickersError,
  } = useStablecoinTickers("lld", __APP_VERSION__);

  const {
    defaultStablecoins,
    isLoading: isLoadingDefaultStablecoins,
    isError: isDefaultStablecoinsError,
  } = useDefaultStablecoins("lld", __APP_VERSION__);

  const { stablecoins: catalogStablecoins } = useCategorizedAssets(distribution, stablecoinTickers);

  const stablecoins = useMemo(
    () =>
      buildStablecoinHoldings({
        catalog: catalogStablecoins,
        heldAccounts: heldAccounts.map(toHeldAccount),
        blacklistedTokenIds,
        stablecoinTickers,
        isLoadingStablecoinTickers,
      }),
    [
      catalogStablecoins,
      heldAccounts,
      blacklistedTokenIds,
      stablecoinTickers,
      isLoadingStablecoinTickers,
    ],
  );

  return {
    stablecoins,
    defaultStablecoins,
    isLoading: isLoadingStablecoinTickers || isLoadingDefaultStablecoins || distribution.isLoading,
    isError: isStablecoinTickersError || isDefaultStablecoinsError,
  };
}
