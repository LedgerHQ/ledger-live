import { MarketState } from "@ledgerhq/live-common/market/types";
import { rangeDataTable } from "@ledgerhq/live-common/market/utils/rangeDataTable";
import { useMarketDataProvider } from "@ledgerhq/live-common/market/v2/useMarketDataProvider";
import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { setMarketOptions } from "~/renderer/actions/market";
import { useInitSupportedCounterValues } from "~/renderer/hooks/useInitSupportedCounterValues";
import { marketSelector } from "~/renderer/reducers/market";
import { starredMarketCoinsSelector } from "~/renderer/reducers/settings";

export function useMarket() {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const marketParams = useSelector(marketSelector);
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
    (payload: MarketState) => {
      dispatch(setMarketOptions(payload));
    },
    [dispatch],
  );

  const { range, starred = [], liveCompatible } = marketParams;
  const starredMarketCoins: string[] = useSelector(starredMarketCoinsSelector);
  const starFilterOn = starred.length > 0;

  useInitSupportedCounterValues();

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

  return {
    timeRangeValue,
    toggleLiveCompatible,
    toggleFilterByStarredAccounts,
    updateSearch,
    updateTimeRange,
    marketParams,
    setCounterCurrency,
    supportedCounterCurrencies,
    t,
    refresh,
    liveCompatible,
    starFilterOn,
    starredMarketCoins,
    timeRanges,
  };
}
