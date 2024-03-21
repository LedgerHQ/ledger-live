import { useSelector } from "react-redux";
import {
  counterValueCurrencySelector,
  selectedTimeRangeSelector,
} from "~/renderer/reducers/settings";
import { useMemo, useState } from "react";
import { Order } from "./types";

import { useMarketPerformers } from "@ledgerhq/live-common/market/v2/useMarketPerformers";
import { MarketPerformersResult } from "@ledgerhq/live-common/market/types";
import { PortfolioRange } from "@ledgerhq/types-live";

const LIMIT = 5;

export function getSlicedList(list: MarketPerformersResult[], order: Order, range: PortfolioRange) {
  return list.filter(elem =>
    order === Order.asc
      ? getChangePercentage(elem, range) > 0
      : getChangePercentage(elem, range) < 0,
  );
}

export function useMarketPerformanceWidget() {
  const [order, setOrder] = useState<Order>(Order.asc);

  const timeRange = useSelector(selectedTimeRangeSelector);
  const countervalue = useSelector(counterValueCurrencySelector);

  const result = useMarketPerformers({
    sort: order,
    counterCurrency: countervalue.ticker,
    range: timeRange,
    limit: LIMIT,
    top: 50,
    supported: true,
  });

  const data = result.data;

  const sliced = useMemo(
    () => getSlicedList(data ?? [], order, timeRange),
    [data, order, timeRange],
  );

  return {
    list: sliced,
    order,
    setOrder,
    isLoading: result.isLoading,
    hasError: result.isError,
    range: timeRange,
  };
}

export function getChangePercentage(data: MarketPerformersResult, range: PortfolioRange) {
  switch (range) {
    case "day":
      return data.priceChangePercentage24h;
    case "week":
      return data.priceChangePercentage7d;
    case "month":
      return data.priceChangePercentage30d;
    case "year":
      return data.priceChangePercentage1y;
    default:
      return data.priceChangePercentage1h;
  }
}
