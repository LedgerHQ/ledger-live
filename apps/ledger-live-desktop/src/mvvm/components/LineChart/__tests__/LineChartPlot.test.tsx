import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { hoverChartSvg, mockLumenChartResizeObserver } from "tests/utils/lumenChartTestUtils";
import { LineChartPlot } from "../LineChartPlot";
import type { LineChartPlotContentProps } from "../LineChartPlotContent";
import type { LineChartPointMarker, LineChartSeries } from "../types";

const ORIGINAL_RESIZE_OBSERVER = global.ResizeObserver;

const MOCK_SERIES: LineChartSeries[] = [
  {
    id: "price",
    data: [1, 2, 3, 4],
    label: "Price",
    stroke: "#000000",
  },
];

const defaultProps: LineChartPlotContentProps = {
  height: 240,
  isLoading: false,
  isError: false,
  chartSeries: MOCK_SERIES,
  points: [],
  pointTooltips: new Map(),
  enableScrubber: true,
  formatValue: value => `$${value}`,
  showScrubberTooltip: true,
  pointTooltipsOnly: false,
  showArea: true,
  showXAxis: true,
  showYAxis: true,
};

describe("LineChartPlot", () => {
  beforeEach(() => {
    mockLumenChartResizeObserver();
  });

  afterEach(() => {
    global.ResizeObserver = ORIGINAL_RESIZE_OBSERVER;
  });

  it("shows the loading skeleton when isLoading is true", () => {
    render(<LineChartPlot {...defaultProps} isLoading />);

    expect(screen.getByTestId("line-chart-loading")).toBeVisible();
    expect(screen.queryByTestId("line-chart-error")).not.toBeInTheDocument();
  });

  it("shows the default error message when isError is true", () => {
    render(<LineChartPlot {...defaultProps} isError />);

    expect(screen.getByTestId("line-chart-error")).toBeVisible();
    expect(screen.getByText("Unable to load chart")).toBeVisible();
  });

  it("shows a custom error message when provided", () => {
    render(<LineChartPlot {...defaultProps} isError errorMessage="Network unavailable" />);

    expect(screen.getByText("Network unavailable")).toBeVisible();
  });

  it("renders the chart plot by default", () => {
    render(<LineChartPlot {...defaultProps} />);

    expect(screen.queryByTestId("line-chart-loading")).not.toBeInTheDocument();
    expect(screen.queryByTestId("line-chart-error")).not.toBeInTheDocument();
    expect(screen.getByTestId("line-chart-plot")).toBeVisible();
  });

  it("renders the scrubber after hovering the chart when enableScrubber is true", async () => {
    render(<LineChartPlot {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("chart-svg")).toBeVisible();
    });

    const chart = screen.getByTestId("chart-svg");
    expect(chart).toHaveAttribute("tabindex", "0");

    hoverChartSvg(chart);

    await waitFor(() => {
      expect(screen.getByTestId("scrubber")).toBeVisible();
    });
  });

  it("does not render the scrubber when enableScrubber is false", async () => {
    render(<LineChartPlot {...defaultProps} enableScrubber={false} />);

    await waitFor(() => {
      expect(screen.getByTestId("chart-svg")).toBeVisible();
    });

    const chart = screen.getByTestId("chart-svg");
    expect(chart).not.toHaveAttribute("tabindex", "0");

    hoverChartSvg(chart);

    expect(screen.queryByTestId("scrubber")).not.toBeInTheDocument();
  });

  it("renders no point markers when points is empty", async () => {
    render(<LineChartPlot {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByTestId("chart-svg")).toBeVisible();
    });
    expect(screen.queryAllByTestId("point-group")).toHaveLength(0);
  });

  it("renders one Point per marker in the points list", async () => {
    const points: LineChartPointMarker[] = [
      { index: 0, value: 1, labelPosition: "bottom", color: "error" },
      { index: 3, value: 4, labelPosition: "top", color: "success" },
    ];

    render(<LineChartPlot {...defaultProps} points={points} />);

    await waitFor(() => {
      expect(screen.getAllByTestId("point-group")).toHaveLength(2);
    });
  });

  it("labels markers with formatValue when no explicit label is provided", async () => {
    const points: LineChartPointMarker[] = [{ index: 1, value: 2 }];

    render(<LineChartPlot {...defaultProps} points={points} />);

    await waitFor(() => {
      expect(screen.getByText("$2")).toBeVisible();
    });
  });

  it("fills the area under the line when showArea is true", async () => {
    render(<LineChartPlot {...defaultProps} showArea />);

    await waitFor(() => {
      expect(screen.getByTestId("line-area")).toBeVisible();
    });
  });

  it("does not fill the area when showArea is false", async () => {
    render(<LineChartPlot {...defaultProps} showArea={false} />);

    await waitFor(() => {
      expect(screen.getByTestId("chart-svg")).toBeVisible();
    });
    expect(screen.queryByTestId("line-area")).not.toBeInTheDocument();
  });

  it("renders the x-axis when showXAxis is true and hides it when false", async () => {
    const { rerender } = render(<LineChartPlot {...defaultProps} showXAxis />);

    await waitFor(() => {
      expect(screen.getByTestId("x-axis")).toBeVisible();
    });

    rerender(<LineChartPlot {...defaultProps} showXAxis={false} />);
    await waitFor(() => {
      expect(screen.queryByTestId("x-axis")).not.toBeInTheDocument();
    });
  });

  it("renders the y-axis when showYAxis is true and hides it when false", async () => {
    const { rerender } = render(<LineChartPlot {...defaultProps} showYAxis />);

    await waitFor(() => {
      expect(screen.getByTestId("y-axis")).toBeVisible();
    });

    rerender(<LineChartPlot {...defaultProps} showYAxis={false} />);
    await waitFor(() => {
      expect(screen.queryByTestId("y-axis")).not.toBeInTheDocument();
    });
  });
});
