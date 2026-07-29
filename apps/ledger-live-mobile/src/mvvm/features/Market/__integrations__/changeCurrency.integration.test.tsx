import * as React from "react";
import { screen, renderWithReactQuery } from "@tests/test-renderer";
import { MarketPages } from "./shared";
import { State } from "~/reducers/types";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";

const EUR = getFiatCurrencyByTicker("EUR");
const USD = getFiatCurrencyByTicker("USD");

describe("Market integration test", () => {
  it("Should change selected currency", async () => {
    const { user } = renderWithReactQuery(<MarketPages />, {
      overrideInitialState: (state: State) => ({
        ...state,
        // Seed the supportedFiats slice so the derived supportedCounterValuesSelector
        // returns EUR and USD deterministically, independent of CVS API availability.
        supportedFiats: { fiats: [EUR, USD], fiatsReady: true },
      }),
    });

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("$1.267 tn")).toBeOnTheScreen();
    await user.press(screen.getByText("Currency"));

    expect(await screen.findByText("Euro - EUR")).toBeOnTheScreen();
    await user.press(screen.getByText("Euro - EUR"));
    expect(await screen.findByText("€1.267 tn")).toBeOnTheScreen();
  });
});
