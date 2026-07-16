import { useCallback, useEffect, useMemo, useRef } from "react";
import VersionNumber from "react-native-version-number";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { useSearchCommon } from "@ledgerhq/live-common/modularDrawer/hooks/useSearch";
import { useCurrenciesUnderFeatureFlag } from "@ledgerhq/live-common/modularDrawer/hooks/useCurrenciesUnderFeatureFlag";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { useFeature } from "@features/platform-feature-flags";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { mapDadaMarketToDisplayData } from "LLM/features/GlobalSearch/utils/mapDadaMarketToDisplayData";
import { track } from "~/analytics";
import { ScreenName } from "~/const";
import { useSelector } from "~/context/hooks";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { useLocale, useTranslation } from "~/context/Locale";

const PRODUCT = "llm";
const SEARCH_DEBOUNCE_MS = 300;

export type GlobalSearchResults = {
  search: string;
  setSearch: (value: string) => void;
  clearSearch: () => void;
  isSearchActive: boolean;
  searchResults: MarketAssetDisplayData[];
  isLoadingSearch: boolean;
  hasNoResults: boolean;
  hasError: boolean;
};

export function useGlobalSearchResults(): GlobalSearchResults {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const counterValueUnit = counterValueCurrency.units[0];
  const { rate: usdToFiatRate, status: rateStatus } = useUsdToFiatRate(counterValueCurrency.ticker);
  const version = VersionNumber.appVersion ?? "";

  const modularDrawer = useFeature("llmModularDrawer");
  const isStaging = modularDrawer?.params?.backendEnvironment === "STAGING";
  const includeTestNetworks = useEnv("MANAGER_DEV_MODE");
  // Hide currencies disabled by a feature flag, mirroring the receive flow.
  const { deactivatedCurrencyIds } = useCurrenciesUnderFeatureFlag();

  const handleTrackSearch = useCallback(
    (query: string) => track("search_query", { query, page: ScreenName.GlobalSearch }),
    [],
  );
  const { handleSearch, handleDebouncedChange, displayedValue } = useSearchCommon({
    onTrackSearch: handleTrackSearch,
  });

  const search = displayedValue ?? "";
  const normalized = search.trim();
  const isSearchActive = normalized.length > 0;

  const debounced = useDebounce(search, SEARCH_DEBOUNCE_MS);
  const query = isSearchActive ? debounced.trim() : "";
  const isDebouncing = isSearchActive && query !== normalized;

  const previousQuery = useRef("");
  useEffect(() => {
    handleDebouncedChange(query, previousQuery.current);
    previousQuery.current = query;
  }, [query, handleDebouncedChange]);

  const { data, isLoading, isError } = useAssetsData({
    product: PRODUCT,
    version,
    search: query,
    skip: query.length === 0,
    isStaging,
    includeTestNetworks,
  });

  const searchResults = useMemo<MarketAssetDisplayData[]>(() => {
    if (!data || query.length === 0) return [];

    return data.currenciesOrder.metaCurrencyIds.flatMap(id => {
      const meta = data.cryptoAssets[id];
      if (!meta) return [];
      // Drop an asset whose every network currency is disabled by a feature flag.
      const networks = Object.keys(meta.assetsIds);
      if (networks.length > 0 && networks.every(network => deactivatedCurrencyIds.has(network))) {
        return [];
      }
      const currency = selectCurrencyForMetaId(id, data);
      if (!currency) return [];

      return [
        mapDadaMarketToDisplayData(
          { id: meta.id, name: meta.name, ticker: meta.ticker, ledgerId: currency.id },
          data.markets[currency.id],
          { counterCurrency, counterValueUnit, usdToFiatRate, locale, t },
        ),
      ];
    });
  }, [
    data,
    query,
    deactivatedCurrencyIds,
    counterCurrency,
    counterValueUnit,
    usdToFiatRate,
    locale,
    t,
  ]);

  const isLoadingSearch = isSearchActive && (isDebouncing || isLoading || rateStatus === "loading");
  const clearSearch = useCallback(() => handleSearch(""), [handleSearch]);

  return {
    search,
    setSearch: handleSearch,
    clearSearch,
    isSearchActive,
    searchResults,
    isLoadingSearch,
    hasError: isSearchActive && !isLoadingSearch && isError,
    hasNoResults:
      isSearchActive &&
      !isLoadingSearch &&
      !isError &&
      data !== undefined &&
      searchResults.length === 0,
  };
}
