import React from "react";
import { render, screen } from "@tests/test-renderer";
import { getFiatCurrencyByTicker } from "@ledgerhq/live-common/currencies/index";
import { PortfolioBalanceSectionView } from "../PortfolioBalanceSectionView";
import { PortfolioBalanceSectionViewProps } from "../types";

let mockAmountDisplaySize: "sm" | "md" | undefined;
jest.mock("@ledgerhq/lumen-ui-rnative", () => {
  const actual = jest.requireActual("@ledgerhq/lumen-ui-rnative");
  const ReactActual = jest.requireActual("react");
  const { Text } = jest.requireActual("react-native");

  return {
    ...actual,
    AmountDisplay: ({ size, testID }: { size?: "sm" | "md"; testID?: string }) => {
      mockAmountDisplaySize = size;
      return ReactActual.createElement(Text, { testID }, "amount");
    },
  };
});

const usd = getFiatCurrencyByTicker("USD");

const baseProps: PortfolioBalanceSectionViewProps = {
  state: "normal",
  balance: 1000,
  countervalueChange: { percentage: 1.5, value: 150 },
  unit: usd.units[0],
  isBalanceAvailable: true,
  isAnalyticPillVisible: true,
  isLoading: false,
  shouldDisplayBalanceRefreshRework: false,
  onToggleDiscreetMode: jest.fn(),
};

const renderView = (overrides: Partial<PortfolioBalanceSectionViewProps> = {}) =>
  render(<PortfolioBalanceSectionView {...baseProps} {...overrides} />);

describe("PortfolioBalanceSectionView", () => {
  beforeEach(() => {
    mockAmountDisplaySize = undefined;
  });

  describe("state rendering", () => {
    it("should render balance and analytics pill when state is normal and balance is available", () => {
      renderView();

      expect(screen.getByTestId("portfolio-balance-normal")).toBeVisible();
      expect(screen.getByTestId("portfolio-balance-amount")).toBeVisible();
      expect(mockAmountDisplaySize).toBe("md");
      expect(screen.getByTestId("portfolio-balance-analytics-pill")).toBeVisible();
    });

    it("should use small amount size when balance has more than nine integer digits", () => {
      renderView({ balance: 1_000_000_000 });

      expect(screen.getByTestId("portfolio-balance-amount")).toBeVisible();
      expect(mockAmountDisplaySize).toBe("sm");
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
      renderView({ isBalanceAvailable: false, isAnalyticPillVisible: false });

      expect(screen.getByTestId("portfolio-balance-loading")).toBeVisible();
      expect(screen.getByTestId("portfolio-placeholder-balance")).toBeVisible();
      expect(screen.queryByTestId("portfolio-balance-amount")).toBeNull();
      expect(screen.queryByTestId("portfolio-balance-normal")).toBeNull();
      expect(screen.queryByTestId("portfolio-balance-analytics-pill")).toBeNull();
    });

    it("should show skeleton when balance refresh rework is enabled and loading", () => {
      renderView({
        isBalanceAvailable: false,
        isAnalyticPillVisible: true,
        isLoading: true,
        shouldDisplayBalanceRefreshRework: true,
      });

      expect(screen.getByTestId("portfolio-balance-loading")).toBeVisible();
      expect(screen.getByTestId("portfolio-placeholder-balance")).toBeVisible();
      expect(screen.queryByTestId("portfolio-balance-amount")).toBeNull();
      expect(screen.getByTestId("portfolio-balance-analytics-pill")).toBeVisible();
    });

    it("should show shimmer on amount when balance is available and loading with rework enabled", () => {
      renderView({
        isBalanceAvailable: true,
        isLoading: true,
        shouldDisplayBalanceRefreshRework: true,
      });

      expect(screen.getByTestId("portfolio-balance-normal")).toBeVisible();
      expect(screen.getByTestId("portfolio-balance-amount")).toBeVisible();
      expect(screen.queryByTestId("portfolio-placeholder-balance")).toBeNull();
      expect(screen.getByTestId("portfolio-balance-analytics-pill")).toBeVisible();
    });
  });
});
