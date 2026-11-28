import React from "react";
import { View } from "react-native";
import { render, screen, userEvent } from "@testing-library/react-native";
import { FiatCurrencyTickerSchema } from "@domain/entity-currency-fiat";
import { I18nTestProvider } from "@shared/i18n/testing";
import { AccountAnalyticsView } from "./AccountAnalyticsView";
import { analyticsCatalog } from "./analytics.mock";
import type { AccountAnalyticsViewProps } from "./AccountAnalytics.types";

jest.mock("@ledgerhq/crypto-icons/native", () => () => null);

function renderAnalytics(ui: React.ReactElement) {
  return render(ui, {
    wrapper: ({ children }) => <I18nTestProvider resources={{}}>{children}</I18nTestProvider>,
  });
}

const scope = {
  assetId: "eth",
  accountId: null,
  fiatCurrencyId: FiatCurrencyTickerSchema.parse("USD"),
  positionIds: ["eth-native"],
};

function createProps(
  overrides: Partial<AccountAnalyticsViewProps> = {},
): AccountAnalyticsViewProps {
  const selection = { assetId: "eth", accountId: null, metric: "balance" as const };
  return {
    model: {
      selection,
      context: { ...selection, ...scope, period: "1d" },
      contextKey: "analytics-native",
      balance: { status: "error" },
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
      <View testID="chart">
        {filters}
        {statusContent}
      </View>
    ),
    renderPnl: ({ statusContent }) => <View testID="pnl">{statusContent}</View>,
    ...overrides,
  };
}

describe("AccountAnalyticsView (native)", () => {
  it("should hand the filters and the selection status to the host renderers", async () => {
    const props = createProps();
    renderAnalytics(<AccountAnalyticsView {...props} />);

    expect(screen.getByTestId("account-analytics-filters")).toBeVisible();
    expect(screen.getByTestId("analytics-account-filter")).toBeVisible();
    expect(screen.getByText("Unable to load analytics")).toBeVisible();
    expect(screen.getByText("Data unavailable")).toBeVisible();

    await userEvent.press(screen.getByText("Retry"));
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  it("should pass the PnL scope and catalog status to the PnL renderer", () => {
    const renderPnl = jest.fn(() => null);
    renderAnalytics(
      <AccountAnalyticsView {...createProps({ renderPnl, catalogStatus: "loading" })} />,
    );
    expect(renderPnl).toHaveBeenCalledWith(
      expect.objectContaining({ scope, catalogStatus: "loading" }),
    );
  });
});
