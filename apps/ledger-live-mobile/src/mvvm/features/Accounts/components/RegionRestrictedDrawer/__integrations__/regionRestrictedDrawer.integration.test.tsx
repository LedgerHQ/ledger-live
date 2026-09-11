import * as React from "react";
import { render, screen } from "@tests/test-renderer";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { RegionRestrictedDrawer } from "..";

describe("RegionRestrictedDrawer", () => {
  it("names the restricted currency and offers a way out", async () => {
    render(
      <RegionRestrictedDrawer
        isOpen
        currency={getCryptoCurrencyById("hypercore")}
        onClose={jest.fn()}
      />,
    );

    expect(
      await screen.findByText("Hyperliquid is not available in your region"),
    ).toBeOnTheScreen();
    expect(
      screen.getByText("Access to Hyperliquid is restricted in your region."),
    ).toBeOnTheScreen();
    expect(screen.getByTestId("region-restricted-learn-more")).toBeOnTheScreen();
    expect(screen.getByTestId("region-restricted-close")).toBeOnTheScreen();
  });
});
