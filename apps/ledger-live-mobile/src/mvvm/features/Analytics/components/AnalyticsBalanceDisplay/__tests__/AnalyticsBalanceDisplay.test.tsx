import React from "react";
import { render, screen } from "@tests/test-renderer";
import { AnalyticsBalanceDisplay } from "..";
import { State } from "~/reducers/types";
import { INITIAL_STATE as portfolioBalanceDisplayInitialState } from "~/reducers/portfolioBalanceDisplay";

const withBalance =
  (overrides: Partial<State["portfolioBalanceDisplay"]> = {}) =>
  (state: State): State => ({
    ...state,
    portfolioBalanceDisplay: {
      ...portfolioBalanceDisplayInitialState,
      ...overrides,
    },
  });

describe("AnalyticsBalanceDisplay", () => {
  describe("when balance is not yet available", () => {
    it("renders the skeleton placeholder", () => {
      render(<AnalyticsBalanceDisplay />, {
        overrideInitialState: withBalance({ isBalanceAvailable: false }),
      });

      expect(screen.getByTestId("analytics-balance-skeleton")).toBeVisible();
      expect(screen.queryByTestId("analytics-balance-amount")).toBeNull();
    });
  });

  describe("when balance is available", () => {
    it("renders AmountDisplay with the slice balance", () => {
      render(<AnalyticsBalanceDisplay />, {
        overrideInitialState: withBalance({ isBalanceAvailable: true, displayedBalance: 5000 }),
      });

      expect(screen.getByTestId("analytics-balance-amount")).toBeVisible();
      expect(screen.queryByTestId("analytics-balance-skeleton")).toBeNull();
    });
  });

  describe("hoveredValue prop", () => {
    it("renders AmountDisplay when hoveredValue is provided, even if slice balance is 0", () => {
      render(<AnalyticsBalanceDisplay hoveredValue={9999} />, {
        overrideInitialState: withBalance({ isBalanceAvailable: true, displayedBalance: 0 }),
      });

      expect(screen.getByTestId("analytics-balance-amount")).toBeVisible();
    });

    it("does not show skeleton when hoveredValue is provided and balance is available", () => {
      render(<AnalyticsBalanceDisplay hoveredValue={42} />, {
        overrideInitialState: withBalance({ isBalanceAvailable: true }),
      });

      expect(screen.queryByTestId("analytics-balance-skeleton")).toBeNull();
    });
  });
});
