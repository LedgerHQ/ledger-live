import { useFetchCurrencyFrom } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { MarketListRequestParams, Order } from "@ledgerhq/live-common/market/utils/types";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import {
  useMarketDataProvider,
  useMarketData as useMarketDataHook,
} from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setMarketCurrentPage, setMarketOptions } from "~/renderer/actions/market";
import { useInitSupportedCounterValues } from "~/renderer/hooks/useInitSupportedCounterValues";
import { marketCurrentPageSelector, marketParamsSelector } from "~/renderer/reducers/market";
import { localeSelector, starredMarketCoinsSelector } from "~/renderer/reducers/settings";
import { BASIC_REFETCH, REFETCH_TIME_ONE_MINUTE, getCurrentPage, isDataStale } from "../utils";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { addStarredMarketCoins, removeStarredMarketCoins } from "~/renderer/actions/settings";

export function useMarket() {
  const lldRefreshMarketDataFeature = useFeature("lldRefreshMarketData");
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const marketParams = useSelector(marketParamsSelector);
  const marketCurrentPage = useSelector(marketCurrentPageSelector);
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const locale = useSelector(localeSelector);

  const { data: currenciesAll } = useFetchCurrencyAll();

  const REFRESH_RATE =
    Number(lldRefreshMarketDataFeature?.params?.refreshTime) > 0
      ? REFETCH_TIME_ONE_MINUTE * Number(lldRefreshMarketDataFeature?.params?.refreshTime)
      : REFETCH_TIME_ONE_MINUTE * BASIC_REFETCH;

  const { range, starred = [], liveCompatible, order, search = "" } = marketParams;

  const starFilterOn = starred.length > 0;

  useInitSupportedCounterValues();

  const { data: fromCurrencies } = useFetchCurrencyFrom();

  const { liveCoinsList, supportedCounterCurrencies } = useMarketDataProvider();

  const marketResult = useMarketDataHook({
    ...marketParams,
    liveCoinsList: liveCompatible ? liveCoinsList : [],
  });

  const timeRanges = useMemo(
    () =>
      Object.keys(rangeDataTable)
        .filter(k => k !== "1h")
        .map(value => ({ value, label: t(`market.range.${value}`) })),
    [t],
  );

  const timeRangeValue = timeRanges.find(({ value }) => value === range);

  const currenciesLength = marketResult.data.length;
  const loading = marketResult.isLoading;
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
    if (starredMarketCoins.length > 0 || starFilterOn) {
      const starred = starFilterOn ? [] : starredMarketCoins;
      refresh({ starred, page: 1 });
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
    (index: number) => !!marketResult.data[index],
    [marketResult.data],
  );

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
    checkIfDataIsStaleAndRefetch,
    resetMarketPage: resetMarketPageToInital,
    refetchData,
    freshLoading,
    supportedCounterCurrencies,
    t,
    liveCompatible,
    starFilterOn,
    marketData: marketResult.data,
    starredMarketCoins,
    timeRanges,
    marketParams,
    marketCurrentPage,
    timeRangeValue,
    itemCount,
    locale,
    fromCurrencies,
    loading,
    currenciesLength,
    refreshRate: REFRESH_RATE,
    currenciesAll,
  };
}
