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
    data: chartData,
    isLoading,
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

  return { prices, timestamps, isLoading, isError };
}
