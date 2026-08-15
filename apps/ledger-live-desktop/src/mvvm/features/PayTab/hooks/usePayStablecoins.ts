import { useMemo } from "react";
import { useDistribution } from "~/renderer/actions/general";
import {
  useStablecoinTickers,
  useDefaultStablecoins,
  type DefaultStablecoin,
} from "@features/platform-aggregated-assets";
import {
  useCategorizedAssets,
  type CategorizedAssetItem,
} from "@ledgerhq/asset-aggregation/assetCategorization/index";
import { useSelector } from "LLD/hooks/redux";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";

export type PayStablecoins = Readonly<{
  stablecoins: CategorizedAssetItem[];
  defaultStablecoins: DefaultStablecoin[];
  isLoading: boolean;
  isError: boolean;
}>;

export function usePayStablecoins(): PayStablecoins {
  const hideEmptyTokenAccount = useSelector(hideEmptyTokenAccountsSelector);
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);

  // Force cross-chain asset grouping so each stablecoin is a single aggregated item,
  // independent of the aggregatedAssets wallet flag.
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

  const categorized = useCategorizedAssets(distribution, stablecoinTickers);

  const stablecoins = useMemo(() => {
    const blacklist = new Set(blacklistedTokenIds ?? []);
    return categorized.stablecoins.filter(({ currency }) => !blacklist.has(currency.id));
  }, [categorized.stablecoins, blacklistedTokenIds]);

  return {
    stablecoins,
    defaultStablecoins,
    isLoading: isLoadingStablecoinTickers || isLoadingDefaultStablecoins || distribution.isLoading,
    isError: isStablecoinTickersError || isDefaultStablecoinsError,
  };
}
