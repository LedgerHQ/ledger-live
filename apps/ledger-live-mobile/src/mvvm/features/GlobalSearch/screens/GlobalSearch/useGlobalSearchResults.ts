import { useCallback, useEffect, useMemo, useRef } from "react";
import VersionNumber from "react-native-version-number";
import { useAssetsData } from "@ledgerhq/live-common/dada-client/hooks/useAssetsData";
import { selectCurrencyForMetaId } from "@ledgerhq/live-common/dada-client/utils/currencySelection";
import { useSearchCommon } from "@ledgerhq/live-common/modularDrawer/hooks/useSearch";
import { useDebounce } from "@ledgerhq/live-common/hooks/useDebounce";
import type { MarketAssetDisplayData } from "LLM/components/AssetListItem";
import { mapDadaMarketToDisplayData } from "LLM/features/GlobalSearch/utils/mapDadaMarketToDisplayData";
import { track } from "~/analytics";
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
};

export function useGlobalSearchResults(): GlobalSearchResults {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const counterValueUnit = counterValueCurrency.units[0];
  const version = VersionNumber.appVersion ?? "";

  const handleTrackSearch = useCallback((query: string) => track("search_query", { query }), []);
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
  });

  const searchResults = useMemo<MarketAssetDisplayData[]>(() => {
    if (!data || query.length === 0) return [];

    return data.currenciesOrder.metaCurrencyIds.flatMap(id => {
      const meta = data.cryptoAssets[id];
      if (!meta) return [];
      const currency = selectCurrencyForMetaId(id, data);
      if (!currency) return [];

      return [
        mapDadaMarketToDisplayData(
          { id: meta.id, name: meta.name, ticker: meta.ticker, ledgerId: currency.id },
          data.markets[currency.id],
          { counterCurrency, counterValueUnit, locale, t },
        ),
      ];
    });
  }, [data, query, counterCurrency, counterValueUnit, locale, t]);

  const isLoadingSearch = isSearchActive && (isDebouncing || isLoading);
  const clearSearch = useCallback(() => handleSearch(""), [handleSearch]);

  return {
    search,
    setSearch: handleSearch,
    clearSearch,
    isSearchActive,
    searchResults,
    isLoadingSearch,
    hasNoResults:
      isSearchActive &&
      !isLoadingSearch &&
      !isError &&
      data !== undefined &&
      searchResults.length === 0,
  };
}
