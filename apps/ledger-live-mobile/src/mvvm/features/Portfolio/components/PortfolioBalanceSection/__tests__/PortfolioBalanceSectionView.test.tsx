import React from "react";
import { render, screen } from "@tests/test-renderer";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { PortfolioBalanceSectionView } from "../PortfolioBalanceSectionView";
import { PortfolioBalanceSectionViewProps } from "../types";

const usd = getFiatCurrencyByTicker("USD");

const baseProps: PortfolioBalanceSectionViewProps = {
  state: "normal",
  balance: 1000,
  countervalueChange: { percentage: 1.5, value: 150 },
  unit: usd.units[0],
  isBalanceAvailable: true,
  isLoading: false,
  shouldDisplayBalanceRefreshRework: false,
  onToggleDiscreetMode: jest.fn(),
};

const renderView = (overrides: Partial<PortfolioBalanceSectionViewProps> = {}) =>
  render(<PortfolioBalanceSectionView {...baseProps} {...overrides} />);

describe("PortfolioBalanceSectionView", () => {
  describe("state rendering", () => {
    it("should render balance and analytics pill when state is normal and balance is available", () => {
      renderView();

      expect(screen.getByTestId("portfolio-balance-normal")).toBeVisible();
      expect(screen.getByTestId("portfolio-balance-amount")).toBeVisible();
      expect(screen.getByTestId("portfolio-balance-analytics-pill")).toBeVisible();
    });

    it("should render noSigner text when state is noSigner", () => {
      renderView({ state: "noSigner" });

      expect(screen.getByTestId("portfolio-balance-noSigner")).toBeVisible();
      expect(screen.queryByTestId("portfolio-balance-amount")).toBeNull();
    });

    it("should render noAccounts text when state is noAccounts", () => {
      renderView({ state: "noAccounts" });

      expect(screen.getByTestId("portfolio-balance-noAccounts")).toBeVisible();
      expect(screen.queryByTestId("portfolio-balance-amount")).toBeNull();
    });
  });

  describe("loading states", () => {
    it("should use loading testID and hide analytics pill when balance is not available", () => {
      renderView({ isBalanceAvailable: false });

      expect(screen.getByTestId("portfolio-balance-loading")).toBeVisible();
      expect(screen.queryByTestId("portfolio-balance-normal")).toBeNull();
      expect(screen.queryByTestId("portfolio-balance-analytics-pill")).toBeNull();
    });

    it("should show shimmer when balance refresh rework is enabled and loading", () => {
      renderView({
        isBalanceAvailable: false,
        isLoading: true,
        shouldDisplayBalanceRefreshRework: true,
      });

      expect(screen.getByTestId("portfolio-balance-loading")).toBeVisible();
      expect(screen.getByTestId("portfolio-balance-amount")).toBeVisible();
      expect(screen.queryByTestId("portfolio-balance-analytics-pill")).toBeNull();
    });
  });
});
