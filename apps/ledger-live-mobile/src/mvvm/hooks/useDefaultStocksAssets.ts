import { useMemo } from "react";
import {
  useStocksData,
  selectTopStocks,
  type StockSuggestion,
} from "@features/platform-aggregated-assets";
import { appVersion as nativeAppVersion } from "LLM/utils/appVersion";

interface DefaultStocksAssets {
  stocks: StockSuggestion[];
  isLoading: boolean;
  isError: boolean;
}

const EMPTY: DefaultStocksAssets = { stocks: [], isLoading: false, isError: false };

export function useDefaultStocksAssets(enabled: boolean, maxStocks: number): DefaultStocksAssets {
  const appVersion = nativeAppVersion;

  const { data, isLoading, isError } = useStocksData({
    product: "llm",
    version: appVersion,
    skip: !enabled,
  });

  const stocks = useMemo(() => (data ? selectTopStocks(data, maxStocks) : []), [data, maxStocks]);

  if (!enabled) return EMPTY;

  return { stocks, isLoading, isError };
}
