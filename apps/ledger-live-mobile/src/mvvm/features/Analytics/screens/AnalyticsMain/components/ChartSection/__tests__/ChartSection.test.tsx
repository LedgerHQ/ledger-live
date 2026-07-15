import React from "react";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
import { genAccount } from "@ledgerhq/live-common/mock/account";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { State } from "~/reducers/types";
import { INITIAL_STATE as portfolioBalanceDisplayInitialState } from "~/reducers/portfolioBalanceDisplay";
import ChartSection from "..";
import { CHART_SECTION_TEST_IDS } from "../types";

const btcAccount = genAccount("btc-1", {
  currency: getCryptoCurrencyById("bitcoin"),
  operationsSize: 0,
});

const withChartState =
  (balanceAvailable = true) =>
  (state: State): State =>
    withFlagOverrides({
      lwmWallet40: { enabled: true, params: { pnl: true } },
    })({
      ...state,
      accounts: { ...state.accounts, active: [btcAccount] },
      portfolioBalanceDisplay: {
        ...portfolioBalanceDisplayInitialState,
        displayedBalance: 5000,
        isBalanceAvailable: balanceAvailable,
        isLoading: false,
      },
      settings: {
        ...state.settings,
        selectedTimeRange: "week",
      },
    });

describe("ChartSection", () => {
  it("renders the balance header and chart when balance is available", () => {
    render(<ChartSection />, {
      overrideInitialState: withChartState(true),
    });

    expect(screen.getByTestId(CHART_SECTION_TEST_IDS.root)).toBeVisible();
    expect(screen.getByTestId(CHART_SECTION_TEST_IDS.header)).toBeVisible();
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
});
