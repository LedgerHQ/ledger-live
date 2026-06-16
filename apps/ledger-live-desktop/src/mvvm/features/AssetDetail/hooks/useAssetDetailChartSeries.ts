import { useMemo } from "react";
import { useAssetChartData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import type { LineChartRange } from "LLD/components/LineChart";
import { buildAssetDetailChartSeries } from "../utils/buildAssetDetailChartSeries";

type UseAssetDetailChartSeriesParams = Readonly<{
  id?: string;
  counterCurrency: string;
  selectedRange: LineChartRange;
  ath?: number;
  atl?: number;
  athTime?: number;
  atlTime?: number;
  skip?: boolean;
}>;

export function useAssetDetailChartSeries({
  id,
  counterCurrency,
  selectedRange,
  ath,
  atl,
  athTime,
  atlTime,
  skip = false,
}: UseAssetDetailChartSeriesParams) {
  const {
    // Read `currentData` (not `data`): on an id/range change RTK Query retains
    // the previous arg's `data`, which would leak the prior asset/range's series
    // into the new selection. `currentData` is undefined until the new arg loads.
    currentData: chartData,
    isLoading,
    isFetching,
    isError,
  } = useAssetChartData(
    { id: id ?? "", counterCurrency, range: selectedRange },
    { skip: !id || skip },
  );

  const { prices, timestamps } = useMemo(
    () =>
      buildAssetDetailChartSeries({
        chartData,
        selectedRange,
        ath,
        atl,
        athTime,
        atlTime,
      }),
    [chartData, selectedRange, ath, atl, athTime, atlTime],
  );

  return { prices, timestamps, isLoading, isFetching, isError };
}
