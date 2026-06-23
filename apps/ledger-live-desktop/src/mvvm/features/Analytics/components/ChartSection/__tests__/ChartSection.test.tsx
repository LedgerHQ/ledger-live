import React from "react";
import { render, screen } from "tests/testSetup";
import { mockLumenChartResizeObserver } from "tests/utils/lumenChartTestUtils";
import { usePortfolio } from "~/renderer/actions/portfolio";
import {
  defaultPortfolio,
  mockCounterValue,
  mockPortfolioBalanceInfo,
} from "LLD/hooks/__tests__/fixtures";
import { INITIAL_STATE } from "~/renderer/reducers/settings";
import { ChartSection } from "../index";

jest.mock("~/renderer/actions/portfolio");

const mockUsePortfolio = jest.mocked(usePortfolio);
const ORIGINAL_RESIZE_OBSERVER = global.ResizeObserver;

const initialState = {
  settings: {
    ...INITIAL_STATE,
    counterValue: "USD",
    counterValueCurrency: mockCounterValue,
    selectedTimeRange: "week" as const,
  },
};

describe("ChartSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLumenChartResizeObserver();
    mockUsePortfolio.mockReturnValue({
      ...defaultPortfolio,
      balanceHistory: [
        { date: new Date("2026-01-01T00:00:00.000Z"), value: 1000 },
        { date: new Date("2026-01-02T00:00:00.000Z"), value: 1200 },
      ],
      balanceAvailable: true,
    });
  });

  afterEach(() => {
    global.ResizeObserver = ORIGINAL_RESIZE_OBSERVER;
  });

  it("renders the portfolio balance, trend, and chart for the selected range", () => {
    render(<ChartSection balanceInfo={mockPortfolioBalanceInfo} />, { initialState });

    expect(screen.getByTestId("analytics-chart-section")).toBeVisible();
    expect(screen.getByTestId("analytics-balance-amount")).toBeVisible();
    expect(screen.getByTestId("analytics-balance-trend")).toHaveTextContent("1W");
    expect(screen.getByTestId("line-chart-range-1w")).toHaveAttribute("aria-checked", "true");
  });

  it("shows a skeleton when the balance is unavailable", () => {
    render(<ChartSection balanceInfo={{ ...mockPortfolioBalanceInfo, isAvailable: false }} />, {
      initialState,
    });

    expect(screen.getByTestId("analytics-balance-skeleton")).toBeVisible();
    expect(screen.queryByTestId("analytics-balance-trend")).not.toBeInTheDocument();
  });
});
