/**
 * @jest-environment jsdom
 */
import React from "react";
import { render, screen } from "tests/testUtils";
import AccountWarningBanner from "../AccountWarningBanner";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCurrencyConfiguration } from "@ledgerhq/live-common/config/index";

jest.mock("@ledgerhq/live-common/config/index", () => ({
  getCurrencyConfiguration: jest.fn(),
}));

jest.mock("~/renderer/hooks/useLocalizedUrls", () => ({
  useLocalizedUrl: jest.fn(() => "mockedLocalizedUrl"),
}));

jest.mock("~/renderer/linking", () => ({
  openURL: jest.fn(),
}));

const mockedGetCurrencyConfiguration = jest.mocked(getCurrencyConfiguration);

describe("AccountWarningBanner", () => {
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

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("renders migration warning banner", () => {
    mockedGetCurrencyConfiguration.mockReturnValue({
      status: {
        type: "migration",
        chain: "fantom",
        from: "OldCoin",
        to: "NewCoin",
        link: "https://migrationsupport.com",
      },
    });

    render(<AccountWarningBanner currency={mockCurrency} />);

    expect(screen.getByTestId("migration-banner")).toBeInTheDocument();
    expect(screen.getByText(/OldCoin/i)).toBeInTheDocument();
    expect(screen.getByText(/NewCoin/i)).toBeInTheDocument();
  });

  test("renders feature unavailable warning banner", () => {
    mockedGetCurrencyConfiguration.mockReturnValue({
      status: { type: "feature_unavailable", feature: "send", link: "https://featuresupport.com" },
    });

    render(<AccountWarningBanner currency={mockCurrency} />);

    expect(screen.getByTestId("feature-unavailable-banner")).toBeInTheDocument();
  });

  test("renders will be deprecated warning banner", () => {
    mockedGetCurrencyConfiguration.mockReturnValue({
      status: { type: "will_be_deprecated", deprecated_date: "2025-12-31" },
    });

    render(<AccountWarningBanner currency={mockCurrency} />);

    expect(screen.getByTestId("deprecated-banner")).toBeInTheDocument();
    expect(screen.getByText(/2025-12-31/i)).toBeInTheDocument();
  });

  test("does not render banner if currencyConfig is undefined", () => {
    mockedGetCurrencyConfiguration.mockImplementation(() => {
      throw new Error("No config found");
    });

    render(<AccountWarningBanner currency={mockCurrency} />);

    expect(screen.queryByTestId("migration-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("feature-unavailable-banner")).not.toBeInTheDocument();
    expect(screen.queryByTestId("deprecated-banner")).not.toBeInTheDocument();
  });
});
