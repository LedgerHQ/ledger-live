import { useMemo } from "react";
import { useDistribution } from "~/renderer/actions/general";
import {
  useStablecoinTickers,
  selectTopAssetsByCategory,
} from "@features/platform-aggregated-assets";
import {
  useGetAssetsDataInfiniteQuery,
  AssetCategory,
  mergeAssetsDataPages,
} from "@domain/api-aggregated-assets";
import {
  useCategorizedAssets,
  type CategorizedAssetItem,
} from "@ledgerhq/asset-aggregation/assetCategorization/index";
import { useSelector } from "LLD/hooks/redux";
import {
  blacklistedTokenIdsSelector,
  hideEmptyTokenAccountsSelector,
} from "~/renderer/reducers/settings";

const STABLECOIN_CATEGORIES = [AssetCategory.Stablecoins];

// Always-offered rows, taken from the top of the market-cap-ordered stablecoins (USDC/USDT).
const DEFAULT_STABLECOIN_COUNT = 2;

export type DefaultStablecoin = Readonly<{
  id: string;
  ticker: string;
  name: string;
  magnitude: number;
}>;

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
    data: stablecoinAssets,
    isLoading: isLoadingStablecoinAssets,
    isError: isStablecoinAssetsError,
  } = useGetAssetsDataInfiniteQuery({
    categories: STABLECOIN_CATEGORIES,
    product: "lld",
    version: __APP_VERSION__,
  });

  const categorized = useCategorizedAssets(distribution, stablecoinTickers);

  const stablecoins = useMemo(() => {
    const blacklist = new Set(blacklistedTokenIds ?? []);
    return categorized.stablecoins.filter(({ currency }) => !blacklist.has(currency.id));
  }, [categorized.stablecoins, blacklistedTokenIds]);

  const defaultStablecoins = useMemo<DefaultStablecoin[]>(() => {
    const merged = mergeAssetsDataPages(stablecoinAssets?.pages);
    if (!merged) return [];
    const { stablecoins: top } = selectTopAssetsByCategory(merged, stablecoinTickers, {
      maxCryptos: 0,
      maxStablecoins: DEFAULT_STABLECOIN_COUNT,
    });
    return top.map(({ currency }) => ({
      id: currency.id,
      ticker: currency.ticker,
      name: currency.name,
      magnitude: currency.units[0]?.magnitude ?? 0,
    }));
  }, [stablecoinAssets, stablecoinTickers]);

  return {
    stablecoins,
    defaultStablecoins,
    isLoading: isLoadingStablecoinTickers || isLoadingStablecoinAssets || distribution.isLoading,
    isError: isStablecoinTickersError || isStablecoinAssetsError,
  };
}
