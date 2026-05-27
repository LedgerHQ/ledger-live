import React from "react";
import { render, screen } from "tests/testSetup";
import PortfolioBalanceSummary from "./GlobalSummary";
import { usePortfolio } from "~/renderer/actions/portfolio";
import {
  defaultPortfolio,
  mockCounterValue,
  mockPortfolioBalanceInfo,
} from "LLD/hooks/__tests__/fixtures";

jest.mock("~/renderer/actions/portfolio", () => ({
  usePortfolio: jest.fn(),
}));

jest.mock("~/renderer/components/Chart", () => ({
  __esModule: true,
  GraphTrackingScreenName: { Portfolio: "Portfolio" },
  default: jest.fn(({ data, tickXScale }) => (
    <div
      data-testid="chart"
      data-latest-value={data[data.length - 1]?.value}
      data-range={tickXScale}
    />
  )),
}));

jest.mock("~/renderer/components/BalanceInfos", () => ({
  __esModule: true,
  default: jest.fn(({ totalBalance, isAvailable, valueChange }) => (
    <div
      data-testid="balance-infos"
      data-total-balance={totalBalance}
      data-is-available={String(isAvailable)}
      data-value-change={valueChange.value}
      data-percentage={valueChange.percentage}
    />
  )),
}));

const mockUsePortfolio = jest.mocked(usePortfolio);

describe("PortfolioBalanceSummary", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePortfolio.mockReturnValue({
      ...defaultPortfolio,
      balanceHistory: [
        { date: new Date("2026-05-20"), value: 100 },
        { date: new Date("2026-05-21"), value: 200 },
      ],
      countervalueChange: { percentage: 1, value: 2 },
      range: "month",
    });
  });

  it("should keep chart data from the selected Analytics range while displaying injected Portfolio V4 balance info", () => {
    render(
      <PortfolioBalanceSummary
        counterValue={mockCounterValue}
        chartColor="#000"
        range="month"
        isWallet40
        balanceInfo={mockPortfolioBalanceInfo}
      />,
    );

    expect(screen.getByTestId("chart")).toHaveAttribute("data-latest-value", "200");
    expect(screen.getByTestId("chart")).toHaveAttribute("data-range", "month");
    expect(screen.getByTestId("balance-infos")).toHaveAttribute(
      "data-total-balance",
      String(mockPortfolioBalanceInfo.totalBalance),
    );
    expect(screen.getByTestId("balance-infos")).toHaveAttribute(
      "data-value-change",
      String(mockPortfolioBalanceInfo.valueChange.value),
    );
    expect(screen.getByTestId("balance-infos")).toHaveAttribute(
      "data-percentage",
      String(mockPortfolioBalanceInfo.valueChange.percentage),
    );
  });

  it("should fall back to the Analytics portfolio when no balance info is injected", () => {
    render(
      <PortfolioBalanceSummary
        counterValue={mockCounterValue}
        chartColor="#000"
        range="month"
        isWallet40
      />,
    );

    expect(screen.getByTestId("balance-infos")).toHaveAttribute("data-total-balance", "200");
    expect(screen.getByTestId("balance-infos")).toHaveAttribute("data-value-change", "2");
    expect(screen.getByTestId("balance-infos")).toHaveAttribute("data-percentage", "1");
  });
});
