import { useFetchCurrencyFrom } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { MarketListRequestParams } from "@ledgerhq/live-common/market/types";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import {
  useMarketDataProvider,
  useMarketData as useMarketDataHook,
} from "@ledgerhq/live-common/market/v2/useMarketDataProvider";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  addStarredMarketCoins,
  removeStarredMarketCoins,
  setMarketOptions,
} from "~/renderer/actions/market";
import { useInitSupportedCounterValues } from "~/renderer/hooks/useInitSupportedCounterValues";
import { marketParamsSelector, starredMarketCoinsSelector } from "~/renderer/reducers/market";
import { localeSelector } from "~/renderer/reducers/settings";

export type MarketHookResult = {};

export function useMarket() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const marketParams = useSelector(marketParamsSelector);
  const locale = useSelector(localeSelector);

  useInitSupportedCounterValues();

  const { supportedCounterCurrencies } = useMarketDataProvider();

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

  const { range, starred = [], liveCompatible } = marketParams;
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const starFilterOn = starred.length > 0;

  const updateSearch = useCallback(
    (value: string) => {
      refresh({ search: value, starred: [], liveCompatible: false });
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
      refresh({ starred, search: "" });
    }
  }, [refresh, starFilterOn, starredMarketCoins]);

  const toggleLiveCompatible = useCallback(() => {
    refresh({ liveCompatible: !liveCompatible });
  }, [liveCompatible, refresh]);

  const timeRanges = useMemo(
    () =>
      Object.keys(rangeDataTable)
        .filter(k => k !== "1h")
        .map(value => ({ value, label: t(`market.range.${value}`) })),
    [t],
  );

  const timeRangeValue = timeRanges.find(({ value }) => value === range);

  const { supportedCurrencies, liveCoinsList } = useMarketDataProvider();

  const onLoadNextPage = useCallback(() => {
    dispatch(setMarketOptions({ page: (marketParams?.page || 1) + 1 }));
  }, [dispatch, marketParams?.page]);

  const { orderBy, order } = marketParams;

  const marketResult = useMarketDataHook({
    ...marketParams,
    liveCoinsList,
    supportedCoinsList: supportedCurrencies,
  });

  const currenciesLength = marketResult.data.length;
  const loading = marketResult.loading;
  const freshLoading = loading && !currenciesLength;

  const { data: fromCurrencies } = useFetchCurrencyFrom();

  const resetSearch = useCallback(() => refresh({ search: "" }), [refresh]);

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

  const toggleSortBy = useCallback(
    (newOrderBy: string) => {
      const isFreshSort = newOrderBy !== orderBy;
      refresh(
        isFreshSort
          ? { orderBy: newOrderBy, order: "desc" }
          : {
              orderBy: newOrderBy,
              order: order === "asc" ? "desc" : "asc",
            },
      );
    },
    [order, orderBy, refresh],
  );

  const isItemLoaded = useCallback(
    (index: number) => !!marketResult.data[index],
    [marketResult.data],
  );
  const itemCount = currenciesLength + 1;

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
    marketResult,
    starredMarketCoins,
    timeRanges,
    marketParams,
    timeRangeValue,
    itemCount,
    locale,
    fromCurrencies,
    loading,
    currenciesLength,
  };
}
