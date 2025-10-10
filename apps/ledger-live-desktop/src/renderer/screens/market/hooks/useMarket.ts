import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { MarketListRequestParams, Order } from "@ledgerhq/live-common/market/utils/types";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import { useMarketDataProvider } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setMarketOptions } from "~/renderer/actions/market";
import { useInitSupportedCounterValues } from "~/renderer/hooks/useInitSupportedCounterValues";
import { marketParamsSelector } from "~/renderer/reducers/market";
import { starredMarketCoinsSelector } from "~/renderer/reducers/settings";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE } from "../utils";
import { addStarredMarketCoins, removeStarredMarketCoins } from "~/renderer/actions/settings";
import { useModularDrawerData } from "LLD/features/ModularDrawer/hooks/useModularDrawerData";

export function useMarket() {
  const lldRefreshMarketDataFeature = useFeature("lldRefreshMarketData");
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const marketParams = useSelector(marketParamsSelector);
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);

  const REFRESH_RATE =
    Number(lldRefreshMarketDataFeature?.params?.refreshTime) > 0
      ? REFETCH_TIME_ONE_MINUTE * Number(lldRefreshMarketDataFeature?.params?.refreshTime)
      : REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH;

  const { range, starred = [], liveCompatible, order, search = "" } = marketParams;

  const starFilterOn = starred.length > 0;

  useInitSupportedCounterValues();

  console.log("starred", starred);

  const { supportedCounterCurrencies } = useMarketDataProvider();
  const { sortedCryptoCurrenciesMarket, loadNext, isLoading } = useModularDrawerData({
    searchedValueMarket: search,
    currencyIds: starred.length > 0 ? starred : undefined,
    areCurrenciesFiltered: starred.length > 0,
    pageSize: marketParams.limit,
    pollingInterval: REFRESH_RATE,
  });

  const timeRanges = useMemo(
    () =>
      Object.keys(rangeDataTable)
        .map(key => ({ value: key, label: t(`market.range.${rangeDataTable[key].label}`) }))
        .reverse(),
    [t],
  );

  const timeRangeValue = timeRanges.find(({ value }) => value === range);

  const currenciesLength = sortedCryptoCurrenciesMarket?.length || 0;
  const loading = isLoading;
  const freshLoading = loading && !currenciesLength;
  const itemCount =
    starred.length > 0 || search.length > 0 ? currenciesLength : currenciesLength + 1;

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

  const onLoadNextPage = useCallback(() => {
    loadNext?.();
  }, [loadNext]);

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
    if (starredMarketCoins.length > 0 || starFilterOn) {
      const starred = starFilterOn ? [] : starredMarketCoins;
      refresh({ starred });
    }
  }, [refresh, starFilterOn, starredMarketCoins]);

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

  const isItemLoaded = useCallback(
    (index: number) => !!sortedCryptoCurrenciesMarket?.[index],
    [sortedCryptoCurrenciesMarket],
  );

  /**
   *
   * Refresh mechanism ----------------------------------------------
   */

  // TODO: Re-implement this

  /**
   *
   * ----------------------------------------------
   */

  return {
    isItemLoaded,
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
    freshLoading,
    supportedCounterCurrencies,
    t,
    liveCompatible,
    starFilterOn,
    marketData: sortedCryptoCurrenciesMarket ?? [],
    starredMarketCoins,
    timeRanges,
    marketParams,
    timeRangeValue,
    itemCount,
    loading,
    currenciesLength,
    refreshRate: REFRESH_RATE,
  };
}
