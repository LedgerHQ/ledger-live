import React from "react";
import { render, screen } from "tests/testSetup";
import { mockLumenChartResizeObserver } from "tests/utils/lumenChartTestUtils";
import { mockPortfolioBalanceInfo } from "LLD/hooks/__tests__/fixtures";
import { ChartSection } from "../index";
import { chartSectionInitialState, portfolioWithHistory } from "./fixtures";

const ORIGINAL_RESIZE_OBSERVER = global.ResizeObserver;

describe("ChartSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLumenChartResizeObserver();
  });

  afterEach(() => {
    global.ResizeObserver = ORIGINAL_RESIZE_OBSERVER;
  });

  it("renders the portfolio balance, trend, and chart for the selected range", () => {
    render(
      <ChartSection
        balanceInfo={mockPortfolioBalanceInfo}
        portfolio={portfolioWithHistory}
        isLoading={false}
      />,
      { initialState: chartSectionInitialState },
    );

    expect(screen.getByTestId("analytics-chart-section")).toBeVisible();
    expect(screen.getByTestId("analytics-chart-header")).toBeVisible();
    expect(screen.getByTestId("analytics-balance-amount")).toBeVisible();
    expect(screen.getByTestId("analytics-balance-trend")).toHaveTextContent("1 week");
    expect(screen.getByTestId("line-chart-range-1w")).toHaveAttribute("aria-checked", "true");
  });

  it("shows a skeleton when the balance is unavailable", () => {
    render(
      <ChartSection
        balanceInfo={{ ...mockPortfolioBalanceInfo, isAvailable: false }}
        portfolio={portfolioWithHistory}
        isLoading={false}
      />,
      { initialState: chartSectionInitialState },
    );

    expect(screen.getByTestId("analytics-balance-skeleton")).toBeVisible();
    expect(screen.queryByTestId("analytics-balance-trend")).not.toBeInTheDocument();
  });

  it("hides the chart and shows unavailable values when countervalues are incomplete", () => {
    render(
      <ChartSection
        balanceInfo={mockPortfolioBalanceInfo}
        portfolio={{ ...portfolioWithHistory, countervalueComplete: false }}
        isLoading={false}
      />,
      { initialState: chartSectionInitialState },
    );

    expect(screen.getByTestId("analytics-balance-unavailable")).toBeVisible();
    expect(screen.queryByTestId("line-chart-range-1w")).not.toBeInTheDocument();
  });

  it("keeps the balance visible but hides an incomplete historical trend", () => {
    render(
      <ChartSection
        balanceInfo={mockPortfolioBalanceInfo}
        portfolio={{
          ...portfolioWithHistory,
          countervalueChange: { percentage: null, value: 0 },
        }}
        isLoading={false}
      />,
      { initialState: chartSectionInitialState },
    );

    expect(screen.getByTestId("analytics-balance-amount")).toBeVisible();
    expect(screen.getByTestId("analytics-variation-unavailable")).toHaveTextContent("-");
    expect(screen.queryByTestId("line-chart-range-1w")).not.toBeInTheDocument();
  });
});
