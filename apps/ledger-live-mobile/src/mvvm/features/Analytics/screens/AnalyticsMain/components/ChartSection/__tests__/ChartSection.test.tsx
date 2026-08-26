import React from "react";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { INITIAL_STATE as portfolioBalanceDisplayInitialState } from "~/reducers/portfolioBalanceDisplay";
import ChartSection from "..";
import { CHART_SECTION_TEST_IDS } from "../types";
import { usePortfolioAllAccounts } from "~/hooks/portfolio";
import { portfolioWithHistory } from "./fixtures";

jest.mock("~/hooks/portfolio", () => ({
  usePortfolioAllAccounts: jest.fn(),
}));

const mockUsePortfolioAllAccounts = jest.mocked(usePortfolioAllAccounts);

const btcAccount = genAccount("btc-1", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 0,
});

const withChartState =
  (
    balanceAvailable = true,
    countervalueComplete = balanceAvailable,
    isLoading = !balanceAvailable,
  ) =>
  (state: State): State =>
    withFlagOverrides({
      lwmWallet40: { params: { pnl: true } },
    })({
      ...state,
      accounts: { ...state.accounts, active: [btcAccount] },
      portfolioBalanceDisplay: {
        ...portfolioBalanceDisplayInitialState,
        displayedBalance: 5000,
        isBalanceAvailable: balanceAvailable,
        isCountervalueComplete: countervalueComplete,
        isLoading,
      },
      settings: {
        ...state.settings,
        selectedTimeRange: "week",
      },
    });

describe("ChartSection", () => {
  beforeEach(() => {
    mockUsePortfolioAllAccounts.mockReturnValue(portfolioWithHistory);
  });

  it("renders the balance header and chart when balance is available", () => {
    render(<ChartSection />, {
      overrideInitialState: withChartState(true),
    });

    expect(screen.getByTestId(CHART_SECTION_TEST_IDS.root)).toBeVisible();
    expect(screen.getByTestId(CHART_SECTION_TEST_IDS.header)).toBeVisible();
    expect(screen.getByTestId(CHART_SECTION_TEST_IDS.totalBalanceLabel)).toHaveTextContent(
      "Total balance",
    );
    expect(screen.getByTestId("analytics-balance-amount")).toBeVisible();
    expect(screen.getByTestId(CHART_SECTION_TEST_IDS.trend)).toBeVisible();
    expect(screen.getByTestId("analytics-chart")).toBeVisible();
  });

  it("shows a skeleton when the balance is unavailable", () => {
    render(<ChartSection />, {
      overrideInitialState: withChartState(false),
    });

    expect(screen.getByTestId("analytics-balance-skeleton")).toBeVisible();
    expect(screen.queryByTestId(CHART_SECTION_TEST_IDS.trend)).toBeNull();
  });

  it("shows unavailable values and hides the chart after an incomplete valuation settles", () => {
    render(<ChartSection />, {
      overrideInitialState: withChartState(false, false, false),
    });

    expect(screen.getByTestId("analytics-balance-unavailable")).toHaveTextContent("-");
    expect(screen.getByTestId(CHART_SECTION_TEST_IDS.trend)).toHaveTextContent("-");
    expect(screen.queryByTestId("analytics-chart")).toBeNull();
    expect(screen.queryByTestId("analytics-balance-skeleton")).toBeNull();
  });

  it("keeps the balance visible while hiding an incomplete historical trend", () => {
    mockUsePortfolioAllAccounts.mockReturnValue({
      ...portfolioWithHistory,
      countervalueChange: { percentage: null, value: 0 },
    });

    render(<ChartSection />, {
      overrideInitialState: withChartState(true),
    });

    expect(screen.getByTestId("analytics-balance-amount")).toBeVisible();
    expect(screen.getByTestId(CHART_SECTION_TEST_IDS.trend)).toHaveTextContent("-");
    expect(screen.queryByTestId("analytics-chart")).toBeNull();
  });
});
