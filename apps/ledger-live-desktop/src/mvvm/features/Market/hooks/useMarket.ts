import { useFeature } from "@features/platform-feature-flags";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/utils/types";
import { rangeDataTable } from "@ledgerhq/live-common/cg-client/utils/rangeDataTable";
import { useMarketData as useMarketDataHook } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { resolveMarketListRefreshRate } from "@ledgerhq/live-common/market/utils/timers";
import { useUsdToFiatRate } from "@features/platform-market-countervalues";
import { applyUsdRateToMarket } from "@ledgerhq/live-common/market/utils/applyUsdRateToMarket";
import { useResolveMarketCounterCurrency } from "@ledgerhq/live-common/market/hooks/useResolveMarketCounterCurrency";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setMarketCurrentPage, setMarketOptions } from "~/renderer/actions/market";
import { marketCurrentPageSelector, marketParamsSelector } from "~/renderer/reducers/market";
import {
  counterValueCurrencySelector,
  localeSelector,
  starredMarketCoinsSelector,
} from "~/renderer/reducers/settings";
import { getCurrentPage } from "~/renderer/screens/market/utils";
import { addStarredMarketCoins, removeStarredMarketCoins } from "~/renderer/actions/settings";
import { getCurrentTrackingPage, track } from "@shared/analytics";
import { useMarketCategories } from "LLD/features/Market/hooks/useMarketCategories";
import {
  getMarketCategoriesParam,
  isBuiltInMarketListCategory,
  type MarketListCategory,
} from "@ledgerhq/live-common/market/utils/category";

function getCategoryFlags(selectedCategory: MarketListCategory) {
  return {
    isStarredCategory: selectedCategory === "starred",
    isStocksCategory: selectedCategory === "stocks",
    isTrendingCategory: !isBuiltInMarketListCategory(selectedCategory),
  };
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
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const settingsCounterValue = counterValueCurrency.ticker.toLowerCase();

  const REFRESH_RATE = resolveMarketListRefreshRate(
    lldRefreshMarketDataFeature?.params?.refreshTime,
  );

  const { range, order, search = "" } = marketParams;

  const categories = useMarketCategories();

  const {
    requestCounterCurrency: resolvedRequestCounterCurrency,
    displayCounterCurrency: resolvedDisplayCounterCurrency = settingsCounterValue,
    needsUsdFallback: resolvedNeedsUsdFallback,
    isResolutionLoading,
  } = useResolveMarketCounterCurrency({
    counterCurrency: settingsCounterValue,
    fallbackForCryptoCountervalues: true,
    isCryptoCountervalue: counterValueCurrency.type === "CryptoCurrency",
  });

  const { isStarredCategory, isStocksCategory, isTrendingCategory } = getCategoryFlags(
    categories.selectedCategory,
  );

  const starFilterOn = isStarredCategory;

  const needsUsdFallback = resolvedNeedsUsdFallback;
  // Counter value sent to the markets endpoint (usd on fallback so the request succeeds).
  const requestCounterCurrency = resolvedRequestCounterCurrency;
  // Counter value used to format the rows. The request may have used usd as a
  // fallback, but the values are rescaled back into the user's counter value.
  const displayCounterCurrency = resolvedDisplayCounterCurrency;
  const shouldFetchMarketData = !isResolutionLoading;

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
      starred: isStarredCategory ? starredMarketCoins : [],
      categories: getMarketCategoriesParam(categories.selectedCategory),
    },
    { enabled: shouldFetchMarketData, refreshRate: REFRESH_RATE },
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

  const refresh = useCallback(
    (payload: MarketListRequestParams) => {
      dispatch(setMarketOptions(payload));
    },
    [dispatch],
  );

  const resetSearch = useCallback(() => refresh({ search: "" }), [refresh]);

  const { resetToFirstPage, fetchNextPage } = marketResult;

  const resetMarketPage = useCallback(() => {
    resetToFirstPage();
    dispatch(setMarketCurrentPage(1));
  }, [dispatch, resetToFirstPage]);

  const onLoadNextPage = fetchNextPage;

  const updateTimeRange = useCallback(
    (e: { value: string; label: string } | null) => {
      if (!e) return;
      const { value } = e;
      refresh({ range: value });
    },
    [refresh],
  );

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

  const checkIfDataIsStaleAndRefetch = useCallback(
    (scrollPosition: number) => {
      const newCurrentPage = getCurrentPage(scrollPosition, marketParams.limit || 50);

      if (marketCurrentPage !== newCurrentPage) {
        dispatch(setMarketCurrentPage(newCurrentPage));
      }
    },
    [marketParams.limit, marketCurrentPage, dispatch],
  );

  return {
    onLoadNextPage,
    toggleStar,
    updateTimeRange,
    refresh,
    resetSearch,
    checkIfDataIsStaleAndRefetch,
    resetMarketPage,
    freshLoading,
    t,
    marketData,
    categories,
    emptyState,
    starredMarketCoins,
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
