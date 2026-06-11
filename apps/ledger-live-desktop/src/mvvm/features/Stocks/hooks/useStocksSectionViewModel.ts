import { useMemo } from "react";
import { useStocksData } from "@ledgerhq/live-common/dada-client/hooks/useStocksData";
import { selectTopStocks } from "@ledgerhq/live-common/dada-client/utils/assetDiscovery";
import { StocksSectionViewModelResult } from "../types";

export function useStocksSectionViewModel({
  limit,
}: {
  limit: number;
}): StocksSectionViewModelResult {
  const { data, isLoading } = useStocksData({
    product: "lld",
    version: __APP_VERSION__,
  });

  const stocks = useMemo(() => (data ? selectTopStocks(data, limit) : []), [data, limit]);

  return useMemo(() => ({ data: stocks, isLoading }), [stocks, isLoading]);
}
