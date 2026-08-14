import { useMemo } from "react";
import { useStocksData, selectTopStocks } from "@features/platform-aggregated-assets";
import { StocksSectionViewModelResult } from "../types";
import { STOCKS_PRICE_REFRESH_INTERVAL_MS } from "../constants";

export function useStocksSectionViewModel({
  limit,
}: {
  limit: number;
}): StocksSectionViewModelResult {
  const { data, isLoading, isError } = useStocksData({
    product: "lld",
    version: __APP_VERSION__,
    pollingInterval: STOCKS_PRICE_REFRESH_INTERVAL_MS,
    skipPollingIfUnfocused: true,
  });

  const stocks = useMemo(() => (data ? selectTopStocks(data, limit) : []), [data, limit]);

  return useMemo(() => ({ data: stocks, isLoading, isError }), [stocks, isLoading, isError]);
}
