import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { MarketListRequestParams, Order } from "@ledgerhq/live-common/market/utils/types";
import { rangeDataTable } from "@ledgerhq/live-common/cg-client/utils/rangeDataTable";
import { useMarketData as useMarketDataHook } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useUsdToFiatRate } from "@ledgerhq/live-common/counterValues/hooks/useUsdToFiatRate";
import { applyUsdRateToMarket } from "@ledgerhq/live-common/market/utils/applyUsdRateToMarket";
import { useResolveMarketCounterCurrency } from "@ledgerhq/live-common/market/hooks/useResolveMarketCounterCurrency";
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
import { track } from "~/renderer/analytics/segment";
import { getCurrentTrackingPage } from "~/renderer/analytics/screenRefs";
import { useMarketCategories } from "LLD/features/Market/hooks/useMarketCategories";
import {
  getMarketCategoriesParam,
  isBuiltInMarketListCategory,
  type MarketListCategory,
} from "@ledgerhq/live-common/market/utils/category";

const MARKET_PAGE_RESET_KEYS = new Set<keyof MarketListRequestParams>([
  "order",
  "search",
  "range",
  "starred",
  "liveCompatible",
  "filter",
]);

function shouldResetMarketPage(payload: MarketListRequestParams): boolean {
  for (const key of MARKET_PAGE_RESET_KEYS) {
    if (key in payload) return true;
  }
  return false;
}

function getDiscoverabilityCategoryFlags(enabled: boolean, selectedCategory: MarketListCategory) {
  if (!enabled) {
    return {
      isStarredCategory: false,
      isStocksCategory: false,
      isTrendingCategory: false,
    };
  }
  return {
    isStarredCategory: selectedCategory === "starred",
    isStocksCategory: selectedCategory === "stocks",
    isTrendingCategory: !isBuiltInMarketListCategory(selectedCategory),
  };
}

function resolveRefreshRate(refreshTimeParam: number | undefined): number {
  const multiplier = Number(refreshTimeParam);
  return multiplier > 0
    ? REFETCH_TIME_ONE_MINUTE * multiplier
    : REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH;
}

function getMarketItemCount(
  currenciesLength: number,
  starFilterOn: boolean,
  isStocksCategory: boolean,
  isTrendingCategory: boolean,
  searchLength: number,
): number {
  if (starFilterOn || isStocksCategory || isTrendingCategory || searchLength > 0) {
    return currenciesLength;
  }
  return currenciesLength + 1;
}

export function useMarket() {
  const lldRefreshMarketDataFeature = useFeature("lldRefreshMarketData");
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const marketParams = useSelector(marketParamsSelector);
  const marketCurrentPage = useSelector(marketCurrentPageSelector);
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const locale = useSelector(localeSelector);
  const settingsCounterValue = useSelector(counterValueCurrencySelector).ticker.toLowerCase();

  const REFRESH_RATE = resolveRefreshRate(lldRefreshMarketDataFeature?.params?.refreshTime);

  const { range, starred = [], liveCompatible, order, search = "" } = marketParams;

  const categories = useMarketCategories();

  useInitSupportedCounterValues();

  const {
    requestCounterCurrency: resolvedRequestCounterCurrency,
    displayCounterCurrency: resolvedDisplayCounterCurrency = settingsCounterValue,
    needsUsdFallback: resolvedNeedsUsdFallback,
    isResolutionLoading,
    supportedCounterCurrencies,
  } = useResolveMarketCounterCurrency({
    counterCurrency: settingsCounterValue,
    fallbackForCryptoCountervalues: true,
  });

  const { shouldDisplayMarketBanner: filterBySupported, shouldDisplayAssetDiscoverability } =
    useWalletFeaturesConfig("desktop");

  // When asset discoverability is on, the category bar is the source of truth for
  // the starred / stocks lists; otherwise we keep the legacy `starred` param behaviour.
  const { isStarredCategory, isStocksCategory, isTrendingCategory } =
    getDiscoverabilityCategoryFlags(shouldDisplayAssetDiscoverability, categories.selectedCategory);

  const starFilterOn = isStarredCategory || starred.length > 0;

  const shouldDisplayLiveCompatible = filterBySupported || marketParams.liveCompatible;

  const needsUsdFallback = shouldDisplayAssetDiscoverability && resolvedNeedsUsdFallback;
  // Counter value sent to the markets endpoint (usd on fallback so the request succeeds).
  const requestCounterCurrency = shouldDisplayAssetDiscoverability
    ? resolvedRequestCounterCurrency
    : marketParams.counterCurrency;
  // Counter value used to format the rows. The request may have used usd as a
  // fallback, but the values are rescaled back into the user's counter value.
  const displayCounterCurrency = shouldDisplayAssetDiscoverability
    ? resolvedDisplayCounterCurrency
    : marketParams.counterCurrency;
  const shouldFetchMarketData = !shouldDisplayAssetDiscoverability || !isResolutionLoading;

  // Passing "usd" short-circuits the rate hook to 1 without firing a request, so
  // natively served counter values incur no extra network call.
  const { rate: usdToCounterValueRate, status: rateStatus } = useUsdToFiatRate(
    needsUsdFallback ? (displayCounterCurrency ?? "usd") : "usd",
    { skip: !shouldFetchMarketData },
  );
  // Withhold a rate until it resolves so we never render USD numbers formatted with
  // the counter value's unit. `null` defers the conversion (rows stay empty + loading).
  const rate = needsUsdFallback ? usdToCounterValueRate : 1;

  const resolvedMarketParams = { ...marketParams, counterCurrency: displayCounterCurrency };

  const marketResult = useMarketDataHook(
    {
      ...marketParams,
      counterCurrency: requestCounterCurrency,
      starred: starFilterOn ? starredMarketCoins : starred,
      liveCompatible: shouldDisplayLiveCompatible,
      filter: marketParams.filter,
      categories: shouldDisplayAssetDiscoverability
        ? getMarketCategoriesParam(categories.selectedCategory)
        : undefined,
    },
    { enabled: shouldFetchMarketData },
  );

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
  const rescaledData = useMemo(() => {
    if (isResolutionLoading || rate == null) return [];
    if (rate === 1) return marketResult.data;

    return marketResult.data.map(item => applyUsdRateToMarket(item, rate));
  }, [isResolutionLoading, marketResult.data, rate]);

  const marketData = isFavoritesEmpty ? [] : rescaledData;

  const isRateLoading = needsUsdFallback && rateStatus === "loading";
  const isRateError = needsUsdFallback && rateStatus === "error";
  const currenciesLength = marketData.length;
  const loading =
    !isFavoritesEmpty && (isResolutionLoading || marketResult.isLoading || isRateLoading);
  const isError = marketResult.isError || isRateError;
  const freshLoading =
    !isFavoritesEmpty &&
    (isResolutionLoading || marketResult.isLoading || marketResult.isFetching || isRateLoading) &&
    !currenciesLength;

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
    marketParams.filter ?? "",
    String(shouldDisplayLiveCompatible),
    String(starFilterOn),
  ].join("|");
  // The extra row is the "show all" affordance, only relevant for the unfiltered list.
  const itemCount = getMarketItemCount(
    currenciesLength,
    starFilterOn,
    isStocksCategory,
    isTrendingCategory,
    search.length,
  );

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
      const nextPayload = shouldResetMarketPage(payload) ? { ...payload, page: 1 } : payload;
      dispatch(setMarketOptions(nextPayload));
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
      track("button_clicked", {
        button: "favourite",
        currency: id,
        page: getCurrentTrackingPage(),
        is_favourite: !isStarred,
      });
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
