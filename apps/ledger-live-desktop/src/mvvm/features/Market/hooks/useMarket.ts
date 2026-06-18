import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { MarketListRequestParams, Order } from "@ledgerhq/live-common/market/utils/types";
import { rangeDataTable } from "@ledgerhq/live-common/cg-client/utils/rangeDataTable";
import { useMarketDataProvider } from "@ledgerhq/live-common/cg-client/hooks/useCoingeckoDataProvider";
import { useMarketData as useMarketDataHook } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { applyUsdRateToMarket } from "@ledgerhq/live-common/market/utils/applyUsdRateToMarket";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setMarketCurrentPage, setMarketOptions } from "~/renderer/actions/market";
import { useInitSupportedCounterValues } from "~/renderer/hooks/useInitSupportedCounterValues";
import { marketCurrentPageSelector, marketParamsSelector } from "~/renderer/reducers/market";
import {
  counterValueCurrencySelector,
  localeSelector,
  starredMarketCoinsSelector,
} from "~/renderer/reducers/settings";
import {
  BASIC_REFETCH,
  REFETCH_TIME_ONE_MINUTE,
  getCurrentPage,
  isDataStale,
} from "~/renderer/screens/market/utils";
import { addStarredMarketCoins, removeStarredMarketCoins } from "~/renderer/actions/settings";
import { useMarketCategories } from "LLD/features/Market/hooks/useMarketCategories";
import {
  getMarketCategoriesParam,
  isBuiltInMarketListCategory,
} from "@ledgerhq/live-common/market/utils/category";

export function useMarket() {
  const lldRefreshMarketDataFeature = useFeature("lldRefreshMarketData");
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const marketParams = useSelector(marketParamsSelector);
  const marketCurrentPage = useSelector(marketCurrentPageSelector);
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const locale = useSelector(localeSelector);
  const settingsCounterValue = useSelector(counterValueCurrencySelector).ticker.toLowerCase();

  const REFRESH_RATE =
    Number(lldRefreshMarketDataFeature?.params?.refreshTime) > 0
      ? REFETCH_TIME_ONE_MINUTE * Number(lldRefreshMarketDataFeature?.params?.refreshTime)
      : REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH;

  const { range, starred = [], liveCompatible, order, search = "" } = marketParams;

  const categories = useMarketCategories();

  useInitSupportedCounterValues();

  const { supportedCounterCurrencies } = useMarketDataProvider();

  const { shouldDisplayMarketBanner: filterBySupported, shouldDisplayAssetDiscoverability } =
    useWalletFeaturesConfig("desktop");

  // When asset discoverability is on, the category bar is the source of truth for
  // the starred / stocks lists; otherwise we keep the legacy `starred` param behaviour.
  const isStarredCategory =
    shouldDisplayAssetDiscoverability && categories.selectedCategory === "starred";
  const isStocksCategory =
    shouldDisplayAssetDiscoverability && categories.selectedCategory === "stocks";
  const isTrendingCategory =
    shouldDisplayAssetDiscoverability && !isBuiltInMarketListCategory(categories.selectedCategory);

  const starFilterOn = isStarredCategory || starred.length > 0;

  const shouldDisplayLiveCompatible = filterBySupported || marketParams.liveCompatible;

  // The markets endpoint only serves the fiats CoinGecko lists as supported. For
  // anything else (e.g. COP) we fetch in USD and rescale by the USD->countervalue
  // spot rate. While the supported list is still loading we keep the user's counter
  // value, and only fall back to usd once we know it is unsupported — otherwise a
  // request fires with usd first.
  const isCounterValueUnsupported =
    !!supportedCounterCurrencies && !supportedCounterCurrencies.includes(settingsCounterValue);
  const needsUsdFallback = shouldDisplayAssetDiscoverability && isCounterValueUnsupported;
  const discoverabilityCounterCurrency = isCounterValueUnsupported ? "usd" : settingsCounterValue;
  // Counter value sent to the markets endpoint (usd on fallback so the request succeeds).
  const requestCounterCurrency = shouldDisplayAssetDiscoverability
    ? discoverabilityCounterCurrency
    : marketParams.counterCurrency;
  // Counter value used to format the rows. The request may have used usd as a
  // fallback, but the values are rescaled back into the user's counter value.
  const displayCounterCurrency = shouldDisplayAssetDiscoverability
    ? settingsCounterValue
    : marketParams.counterCurrency;

  // Passing "usd" short-circuits the rate hook to 1 without firing a request, so
  // natively served counter values incur no extra network call.
  const { rate: usdToCounterValueRate, status: rateStatus } = useUsdToFiatRate(
    needsUsdFallback ? settingsCounterValue : "usd",
  );
  // Withhold a rate until it resolves so we never render USD numbers formatted with
  // the counter value's unit. `null` defers the conversion (rows stay empty + loading).
  const rate = needsUsdFallback ? usdToCounterValueRate : 1;

  const resolvedMarketParams = { ...marketParams, counterCurrency: displayCounterCurrency };

  const marketResult = useMarketDataHook({
    ...marketParams,
    counterCurrency: requestCounterCurrency,
    starred: starFilterOn ? starredMarketCoins : starred,
    liveCompatible: shouldDisplayLiveCompatible,
    filter: marketParams.filter,
    categories: shouldDisplayAssetDiscoverability
      ? getMarketCategoriesParam(categories.selectedCategory)
      : undefined,
  });

  const timeRanges = useMemo(
    () =>
      Object.keys(rangeDataTable)
        .filter(k => k !== "1h")
        .map(key => ({ value: key, label: t(`market.range.${rangeDataTable[key].label}`) }))
        .reverse(),
    [t],
  );

  const timeRangeValue = timeRanges.find(({ value }) => value === range);

  // Full-word labels ("1 day", "1 week"…) for the Lumen Select pill (asset discoverability).
  const timeRangeSelectOptions = useMemo(
    () =>
      timeRanges.map(({ value }) => ({
        value,
        label: t(`market.range.${rangeDataTable[value].label.replace("_label", "_fullLabel")}`),
      })),
    [t, timeRanges],
  );

  // The backend drops the `starred` filter when the list is empty (it then returns
  // the full list), so with no favorites we must show the empty state instead.
  const isFavoritesEmpty = isStarredCategory && starredMarketCoins.length === 0;
  const emptyState = isFavoritesEmpty ? ("favorites" as const) : undefined;

  // Rescale USD-fetched rows into the user's counter value. `applyUsdRateToMarket`
  // is a no-op when `rate === 1`, so natively served data passes through unchanged.
  const rescaledData = useMemo(
    () => (rate == null ? [] : marketResult.data.map(item => applyUsdRateToMarket(item, rate))),
    [marketResult.data, rate],
  );

  const marketData = isFavoritesEmpty ? [] : rescaledData;

  const isRateLoading = needsUsdFallback && rateStatus === "loading";
  const isRateError = needsUsdFallback && rateStatus === "error";
  const currenciesLength = marketData.length;
  const loading = !isFavoritesEmpty && (marketResult.isLoading || isRateLoading);
  const isError = marketResult.isError || isRateError;
  const freshLoading = loading && !currenciesLength;

  // Identity of the underlying list (everything but the page cursor). When it changes the user
  // switched list (category/sort/range/search/filter…), so pagination must re-arm and the scroll
  // must jump back to the top. It intentionally excludes `page`, so paginating/refetching the same
  // list does not trigger a reset.
  const listKey = [
    categories.selectedCategory,
    order,
    range,
    requestCounterCurrency,
    search,
    String(shouldDisplayLiveCompatible),
    String(starFilterOn),
  ].join("|");
  // The extra row is the "show all" affordance, only relevant for the unfiltered list.
  const itemCount =
    starFilterOn || isStocksCategory || isTrendingCategory || search.length > 0
      ? currenciesLength
      : currenciesLength + 1;

  const setCounterCurrency = useCallback(
    (ticker: string) => {
      dispatch(
        setMarketOptions({
          counterCurrency: supportedCounterCurrencies?.includes(ticker.toLowerCase())
            ? ticker
            : "usd",
        }),
      );
    },
    [dispatch, supportedCounterCurrencies],
  );

  const refresh = useCallback(
    (payload: MarketListRequestParams) => {
      dispatch(setMarketOptions(payload));
    },
    [dispatch],
  );

  const resetSearch = useCallback(() => refresh({ search: "" }), [refresh]);

  const resetMarketPageToInital = (page: number) => {
    if (page > 1) {
      dispatch(setMarketOptions({ page: 1 }));
      dispatch(setMarketCurrentPage(1));
    }
  };

  const onLoadNextPage = useCallback(() => {
    dispatch(setMarketOptions({ page: (marketParams?.page || 1) + 1 }));
  }, [dispatch, marketParams?.page]);

  const updateSearch = useCallback(
    (value: string) => {
      refresh({ search: value });
    },
    [refresh],
  );

  const updateTimeRange = useCallback(
    (e: { value: string; label: string } | null) => {
      if (!e) return;
      const { value } = e;
      refresh({ range: value });
    },
    [refresh],
  );

  const toggleFilterByStarredAccounts = useCallback(() => {
    // With the category bar on, the starred shortcut maps to the All/Starred categories.
    if (shouldDisplayAssetDiscoverability) {
      categories.onSelectCategory(isStarredCategory ? "all" : "starred");
      return;
    }
    if (starredMarketCoins.length > 0 || starFilterOn) {
      const starred = starFilterOn ? [] : starredMarketCoins;
      refresh({ starred, page: 1 });
    }
  }, [
    categories,
    isStarredCategory,
    refresh,
    shouldDisplayAssetDiscoverability,
    starFilterOn,
    starredMarketCoins,
  ]);

  const toggleLiveCompatible = useCallback(() => {
    refresh({ liveCompatible: !liveCompatible });
  }, [liveCompatible, refresh]);

  const toggleStar = useCallback(
    (id: string, isStarred: boolean) => {
      if (isStarred) {
        dispatch(removeStarredMarketCoins(id));
      } else {
        dispatch(addStarredMarketCoins(id));
      }
    },
    [dispatch],
  );

  const toggleSortBy = useCallback(() => {
    refresh({
      order: order === Order.MarketCapAsc ? Order.MarketCapDesc : Order.MarketCapAsc,
    });
  }, [order, refresh]);

  /**
   *
   * Refresh mechanism ----------------------------------------------
   */

  const refetchData = useCallback(
    (pageToRefetch: number) => {
      const page = pageToRefetch - 1 || 0;
      const elem = marketResult.cachedMetadataMap.get(String(page));
      if (elem && isDataStale(elem.updatedAt, REFRESH_RATE)) {
        elem.refetch();
      }
    },
    [marketResult.cachedMetadataMap, REFRESH_RATE],
  );

  const checkIfDataIsStaleAndRefetch = useCallback(
    (scrollPosition: number) => {
      const newCurrentPage = getCurrentPage(scrollPosition, marketParams.limit || 50);

      if (marketCurrentPage !== newCurrentPage) {
        dispatch(setMarketCurrentPage(newCurrentPage));
      }

      refetchData(newCurrentPage);
    },
    [marketParams.limit, marketCurrentPage, refetchData, dispatch],
  );

  /**
   *
   * ----------------------------------------------
   */

  return {
    onLoadNextPage,
    toggleLiveCompatible,
    toggleFilterByStarredAccounts,
    toggleSortBy,
    toggleStar,
    updateSearch,
    updateTimeRange,
    refresh,
    resetSearch,
    setCounterCurrency,
    checkIfDataIsStaleAndRefetch,
    resetMarketPage: resetMarketPageToInital,
    refetchData,
    freshLoading,
    supportedCounterCurrencies,
    t,
    liveCompatible,
    starFilterOn,
    marketData,
    categories,
    shouldDisplayAssetDiscoverability,
    emptyState,
    starredMarketCoins,
    timeRanges,
    timeRangeSelectOptions,
    marketParams: resolvedMarketParams,
    marketCurrentPage,
    timeRangeValue,
    itemCount,
    locale,
    loading,
    isError,
    currenciesLength,
    listKey,
    refreshRate: REFRESH_RATE,
  };
}
