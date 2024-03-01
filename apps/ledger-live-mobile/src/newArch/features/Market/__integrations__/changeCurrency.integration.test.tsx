import * as React from "react";
import { screen } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { MarketPages } from "./shared";

const SUPPORTED_CURRENCIES = [
  {
    currency: { name: "Euro", symbol: "€", ticker: "EUR", type: "FiatCurrency", units: [] },
    label: "Euro - EUR",
    ticker: "EUR",
    value: "EUR",
  },
  {
    currency: {
      name: "US Dollar",
      symbol: "$",
      ticker: "USD",
      type: "FiatCurrency",
      units: [],
    },
    label: "US Dollar - USD",
    ticker: "USD",
    value: "USD",
  },
];

describe("Market integration test", () => {
  it("Should change selected currency", async () => {
    const { user } = render(<MarketPages />, {
      featureFlags: { llmMarketNewArch: { enabled: true } },
      initialState: { settings: { supportedCounterValues: SUPPORTED_CURRENCIES } },
    });

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("$4.004 tn")).toBeOnTheScreen();
    await user.press(screen.getByText("Currency"));

    expect(await screen.findByText("Euro - EUR")).toBeOnTheScreen();
    await user.press(screen.getByText("Euro - EUR"));
    expect(await screen.findByText("€4.004 tn")).toBeOnTheScreen();
  });
});
