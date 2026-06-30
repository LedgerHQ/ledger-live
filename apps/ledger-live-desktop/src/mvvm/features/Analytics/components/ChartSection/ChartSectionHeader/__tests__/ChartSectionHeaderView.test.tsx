import React from "react";
import { render, screen } from "tests/testSetup";
import { mockPortfolioBalanceInfo } from "LLD/hooks/__tests__/fixtures";
import { ChartSectionHeaderView } from "../ChartSectionHeaderView";
import type { ChartSectionHeaderViewModel } from "../types";

const baseViewModel: ChartSectionHeaderViewModel = {
  balance: mockPortfolioBalanceInfo.totalBalance,
  balanceAvailable: true,
  isLoading: false,
  balanceFormatter: value => ({
    currencyText: "$",
    decimalSeparator: ".",
    currencyPosition: "end",
    integerPart: String(value),
    decimalPart: "",
  }),
  discreet: false,
  percentageValue: 12.34,
  variationText: "+$567.00",
  rangeLabel: "1 week",
};

describe("ChartSectionHeaderView", () => {
  it("renders the balance and variation row", () => {
    render(<ChartSectionHeaderView viewModel={baseViewModel} />);

    expect(screen.getByTestId("analytics-chart-header")).toBeVisible();
    expect(screen.getByTestId("analytics-balance-amount")).toBeVisible();
    expect(screen.getByTestId("analytics-balance-trend-percentage")).toHaveTextContent("12.34%");
    expect(screen.getByTestId("analytics-balance-trend-value")).toHaveTextContent("+$567.00");
    expect(screen.getByTestId("analytics-balance-trend")).toHaveTextContent("1 week");
  });

  it("shows a skeleton when the balance is unavailable", () => {
    render(<ChartSectionHeaderView viewModel={{ ...baseViewModel, balanceAvailable: false }} />);

    expect(screen.getByTestId("analytics-balance-skeleton")).toBeVisible();
    expect(screen.queryByTestId("analytics-balance-trend")).not.toBeInTheDocument();
  });
});
