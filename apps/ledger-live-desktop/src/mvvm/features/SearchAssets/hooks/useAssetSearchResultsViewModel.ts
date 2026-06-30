import { useMemo } from "react";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { mapAssetsDataToMarketCurrencies } from "../utils/mapAssetsDataToMarketCurrencies";

type Params = {
  search?: string;
  skip?: boolean;
};

type Result = {
  data: MarketCurrencyData[];
  isLoading: boolean;
  isError: boolean;
  loadNext?: () => void;
  hasNextPage: boolean;
  isFetchingNextPage: boolean;
};

export function useAssetSearchResultsViewModel({ search, skip }: Params): Result {
  const counterCurrency = useSelector(counterValueCurrencySelector).ticker;

  const modularDrawer = useFeature("lldModularDrawer");
  const isStaging = modularDrawer?.params?.backendEnvironment === "STAGING";
  const includeTestNetworks = useEnv("MANAGER_DEV_MODE");

  const { data, isLoading, isError, loadNext, isFetchingNextPage } = useAssetsData({
    product: "lld",
    version: __APP_VERSION__,
    search,
    skip,
    isStaging,
    includeTestNetworks,
  });

  const { status: rateStatus, rate } = useUsdToFiatRate(counterCurrency);

  // Hide currencies disabled by a feature flag, mirroring the receive flow.
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();

  const results = useMemo<MarketCurrencyData[]>(
    () => mapAssetsDataToMarketCurrencies(data, rate ?? 1, deactivatedCurrencyIds),
    [data, rate, deactivatedCurrencyIds],
  );

  const hasData = !!data;

  return useMemo(
    () => ({
      data: results,
      isLoading: isLoading || (hasData && rateStatus === "loading"),
      isError: isError || (hasData && rateStatus === "error"),
      loadNext,
      hasNextPage: !!loadNext,
      isFetchingNextPage,
    }),
    [results, isLoading, isError, hasData, rateStatus, loadNext, isFetchingNextPage],
  );
}
