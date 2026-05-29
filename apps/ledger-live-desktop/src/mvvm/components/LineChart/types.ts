import type {
  LineChartProps as LumenLineChartProps,
  Series,
} from "@ledgerhq/lumen-ui-react-visualization";

export type LineChartRange = "1d" | "1w" | "1m" | "1y" | "all";

export type LineChartXAxisConfig = NonNullable<LumenLineChartProps["xAxis"]>;

export type LineChartYAxisConfig = NonNullable<LumenLineChartProps["yAxis"]>;

export type LineChartColor = "success" | "error" | "muted";

export type LineChartSeries = Series;

export type LineChartPointLabelPosition = "top" | "bottom";

export type LineChartPointMarker = Readonly<{
  index: number;
  value: number;
  label?: string;
  color?: LineChartColor | (string & {});
  labelPosition?: LineChartPointLabelPosition;
  hidePoint?: boolean;
}>;

export type LineChartValueFormatter = (value: number) => string;

export type LineChartTooltipTitle = (dataIndex: number) => string | undefined;

export type LineChartScrubberPositionChange = (index: number | undefined) => void;

export type LineChartProps = Readonly<{
  series: LineChartSeries[];
  selectedRange: LineChartRange;
  onRangeChange: (range: LineChartRange) => void;
  color?: LineChartColor;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  height?: number;
  /**
   * Markers to render on top of the chart. When omitted, defaults to the
   * lowest and highest values of the primary series. Pass `[]` to render none.
   */
  points?: LineChartPointMarker[];
  /** Enables hover/touch/keyboard scrubbing with a tooltip. @default true */
  enableScrubber?: boolean;
  /** Formats numeric values for point labels and the scrubber tooltip. @default String */
  formatValue?: LineChartValueFormatter;
  /** Returns the tooltip title for the given data index (e.g. a formatted date). */
  tooltipTitle?: LineChartTooltipTitle;
  onScrubberPositionChange?: LineChartScrubberPositionChange;
  /** Fills the area under the line. @default true */
  showArea?: boolean;
  /** Renders the x-axis. @default true */
  showXAxis?: boolean;
  /** Renders the y-axis. @default true */
  showYAxis?: boolean;
  /** Passthrough x-axis configuration (data, ticks, tickLabelFormatter, ...). */
  xAxis?: LineChartXAxisConfig;
  /** Passthrough y-axis configuration (ticks, tickLabelFormatter, domain, ...). */
  yAxis?: LineChartYAxisConfig;
}>;
