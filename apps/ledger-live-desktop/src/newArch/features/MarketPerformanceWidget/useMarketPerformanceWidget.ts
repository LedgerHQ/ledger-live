import { useSelector } from "react-redux";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useCallback, useMemo, useState } from "react";
import { CurrencyCheck, Order } from "./types";

import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import {
  filterAvailableBuyOrSwapCurrency,
  getSlicedListWithFilters,
  isAvailableOnBuyOrSwap,
} from "./utils";
import { useMarketPerformanceFeatureFlag } from "~/renderer/actions/marketperformance";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";

const LIMIT_TO_DISPLAY = 5;

export function useMarketPerformanceWidget() {
  const { isCurrencyAvailable } = useRampCatalog();
  const { data: currenciesForSwapAll } = useFetchCurrencyAll();

  const currenciesForSwapAllSet = useMemo(
    () => new Set(currenciesForSwapAll),
    [currenciesForSwapAll],
  );

  const isAvailable = useCallback(
    (id: string, type: CurrencyCheck): boolean => {
      return isAvailableOnBuyOrSwap(id, currenciesForSwapAllSet, isCurrencyAvailable, type);
    },
    [currenciesForSwapAllSet, isCurrencyAvailable],
  );

  const filterAvailable = useCallback(
    (elem: MarketItemPerformer): boolean => {
      return filterAvailableBuyOrSwapCurrency(elem, isAvailable);
    },
    [isAvailable],
  );

  const { refreshRate, top, supported, limit, enableNewFeature } =
    useMarketPerformanceFeatureFlag();

  const [order, setOrder] = useState<Order>(Order.asc);

  const timeRange = useSelector(selectedTimeRangeSelector);
  const countervalue = useSelector(counterValueCurrencySelector);

  const { data, isError, isLoading } = useMarketPerformers({
    sort: order,
    counterCurrency: countervalue.ticker,
    range: timeRange,
    limit: enableNewFeature ? limit : LIMIT_TO_DISPLAY,
    top,
    supported,
    refreshRate,
  });

  const sliced = useMemo(() => {
    return getSlicedListWithFilters(
      data ?? [],
      order,
      timeRange,
      enableNewFeature,
      filterAvailable,
      LIMIT_TO_DISPLAY,
    );
  }, [data, enableNewFeature, filterAvailable, order, timeRange]);

  return {
    list: sliced,
    order,
    setOrder,
    isLoading,
    hasError: isError,
    range: timeRange,
    top,
    enableNewFeature,
  };
}
