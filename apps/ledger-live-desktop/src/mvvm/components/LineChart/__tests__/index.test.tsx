import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { mockLumenChartResizeObserver } from "tests/utils/lumenChartTestUtils";
import { LineChart } from "../index";
import type { LineChartProps, LineChartSeries } from "../types";

const ORIGINAL_RESIZE_OBSERVER = global.ResizeObserver;

const MOCK_SERIES: LineChartSeries[] = [
  {
    id: "price",
    data: [1, 2, 5, 12, 56, 3, 33],
    label: "Price",
    stroke: "",
  },
];

const defaultProps: LineChartProps = {
  series: MOCK_SERIES,
  selectedRange: "1d",
  onRangeChange: jest.fn(),
};

function renderLineChart(props: Partial<LineChartProps> = {}) {
  return render(<LineChart {...defaultProps} {...props} />);
}

describe("LineChart", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLumenChartResizeObserver();
  });

  afterEach(() => {
    global.ResizeObserver = ORIGINAL_RESIZE_OBSERVER;
  });

  it("renders the range selector with the selected range checked", () => {
    renderLineChart();

    expect(screen.getByTestId("line-chart")).toBeVisible();
    expect(screen.getByTestId("line-chart-range-1d")).toHaveAttribute("aria-checked", "true");
    expect(screen.getByTestId("line-chart-range-1y")).toHaveAttribute("aria-checked", "false");
  });

  it("calls onRangeChange when a different range is selected", async () => {
    const onRangeChange = jest.fn();
    const { user } = renderLineChart({ onRangeChange });

    await user.click(screen.getByTestId("line-chart-range-1y"));

    expect(onRangeChange).toHaveBeenCalledWith("1y");
  });

  it("renders rangeSelectorTrailing alongside the range selector without losing its a11y label", () => {
    renderLineChart({
      rangeSelectorTrailing: <button data-testid="chart-trailing-slot">options</button>,
    });

    expect(screen.getByTestId("chart-trailing-slot")).toBeVisible();
    expect(screen.getByTestId("line-chart-range-selector")).toBeVisible();
    expect(screen.getByTestId("line-chart-range-1d")).toHaveAttribute("aria-checked", "true");
  });

  it("marks the chart as busy while keeping the range selector when isLoading is true", async () => {
    renderLineChart({ isLoading: true });

    await waitFor(() => {
      expect(screen.getByTestId("chart-svg")).toHaveAttribute("aria-busy", "true");
    });
    expect(screen.getByTestId("line-chart-range-selector")).toBeVisible();
  });

  it("renders the empty label via the chart when there is no data and it is not loading", async () => {
    renderLineChart({
      series: [{ id: "price", data: [], label: "Price", stroke: "" }],
      emptyLabel: "Failed to fetch prices",
    });

    expect(await screen.findByTestId("chart-empty-label")).toHaveTextContent(
      "Failed to fetch prices",
    );
  });

  it("renders only the provided custom ranges", () => {
    renderLineChart({ ranges: ["1d", "1w", "all"] });

    expect(screen.getByTestId("line-chart-range-1d")).toBeVisible();
    expect(screen.getByTestId("line-chart-range-1w")).toBeVisible();
    expect(screen.getByTestId("line-chart-range-all")).toBeVisible();
    expect(screen.queryByTestId("line-chart-range-6m")).not.toBeInTheDocument();
  });
});
