import { useCallback, useMemo } from "react";
import BigNumber from "bignumber.js";
import type { AssetMarketData } from "@ledgerhq/asset-detail";
import { useAssetChartData } from "@ledgerhq/live-common/market/hooks/useMarketDataProvider";
import { formatPrice } from "@ledgerhq/live-currency-format";
import { useSelector } from "LLD/hooks/redux";
import {
  resolveLineChartColorFromPercentChange,
  type LineChartColor,
  type LineChartRange,
  type LineChartSeries,
  type LineChartTooltipTitle,
  type LineChartValueFormatter,
  type LineChartXAxisConfig,
  type LineChartYAxisConfig,
} from "LLD/components/LineChart";
import { dayFormat, hourFormat, useDateFormatter } from "~/renderer/hooks/useDateFormatter";
import { counterValueCurrencySelector, localeSelector } from "~/renderer/reducers/settings";
import {
  clampDayChangePercentPointsNearZero,
  getPriceChangeKeyForRange,
} from "../MarketPriceSection/utils";

const MIN_X_AXIS_TICKS = 5;
const MIN_X_AXIS_TICKS_1D = 8;

/**
 * Asymmetric padding added to the y-axis domain (as a ratio of the value range).
 * Most of it sits at the bottom to lift the lowest point off the x-axis so its
 * "below" label clears the x-axis tick labels, while the top stays nearly tight
 * so the line keeps its amplitude and does not look flat.
 */
const Y_AXIS_PADDING_BOTTOM_RATIO = 0.12;
const Y_AXIS_PADDING_TOP_RATIO = 0.04;

/**
 * Returns evenly spaced data indices (always including the first and last point)
 * so the x-axis renders at least `minTicks` labels when enough data is available.
 */
function getEvenlySpacedTicks(length: number, minTicks: number): number[] {
  if (length <= 0) return [];
  if (length <= minTicks) return Array.from({ length }, (_, index) => index);

  const ticks = Array.from({ length: minTicks }, (_, index) =>
    Math.round((index * (length - 1)) / (minTicks - 1)),
  );
  return Array.from(new Set(ticks));
}

type UseChartSectionViewModelProps = Readonly<{
  marketData: AssetMarketData;
  ledgerId?: string;
  isDistributionLoading: boolean;
  selectedRange: LineChartRange;
  onRangeChange: (range: LineChartRange) => void;
}>;

export type ChartSectionViewModelResult = Readonly<{
  series: LineChartSeries[];
  selectedRange: LineChartRange;
  onRangeChange: (range: LineChartRange) => void;
  color: LineChartColor;
  isLoading: boolean;
  isError: boolean;
  formatValue: LineChartValueFormatter;
  tooltipTitle: LineChartTooltipTitle;
  showXAxis: boolean;
  showYAxis: boolean;
  xAxis: LineChartXAxisConfig;
  yAxis: LineChartYAxisConfig;
}>;

export function useChartSectionViewModel({
  marketData,
  ledgerId,
  selectedRange,
  onRangeChange,
}: UseChartSectionViewModelProps): ChartSectionViewModelResult {
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  const counterCurrency = counterValueCurrency.ticker.toLowerCase();
  const fiatUnit = counterValueCurrency.units[0];
  const locale = useSelector(localeSelector);

  const id =
    ledgerId ?? marketData.marketCurrencyData?.ledgerIds?.[0] ?? marketData.marketCurrencyData?.id;

  const {
    data: chartData,
    isLoading,
    isError,
  } = useAssetChartData({ id, counterCurrency, range: selectedRange }, { skip: !id });

  const { series, timestamps } = useMemo(() => {
    const points = chartData?.[selectedRange] ?? [];
    const data: number[] = [];
    const tsList: number[] = [];
    points.forEach(([timestamp, value]) => {
      data.push(value);
      tsList.push(timestamp);
    });
    return {
      series: [
        {
          id: "asset-detail-price",
          data,
          label: "Price",
          // Stroke is required by Series typing but is always overridden by <LineChart /> from `color`.
          stroke: "",
        },
      ] satisfies LineChartSeries[],
      timestamps: tsList,
    };
  }, [chartData, selectedRange]);

  const priceChangeKey = getPriceChangeKeyForRange(selectedRange);
  const rangePercentage = marketData.marketCurrencyData?.priceChangePercentage?.[priceChangeKey];
  const color = resolveLineChartColorFromPercentChange(
    clampDayChangePercentPointsNearZero(rangePercentage),
  );

  const formatValue = useCallback<LineChartValueFormatter>(
    value =>
      formatPrice(fiatUnit, new BigNumber(value).times(10 ** fiatUnit.magnitude), {
        showCode: true,
        locale,
      }),
    [fiatUnit, locale],
  );

  const formatDay = useDateFormatter(dayFormat);
  const formatHour = useDateFormatter(hourFormat);
  const formatDate = selectedRange === "1d" ? formatHour : formatDay;

  const tooltipTitle = useCallback<LineChartTooltipTitle>(
    dataIndex => {
      const timestamp = timestamps[dataIndex];
      if (timestamp == null) return undefined;
      return formatDate(new Date(timestamp));
    },
    [timestamps, formatDate],
  );

  const xAxis = useMemo<LineChartXAxisConfig>(
    () => ({
      showLine: false,
      ticks: getEvenlySpacedTicks(
        timestamps.length,
        selectedRange === "1d" ? MIN_X_AXIS_TICKS_1D : MIN_X_AXIS_TICKS,
      ),
      tickLabelFormatter: value => {
        const timestamp = timestamps[Number(value)];
        return timestamp == null ? "" : formatDate(new Date(timestamp));
      },
    }),
    [timestamps, formatDate, selectedRange],
  );

  const yAxis = useMemo<LineChartYAxisConfig>(
    () => ({
      domain: ({ min, max }) => {
        const range = max - min || Math.abs(max) || 1;
        return {
          min: min - range * Y_AXIS_PADDING_BOTTOM_RATIO,
          max: max + range * Y_AXIS_PADDING_TOP_RATIO,
        };
      },
    }),
    [],
  );

  return {
    series,
    selectedRange,
    onRangeChange,
    color,
    isLoading,
    isError,
    formatValue,
    tooltipTitle,
    showXAxis: true,
    showYAxis: false,
    xAxis,
    yAxis,
  };
}
