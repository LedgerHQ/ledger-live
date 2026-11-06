import React from "react";
import { render, screen, within } from "@testing-library/react";
import { FiatCurrencyTickerSchema } from "@domain/entity-currency-fiat";
import { AccountAnalyticsView } from "./AccountAnalyticsView";
import { analyticsCatalog } from "./analytics.mock";
import type { AccountAnalyticsViewProps } from "./AccountAnalytics.types";
import type { AnalyticsSelection } from "./types";

function createProps(
  selection: AnalyticsSelection = { assetId: null, accountId: null, metric: "balance" },
): AccountAnalyticsViewProps {
  const scope = {
    assetId: null,
    accountId: null,
    fiatCurrencyId: FiatCurrencyTickerSchema.parse("USD"),
    positionIds: [],
  };
  return {
    model: {
      selection,
      context: { ...selection, ...scope, period: "1d" },
      contextKey: "analytics-feedback",
      balance: {
        status: "ready",
        data: { amount: 0, variation: { amount: 0, ratio: 0 }, history: [] },
      },
      assets: analyticsCatalog.assets,
      accounts: analyticsCatalog.accounts,
      selectAsset: jest.fn(),
      selectAccount: jest.fn(),
      selectMetric: jest.fn(),
      retry: jest.fn(),
    },
    labels: {
      assets: "Asset filter",
      accounts: "Account filter",
      allAssets: "All assets",
      allAccounts: "All accounts",
      error: "Unable to load analytics",
      unavailable: "Data unavailable",
      retry: "Retry",
    },
    scope,
    catalogStatus: "ready",
    onRetry: jest.fn(),
    renderBalance: ({ filters, statusContent }) => (
      <section aria-label="Chart">
        {filters}
        {statusContent}
      </section>
    ),
    renderPnl: ({ statusContent }) => (
      <section aria-label="Profit and loss">{statusContent}</section>
    ),
  };
}

describe("Account Analytics feedback", () => {
  it("should preserve unavailable PnL feedback when only the chart fails", () => {
    const props = createProps();
    const { rerender } = render(<AccountAnalyticsView {...props} />);
    const pnl = screen.getByRole("region", { name: "Profit and loss" });
    expect(within(pnl).getByRole("status")).toHaveTextContent("Data unavailable");
    rerender(
      <AccountAnalyticsView {...props} model={{ ...props.model, balance: { status: "error" } }} />,
    );
    expect(
      within(screen.getByRole("region", { name: "Chart" })).getByRole("alert"),
    ).toHaveTextContent("Unable to load analytics");
    expect(within(pnl).getByRole("status")).toHaveTextContent("Data unavailable");
    expect(within(pnl).queryByRole("alert")).not.toBeInTheDocument();
    expect(within(pnl).queryByRole("button", { name: "Retry" })).not.toBeInTheDocument();
    expect(
      within(screen.getByRole("region", { name: "Chart" })).getByRole("button", { name: "Retry" }),
    ).toBeInTheDocument();
  });

  it("should announce the PnL error when its catalog cannot be loaded", () => {
    const props = createProps();
    render(
      <AccountAnalyticsView
        {...props}
        catalogStatus="error"
        model={{ ...props.model, balance: { status: "error" } }}
      />,
    );
    expect(
      within(screen.getByRole("region", { name: "Profit and loss" })).getByRole("alert"),
    ).toHaveTextContent("Unable to load analytics");
  });
});

describe("Account Analytics filters", () => {
  it("should offer the account filter only once an asset is selected", () => {
    const { rerender } = render(<AccountAnalyticsView {...createProps()} />);
    expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("All assets");
    expect(screen.queryByTestId("analytics-account-filter")).not.toBeInTheDocument();

    rerender(
      <AccountAnalyticsView
        {...createProps({ assetId: "eth", accountId: "eth-account", metric: "balance" })}
      />,
    );

    expect(screen.getByTestId("analytics-asset-filter")).toHaveTextContent("Ethereum");
    expect(screen.getByTestId("analytics-account-filter")).toHaveTextContent("Savings");
  });
});
