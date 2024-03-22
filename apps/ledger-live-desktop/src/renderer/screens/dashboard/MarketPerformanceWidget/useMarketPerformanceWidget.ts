import { useSelector } from "react-redux";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useMemo, useState } from "react";
import { Order } from "./types";

import { useMarketPerformers } from "@ledgerhq/live-common/market/v2/useMarketPerformers";
import { getSlicedList } from "./utils";
import { useMarketPerformanceFeatureFlag } from "~/renderer/actions/marketperformance";

const LIMIT = 5;

export function useMarketPerformanceWidget() {
  const { refreshRate, top, supported } = useMarketPerformanceFeatureFlag();

  const [order, setOrder] = useState<Order>(Order.asc);

  const timeRange = useSelector(selectedTimeRangeSelector);
  const countervalue = useSelector(counterValueCurrencySelector);

  const { data, isError, isLoading } = useMarketPerformers({
    sort: order,
    counterCurrency: countervalue.ticker,
    range: timeRange,
    limit: LIMIT,
    top,
    supported,
    refreshRate,
  });

  const sliced = useMemo(
    () => getSlicedList(data ?? [], order, timeRange),
    [data, order, timeRange],
  );

  return {
    list: sliced,
    order,
    setOrder,
    isLoading,
    hasError: isError,
    range: timeRange,
  };
}
