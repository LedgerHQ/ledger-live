import React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { CurrencyConfig } from "@ledgerhq/coin-framework/lib/config";
import WarningBannerStatus from "./WarningBannerStatus";

describe("WarningBannerStatus", () => {
  const mockCurrency: CryptoCurrency = {
    id: "fantom",
    name: "Fantom",
    ticker: "FTM",
    type: "CryptoCurrency",
    managerAppName: "Mock Manager App",
    coinType: 0,
    scheme: "mock",
    color: "#000000",
    family: "mock-family",
    explorerViews: [],
    units: [],
  };

  it("renders nothing if currencyConfig is not provided", () => {
    render(<WarningBannerStatus currency={mockCurrency} />);
    expect(screen.queryByTestId("migration-banner")).not.toBeVisible();
    expect(screen.queryByTestId("deprecated-banner")).not.toBeVisible();
  });

  it("renders migration banner correctly", () => {
    const mockCurrencyConfig: CurrencyConfig = {
      status: {
        type: "migration",
        chain: "fantom",
        from: "OldCoin",
        to: "NewCoin",
        link: "https://migrationsupport.com",
      },
    };

    render(<WarningBannerStatus currency={mockCurrency} currencyConfig={mockCurrencyConfig} />);

    expect(screen.getByTestId("migration-banner")).toBeVisible();

    const supportLink = screen.findByText("Contact support");
    expect(supportLink).toBeTruthy();
  });

  it("renders deprecated banner correctly", () => {
    const mockCurrencyConfig: CurrencyConfig = {
      status: {
        type: "will_be_deprecated",
        deprecated_date: "2025-01-01",
      },
    };

    render(<WarningBannerStatus currency={mockCurrency} currencyConfig={mockCurrencyConfig} />);

    expect(screen.getByTestId("deprecated-banner")).toBeVisible();
  });
});
