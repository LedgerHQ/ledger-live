import type { Series } from "@ledgerhq/lumen-ui-rnative-visualization";

export type LineChartSeries = Series;

export type LineChartColor = "success" | "error" | "muted";

export type LineChartRangeOption<TRange extends string = string> = Readonly<{
  value: TRange;
  label: string;
}>;

export type LineChartProps<TRange extends string = string> = Readonly<{
  series: LineChartSeries[];
  selectedRange: TRange;
  onRangeChange: (range: TRange) => void;
  ranges: ReadonlyArray<LineChartRangeOption<TRange>>;
  accessibilityLabel: string;
  isRangeValue?: (value: string) => value is TRange;
  color?: LineChartColor;
  height?: number;
  isLoading?: boolean;
  testID?: string;
}>;
