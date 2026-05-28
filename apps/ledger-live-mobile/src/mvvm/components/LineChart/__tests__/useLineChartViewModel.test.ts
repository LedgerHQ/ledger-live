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
});
