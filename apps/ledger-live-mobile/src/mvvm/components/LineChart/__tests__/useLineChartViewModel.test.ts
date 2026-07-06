import { act, renderHook } from "@tests/test-renderer";
import { DEFAULT_LINE_CHART_HEIGHT } from "../constants";
import { useLineChartViewModel } from "../useLineChartViewModel";
import type { LineChartProps, LineChartSeries } from "../types";

type Range = "1d" | "1w" | "1y";

const RANGE_VALUES: ReadonlySet<string> = new Set(["1d", "1w", "1y"]);
const isRange = (value: string): value is Range => RANGE_VALUES.has(value);

const MOCK_SERIES: LineChartSeries[] = [
  {
    id: "price",
    data: [1, 2, 3],
    label: "Price",
    stroke: "",
  },
];

const MOCK_RANGES = [
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1y", label: "1Y" },
] as const satisfies ReadonlyArray<{ value: Range; label: string }>;

function buildProps(overrides: Partial<LineChartProps<Range>> = {}): LineChartProps<Range> {
  return {
    series: MOCK_SERIES,
    selectedRange: "1d",
    onRangeChange: jest.fn(),
    ranges: MOCK_RANGES,
    accessibilityLabel: "Timeframe",
    ...overrides,
  };
}

describe("useLineChartViewModel", () => {
  it("applies a non-empty stroke to every series and overrides the input stroke", () => {
    const { result } = renderHook(() => useLineChartViewModel(buildProps()));

    expect(result.current.chartSeries).toHaveLength(1);
    expect(result.current.chartSeries[0]?.stroke).toEqual(expect.any(String));
    expect(result.current.chartSeries[0]?.stroke).not.toBe("");
    expect(result.current.chartSeries[0]?.id).toBe("price");
  });

  it("uses distinct strokes per color (success / error / muted)", () => {
    const { result: muted } = renderHook(() =>
      useLineChartViewModel(buildProps({ color: "muted" })),
    );
    const { result: success } = renderHook(() =>
      useLineChartViewModel(buildProps({ color: "success" })),
    );
    const { result: error } = renderHook(() =>
      useLineChartViewModel(buildProps({ color: "error" })),
    );

    const mutedStroke = muted.current.chartSeries[0]?.stroke;
    const successStroke = success.current.chartSeries[0]?.stroke;
    const errorStroke = error.current.chartSeries[0]?.stroke;

    expect(mutedStroke).toBeTruthy();
    expect(successStroke).toBeTruthy();
    expect(errorStroke).toBeTruthy();
    expect(new Set([mutedStroke, successStroke, errorStroke]).size).toBe(3);
  });

  it("forwards onRangeChange via handleSelectedChange", () => {
    const onRangeChange = jest.fn();
    const { result } = renderHook(() => useLineChartViewModel(buildProps({ onRangeChange })));

    act(() => {
      result.current.handleSelectedChange("1w");
    });

    expect(onRangeChange).toHaveBeenCalledWith("1w");
  });

  it("forwards the rangeSelectorTrailing slot unchanged and defaults it to undefined", () => {
    const { result: withoutTrailing } = renderHook(() => useLineChartViewModel(buildProps()));
    expect(withoutTrailing.current.rangeSelectorTrailing).toBeUndefined();

    const trailing = "trailing-node";
    const { result: withTrailing } = renderHook(() =>
      useLineChartViewModel(buildProps({ rangeSelectorTrailing: trailing })),
    );
    expect(withTrailing.current.rangeSelectorTrailing).toBe(trailing);
  });

  it("skips onRangeChange when isRangeValue rejects the emitted value", () => {
    const onRangeChange = jest.fn();
    const { result } = renderHook(() =>
      useLineChartViewModel(buildProps({ onRangeChange, isRangeValue: isRange })),
    );

    act(() => {
      result.current.handleSelectedChange("not-a-range");
    });

    expect(onRangeChange).not.toHaveBeenCalled();
  });

  it("forwards onRangeChange when isRangeValue accepts the emitted value", () => {
    const onRangeChange = jest.fn();
    const { result } = renderHook(() =>
      useLineChartViewModel(buildProps({ onRangeChange, isRangeValue: isRange })),
    );

    act(() => {
      result.current.handleSelectedChange("1y");
    });

    expect(onRangeChange).toHaveBeenCalledWith("1y");
  });

  it("defaults height to DEFAULT_LINE_CHART_HEIGHT and forwards isLoading/testID/ranges", () => {
    const { result } = renderHook(() =>
      useLineChartViewModel(buildProps({ isLoading: true, testID: "chart" })),
    );

    expect(result.current.height).toBe(DEFAULT_LINE_CHART_HEIGHT);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.testID).toBe("chart");
    expect(result.current.ranges).toEqual(MOCK_RANGES);
    expect(result.current.accessibilityLabel).toBe("Timeframe");
  });

  it("respects an explicit height override", () => {
    const { result } = renderHook(() => useLineChartViewModel(buildProps({ height: 120 })));

    expect(result.current.height).toBe(120);
  });

  it("defaults the empty label to the error translation and forwards an override", () => {
    const { result: withDefault } = renderHook(() => useLineChartViewModel(buildProps()));
    expect(withDefault.current.emptyLabel).toBe("Unable to load chart");

    const { result: withOverride } = renderHook(() =>
      useLineChartViewModel(buildProps({ emptyLabel: "Nothing here" })),
    );
    expect(withOverride.current.emptyLabel).toBe("Nothing here");
  });

  it("enables the scrubber, area and axes by default with a String value formatter", () => {
    const { result } = renderHook(() => useLineChartViewModel(buildProps()));

    expect(result.current.enableScrubber).toBe(true);
    expect(result.current.showScrubberTooltip).toBe(true);
    expect(result.current.showArea).toBe(true);
    expect(result.current.showXAxis).toBe(true);
    expect(result.current.showYAxis).toBe(true);
    expect(result.current.formatValue(42)).toBe("42");
  });

  it("forwards an explicit showScrubberTooltip=false", () => {
    const { result } = renderHook(() =>
      useLineChartViewModel(buildProps({ showScrubberTooltip: false })),
    );

    expect(result.current.showScrubberTooltip).toBe(false);
  });

  it("defaults points to the high/low extrema of the primary series", () => {
    // MOCK_SERIES data is [1, 2, 3] → min at index 0, max at index 2.
    const { result } = renderHook(() => useLineChartViewModel(buildProps()));

    expect(result.current.points).toEqual([
      { index: 2, value: 3, color: "success", labelPosition: "top", hidePoint: true },
      { index: 0, value: 1, color: "error", labelPosition: "bottom", hidePoint: true },
    ]);
  });

  it("renders no extrema markers when points is explicitly empty", () => {
    const { result } = renderHook(() => useLineChartViewModel(buildProps({ points: [] })));

    expect(result.current.points).toEqual([]);
  });

  it("forwards explicit points untouched", () => {
    const points = [{ index: 1, value: 2, color: "muted" as const }];
    const { result } = renderHook(() => useLineChartViewModel(buildProps({ points })));

    expect(result.current.points).toEqual(points);
  });

  it("defaults pointTooltipsOnly to false and exposes an empty pointTooltips map", () => {
    const { result } = renderHook(() => useLineChartViewModel(buildProps()));

    expect(result.current.pointTooltipsOnly).toBe(false);
    expect(result.current.showScrubberBeacons).toBe(true);
    expect(result.current.pointTooltips.size).toBe(0);
  });

  it("derives pointTooltips keyed by index from markers that carry a tooltip", () => {
    const tooltip = { rows: [{ label: "Received", value: "$5" }] };
    const points = [
      { index: 0, value: 1, color: "muted" as const },
      { index: 2, value: 3, color: "success" as const, tooltip },
    ];
    const { result } = renderHook(() =>
      useLineChartViewModel(buildProps({ points, pointTooltipsOnly: true })),
    );

    expect(result.current.pointTooltipsOnly).toBe(true);
    expect(result.current.pointTooltips.size).toBe(1);
    expect(result.current.pointTooltips.get(2)).toEqual(tooltip);
  });
});
