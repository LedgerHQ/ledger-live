import { useCallback, useMemo, type ReactNode } from "react";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { DEFAULT_LINE_CHART_HEIGHT } from "./constants";
import type {
  LineChartPointMarker,
  LineChartPointTooltip,
  LineChartProps,
  LineChartRangeOption,
  LineChartScrubberPositionChange,
  LineChartSeries,
  LineChartTooltipTitle,
  LineChartValueFormatter,
  LineChartXAxisConfig,
  LineChartYAxisConfig,
} from "./types";
import { resolveLineChartStroke } from "./utils/resolveLineChartStroke";
import { getExtremaPointMarkers } from "./utils/getExtremaPointMarkers";

const defaultFormatValue: LineChartValueFormatter = value => String(value);

export type LineChartViewModelResult<TRange extends string = string> = Readonly<{
  chartSeries: LineChartSeries[];
  selectedRange: TRange;
  handleSelectedChange: (value: string) => void;
  ranges: ReadonlyArray<LineChartRangeOption<TRange>>;
  accessibilityLabel: string;
  height: number;
  isLoading: boolean;
  testID?: string;
  points: LineChartPointMarker[];
  pointTooltips: ReadonlyMap<number, LineChartPointTooltip>;
  enableScrubber: boolean;
  showScrubberTooltip: boolean;
  showScrubberBeacons: boolean;
  pointTooltipsOnly: boolean;
  formatValue: LineChartValueFormatter;
  tooltipTitle?: LineChartTooltipTitle;
  onScrubberPositionChange?: LineChartScrubberPositionChange;
  showArea: boolean;
  showXAxis: boolean;
  showYAxis: boolean;
  xAxis?: LineChartXAxisConfig;
  yAxis?: LineChartYAxisConfig;
  rangeSelectorTrailing?: ReactNode;
}>;

export function useLineChartViewModel<TRange extends string>({
  series,
  selectedRange,
  onRangeChange,
  ranges,
  accessibilityLabel,
  isRangeValue,
  color = "muted",
  height = DEFAULT_LINE_CHART_HEIGHT,
  isLoading = false,
  testID,
  points,
  enableScrubber = true,
  showScrubberTooltip = true,
  showScrubberBeacons = true,
  pointTooltipsOnly = false,
  formatValue = defaultFormatValue,
  tooltipTitle,
  onScrubberPositionChange,
  showArea = true,
  showXAxis = true,
  showYAxis = true,
  xAxis,
  yAxis,
  rangeSelectorTrailing,
}: LineChartProps<TRange>): LineChartViewModelResult<TRange> {
  const { theme } = useTheme();

  const stroke = useMemo(
    () => resolveLineChartStroke(color, theme.colors.bg),
    [color, theme.colors.bg],
  );

  const chartSeries = useMemo(() => series.map(entry => ({ ...entry, stroke })), [series, stroke]);

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

  const handleSelectedChange = useCallback(
    (value: string) => {
      if (isRangeValue && !isRangeValue(value)) return;
      onRangeChange(value as TRange);
    },
    [onRangeChange, isRangeValue],
  );

  return {
    chartSeries,
    selectedRange,
    handleSelectedChange,
    ranges,
    accessibilityLabel,
    height,
    isLoading,
    testID,
    points: resolvedPoints,
    pointTooltips,
    enableScrubber,
    showScrubberTooltip,
    showScrubberBeacons,
    pointTooltipsOnly,
    formatValue,
    tooltipTitle,
    onScrubberPositionChange,
    showArea,
    showXAxis,
    showYAxis,
    xAxis,
    yAxis,
    rangeSelectorTrailing,
  };
}
