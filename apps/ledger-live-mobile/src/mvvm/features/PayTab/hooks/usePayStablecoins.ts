import { useMemo } from "react";
import VersionNumber from "react-native-version-number";
import useEnv from "@features/platform-env";
import {
  useStablecoinTickers,
  useDefaultStablecoins,
  type DefaultStablecoin,
} from "@features/platform-aggregated-assets";
import {
  useCategorizedAssets,
  type CategorizedAssetItem,
} from "@ledgerhq/asset-aggregation/assetCategorization/index";
import { useDistribution } from "~/actions/general";
import { useSelector } from "~/context/hooks";
import { blacklistedTokenIdsSelector } from "~/reducers/settings";

export type PayStablecoins = Readonly<{
  stablecoins: CategorizedAssetItem[];
  defaultStablecoins: DefaultStablecoin[];
  isLoading: boolean;
  isError: boolean;
}>;

export function usePayStablecoins(): PayStablecoins {
  const hideEmptyTokenAccount = useEnv("HIDE_EMPTY_TOKEN_ACCOUNTS");
  const blacklistedTokenIds = useSelector(blacklistedTokenIdsSelector);
  const version = VersionNumber.appVersion ?? "";

  const distribution = useDistribution({
    showEmptyAccounts: true,
    hideEmptyTokenAccount,
    groupBy: "asset",
  });

  const {
    tickers: stablecoinTickers,
    isLoading: isLoadingStablecoinTickers,
    isError: isStablecoinTickersError,
  } = useStablecoinTickers("llm", version);

  const {
    defaultStablecoins,
    isLoading: isLoadingDefaultStablecoins,
    isError: isDefaultStablecoinsError,
  } = useDefaultStablecoins("llm", version);

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
