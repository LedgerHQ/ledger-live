import { act, renderHook } from "tests/testSetup";
import {
  LINE_CHART_RANGES,
  DEFAULT_LINE_CHART_HEIGHT,
  LINE_CHART_COLOR_TO_STROKE,
} from "../constants";
import { useLineChartViewModel } from "../useLineChartViewModel";
import type { LineChartPointMarker, LineChartProps, LineChartSeries } from "../types";

const MOCK_SERIES: LineChartSeries[] = [
  {
    id: "price",
    data: [1, 2, 3],
    label: "Price",
    stroke: "",
  },
];

const defaultProps: LineChartProps = {
  series: MOCK_SERIES,
  selectedRange: "1d",
  onRangeChange: jest.fn(),
};

describe("useLineChartViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("applies the theme stroke token to each chart series", () => {
    const { result } = renderHook(() => useLineChartViewModel(defaultProps));

    expect(result.current.chartSeries).toEqual([
      {
        ...MOCK_SERIES[0],
        stroke: LINE_CHART_COLOR_TO_STROKE.muted,
      },
    ]);
  });

  it("uses the success stroke token when color is success", () => {
    const { result } = renderHook(() =>
      useLineChartViewModel({
        ...defaultProps,
        color: "success",
      }),
    );

    expect(result.current.chartSeries[0]?.stroke).toBe(LINE_CHART_COLOR_TO_STROKE.success);
  });

  it("forwards loading and layout props", () => {
    const { result } = renderHook(() =>
      useLineChartViewModel({
        ...defaultProps,
        isLoading: true,
        height: 180,
        selectedRange: "1y",
      }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.height).toBe(180);
    expect(result.current.selectedRange).toBe("1y");
  });

  it("defaults the empty label to the error translation and forwards an override", () => {
    const { result: withDefault } = renderHook(() => useLineChartViewModel(defaultProps));
    expect(withDefault.current.emptyLabel).toBe("Unable to load chart");

    const { result: withOverride } = renderHook(() =>
      useLineChartViewModel({ ...defaultProps, emptyLabel: "Nothing here" }),
    );
    expect(withOverride.current.emptyLabel).toBe("Nothing here");
  });

  it("forwards the rangeSelectorTrailing slot unchanged and defaults it to undefined", () => {
    const { result: withoutTrailing } = renderHook(() => useLineChartViewModel(defaultProps));
    expect(withoutTrailing.current.rangeSelectorTrailing).toBeUndefined();

    const trailing = "trailing-node";
    const { result: withTrailing } = renderHook(() =>
      useLineChartViewModel({ ...defaultProps, rangeSelectorTrailing: trailing }),
    );
    expect(withTrailing.current.rangeSelectorTrailing).toBe(trailing);
  });

  it("calls onRangeChange when handleSelectedChange is invoked", () => {
    const onRangeChange = jest.fn();
    const { result } = renderHook(() =>
      useLineChartViewModel({
        ...defaultProps,
        onRangeChange,
      }),
    );

    act(() => {
      result.current.handleSelectedChange("1y");
    });

    expect(onRangeChange).toHaveBeenCalledWith("1y");
  });

  it("builds translated range buttons for every supported range", () => {
    const { result } = renderHook(() => useLineChartViewModel(defaultProps));

    expect(result.current.rangeButtons).toHaveLength(LINE_CHART_RANGES.length);
    expect(result.current.rangeButtons.map(button => button.value)).toEqual([...LINE_CHART_RANGES]);
    expect(result.current.rangeButtons.find(button => button.value === "all")?.label).toBe("ALL");
    expect(result.current.rangeButtons.find(button => button.value === "1d")?.label).toBe("1D");
    expect(result.current.rangeButtons.find(button => button.value === "6m")?.label).toBe("6M");
    expect(result.current.rangeButtons.find(button => button.value === "5y")?.label).toBe("5Y");
    expect(result.current.rangeSelectorLabel).toBe("Select time range");
  });

  it("defaults height to DEFAULT_LINE_CHART_HEIGHT", () => {
    const { result } = renderHook(() => useLineChartViewModel(defaultProps));

    expect(result.current.height).toBe(DEFAULT_LINE_CHART_HEIGHT);
  });

  it("derives a pointTooltips map keyed by index for markers that carry a tooltip", () => {
    const points: LineChartPointMarker[] = [
      { index: 0, value: 1, tooltip: { rows: [{ label: "Received", value: "$1" }] } },
      { index: 2, value: 3 },
    ];

    const { result } = renderHook(() => useLineChartViewModel({ ...defaultProps, points }));

    expect(result.current.pointTooltips.size).toBe(1);
    expect(result.current.pointTooltips.get(0)?.rows).toEqual([{ label: "Received", value: "$1" }]);
    expect(result.current.pointTooltips.has(2)).toBe(false);
  });
});
