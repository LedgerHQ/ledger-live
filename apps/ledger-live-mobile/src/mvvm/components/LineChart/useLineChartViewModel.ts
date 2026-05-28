import { useCallback, useMemo } from "react";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import { DEFAULT_LINE_CHART_HEIGHT } from "./constants";
import type { LineChartProps, LineChartRangeOption, LineChartSeries } from "./types";
import { resolveLineChartStroke } from "./utils/resolveLineChartStroke";

export type LineChartViewModelResult<TRange extends string = string> = Readonly<{
  chartSeries: LineChartSeries[];
  selectedRange: TRange;
  handleSelectedChange: (value: string) => void;
  ranges: ReadonlyArray<LineChartRangeOption<TRange>>;
  accessibilityLabel: string;
  height: number;
  isLoading: boolean;
  testID?: string;
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
}: LineChartProps<TRange>): LineChartViewModelResult<TRange> {
  const { theme } = useTheme();

  const stroke = useMemo(
    () => resolveLineChartStroke(color, theme.colors.bg),
    [color, theme.colors.bg],
  );

  const chartSeries = useMemo(() => series.map(entry => ({ ...entry, stroke })), [series, stroke]);

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
  };
}
