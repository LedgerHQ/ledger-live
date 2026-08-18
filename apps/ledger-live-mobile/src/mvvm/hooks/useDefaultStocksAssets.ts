import { useMemo } from "react";
import {
  useStocksData,
  selectTopStocks,
  type StockSuggestion,
} from "@features/platform-aggregated-assets";
import VersionNumber from "react-native-version-number";

interface DefaultStocksAssets {
  stocks: StockSuggestion[];
  isLoading: boolean;
  isError: boolean;
}

const EMPTY: DefaultStocksAssets = { stocks: [], isLoading: false, isError: false };

export function useDefaultStocksAssets(enabled: boolean, maxStocks: number): DefaultStocksAssets {
  const appVersion = VersionNumber.appVersion ?? "";

  const { data, isLoading, isError } = useStocksData({
    product: "llm",
    version: appVersion,
    skip: !enabled,
  });

  const stocks = useMemo(() => (data ? selectTopStocks(data, maxStocks) : []), [data, maxStocks]);

  if (!enabled) return EMPTY;

  return { stocks, isLoading, isError };
}
