import { useCallback, useMemo } from "react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_LINE_CHART_HEIGHT,
  LINE_CHART_COLOR_TO_STROKE,
  LINE_CHART_RANGES,
} from "./constants";
import type {
  LineChartPointMarker,
  LineChartPointTooltip,
  LineChartProps,
  LineChartRange,
  LineChartScrubberPositionChange,
  LineChartSeries,
  LineChartTooltipTitle,
  LineChartValueFormatter,
  LineChartXAxisConfig,
  LineChartYAxisConfig,
} from "./types";
import { getExtremaPointMarkers } from "./utils/getExtremaPointMarkers";

const defaultFormatValue: LineChartValueFormatter = value => String(value);

export type LineChartViewModelResult = Readonly<{
  chartSeries: LineChartSeries[];
  height: number;
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  selectedRange: LineChartRange;
  handleSelectedChange: (value: string) => void;
  rangeSelectorLabel: string;
  rangeButtons: ReadonlyArray<{ value: LineChartRange; label: string }>;
  points: LineChartPointMarker[];
  pointTooltips: ReadonlyMap<number, LineChartPointTooltip>;
  enableScrubber: boolean;
  formatValue: LineChartValueFormatter;
  tooltipTitle?: LineChartTooltipTitle;
  showScrubberTooltip: boolean;
  pointTooltipsOnly: boolean;
  onScrubberPositionChange?: LineChartScrubberPositionChange;
  showArea: boolean;
  showXAxis: boolean;
  showYAxis: boolean;
  xAxis?: LineChartXAxisConfig;
  yAxis?: LineChartYAxisConfig;
  rangeSelectorTrailing?: ReactNode;
}>;

export function useLineChartViewModel({
  series,
  selectedRange,
  onRangeChange,
  color = "muted",
  isLoading = false,
  isError = false,
  errorMessage,
  height = DEFAULT_LINE_CHART_HEIGHT,
  points,
  enableScrubber = true,
  formatValue = defaultFormatValue,
  tooltipTitle,
  showScrubberTooltip = true,
  pointTooltipsOnly = false,
  onScrubberPositionChange,
  showArea = true,
  showXAxis = true,
  showYAxis = true,
  xAxis,
  yAxis,
  rangeSelectorTrailing,
}: LineChartProps): LineChartViewModelResult {
  const { t } = useTranslation();
  const stroke = LINE_CHART_COLOR_TO_STROKE[color];

  const handleSelectedChange = useCallback(
    (value: string) => {
      onRangeChange(value as LineChartRange);
    },
    [onRangeChange],
  );

  const chartSeries = useMemo(
    () =>
      series.map(entry => ({
        ...entry,
        stroke,
      })),
    [series, stroke],
  );

  const resolvedPoints = useMemo(
    () => points ?? getExtremaPointMarkers(chartSeries),
    [points, chartSeries],
  );

  const pointTooltips = useMemo(() => {
    const map = new Map<number, LineChartPointTooltip>();
    for (const marker of resolvedPoints) {
      if (marker.tooltip) map.set(marker.index, marker.tooltip);
    }
    return map;
  }, [resolvedPoints]);

  const rangeButtons = useMemo(
    () => LINE_CHART_RANGES.map(range => ({ value: range, label: t(`lineChart.range.${range}`) })),
    [t],
  );

  return {
    chartSeries,
    height,
    isLoading,
    isError,
    errorMessage,
    selectedRange,
    handleSelectedChange,
    rangeSelectorLabel: t("lineChart.rangeSelectorLabel"),
    rangeButtons,
    points: resolvedPoints,
    pointTooltips,
    enableScrubber,
    formatValue,
    tooltipTitle,
    showScrubberTooltip,
    pointTooltipsOnly,
    onScrubberPositionChange,
    showArea,
    showXAxis,
    showYAxis,
    xAxis,
    yAxis,
    rangeSelectorTrailing,
  };
}
