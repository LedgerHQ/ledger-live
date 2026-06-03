import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { LineChart } from "../index";
import type { LineChartProps, LineChartSeries } from "../types";

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

  it("shows the loading skeleton when isLoading is true", () => {
    renderLineChart({ isLoading: true });

    expect(screen.getByTestId("line-chart-loading")).toBeVisible();
    expect(screen.getByTestId("line-chart-range-selector")).toBeVisible();
  });

  it("shows the error state when isError is true", async () => {
    renderLineChart({ isError: true, errorMessage: "Failed to fetch prices" });

    await waitFor(() => {
      expect(screen.getByTestId("line-chart-error")).toBeVisible();
    });
    expect(screen.getByText("Failed to fetch prices")).toBeVisible();
  });
});
