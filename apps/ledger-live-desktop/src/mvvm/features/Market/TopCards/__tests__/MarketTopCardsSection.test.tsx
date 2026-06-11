import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import MarketTopCards from "../index";

const assetDiscoverabilityOn = withFlagOverrides({
  lwdWallet40: { enabled: true, params: { assetDiscoverability: true } },
});

const assetDiscoverabilityOff = withFlagOverrides({
  lwdWallet40: { enabled: false },
});

describe("MarketTopCards", () => {
  it("renders the section with the global market cap, mood index and altcoin season cards when assetDiscoverability is on", async () => {
    render(<MarketTopCards />, { initialState: assetDiscoverabilityOn });

    expect(screen.getByRole("region", { name: /market top cards/i })).toBeVisible();

    expect(await screen.findByTestId("global-market-cap-card")).toBeVisible();
    expect(await screen.findByTestId("mood-index-card")).toBeVisible();
    expect(await screen.findByTestId("alt-season-index-card")).toBeVisible();
  });

  it("renders nothing when assetDiscoverability is off", () => {
    render(<MarketTopCards />, { initialState: assetDiscoverabilityOff });

    expect(screen.queryByRole("region", { name: /market top cards/i })).toBeNull();
  });
});
