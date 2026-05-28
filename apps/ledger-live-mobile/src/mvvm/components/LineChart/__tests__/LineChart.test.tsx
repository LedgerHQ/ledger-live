import React from "react";
import { render, screen } from "@tests/test-renderer";
import { LineChart } from "..";
import type { LineChartProps, LineChartSeries } from "../types";

type Range = "1d" | "1w" | "1y";

const RANGE_VALUES: ReadonlySet<string> = new Set(["1d", "1w", "1y"]);
const isRange = (value: string): value is Range => RANGE_VALUES.has(value);

const MOCK_SERIES: LineChartSeries[] = [
  {
    id: "price",
    data: [1, 2, 5, 12, 56, 3, 33],
    label: "Price",
    stroke: "",
  },
];

const MOCK_RANGES = [
  { value: "1d", label: "1D" },
  { value: "1w", label: "1W" },
  { value: "1y", label: "1Y" },
] as const satisfies ReadonlyArray<{ value: Range; label: string }>;

function renderLineChart(props: Partial<LineChartProps<Range>> = {}) {
  const defaultProps: LineChartProps<Range> = {
    series: MOCK_SERIES,
    selectedRange: "1d",
    onRangeChange: jest.fn(),
    ranges: MOCK_RANGES,
    accessibilityLabel: "Timeframe selector",
    testID: "line-chart",
  };
  return render(<LineChart {...defaultProps} {...props} />);
}

describe("LineChart", () => {
  it("renders the chart container with the provided testID and a button per range", () => {
    renderLineChart();

    expect(screen.getByTestId("line-chart")).toBeOnTheScreen();
    expect(screen.getByText("1D")).toBeVisible();
    expect(screen.getByText("1W")).toBeVisible();
    expect(screen.getByText("1Y")).toBeVisible();
  });

  it("invokes onRangeChange with the matching value when a range button is pressed", async () => {
    const onRangeChange = jest.fn();
    const { user } = renderLineChart({ onRangeChange });

    await user.press(screen.getByText("1Y"));

    expect(onRangeChange).toHaveBeenCalledWith("1y");
  });

  it("exposes the segmented control via the provided accessibilityLabel", () => {
    renderLineChart({ accessibilityLabel: "Choose timeframe" });

    expect(screen.getByLabelText("Choose timeframe")).toBeOnTheScreen();
  });

  it("renders the Skeleton while isLoading", () => {
    renderLineChart({ isLoading: true });

    expect(screen.getByTestId("skeleton")).toBeOnTheScreen();
    expect(screen.getByText("1D")).toBeVisible();
  });

  it("skips onRangeChange when isRangeValue rejects an emitted value", async () => {
    const onRangeChange = jest.fn();
    const { user } = renderLineChart({ onRangeChange, isRangeValue: isRange });

    await user.press(screen.getByText("1W"));

    expect(onRangeChange).toHaveBeenCalledWith("1w");
    expect(isRange("1w")).toBe(true);
  });
});
