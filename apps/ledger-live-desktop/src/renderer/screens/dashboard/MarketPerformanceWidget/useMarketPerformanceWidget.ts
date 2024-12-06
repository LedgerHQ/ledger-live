import { useSelector } from "react-redux";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useCallback, useMemo, useState } from "react";
import { Order } from "./types";

import { useMarketPerformers } from "@ledgerhq/live-common/market/hooks/useMarketPerformers";
import { getSlicedList } from "./utils";
import { useMarketPerformanceFeatureFlag } from "~/renderer/actions/marketperformance";
import { useRampCatalog } from "@ledgerhq/live-common/platform/providers/RampCatalogProvider/useRampCatalog";
import { useFetchCurrencyAll } from "@ledgerhq/live-common/exchange/swap/hooks/index";
import { MarketItemPerformer } from "@ledgerhq/live-common/market/utils/types";

const LIMIT_TO_DISPLAY = 5;

export function useMarketPerformanceWidget() {
  const { isCurrencyAvailable } = useRampCatalog();
  const { data: currenciesAll } = useFetchCurrencyAll();

  const filterAvailableBuyOrSwapCurrency = useCallback(
    (elem: MarketItemPerformer) => {
      const availableOnBuy = isCurrencyAvailable(elem.id, "onRamp");
      const availableOnSwap = currenciesAll?.includes(elem.id);
      return availableOnBuy || availableOnSwap;
    },
    [currenciesAll, isCurrencyAvailable],
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
    const initialList = getSlicedList(data ?? [], order, timeRange);
    const filteredList = initialList.filter(filterAvailableBuyOrSwapCurrency);

    const finalList = enableNewFeature && filteredList.length > 0 ? filteredList : initialList;

    return finalList.slice(0, LIMIT_TO_DISPLAY);
  }, [data, enableNewFeature, filterAvailableBuyOrSwapCurrency, order, timeRange]);

  return {
    list: sliced,
    order,
    setOrder,
    isLoading,
    hasError: isError,
    range: timeRange,
    top,
  };
}
