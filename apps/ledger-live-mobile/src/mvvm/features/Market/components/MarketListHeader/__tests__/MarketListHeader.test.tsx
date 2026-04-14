import React from "react";
import { render, screen, withFlagOverrides } from "@tests/test-renderer";
import { MarketListHeaderLeft, MarketListHeaderTitle } from "../index";

const withMarketBanner = (enabled: boolean) => ({
  overrideInitialState: withFlagOverrides({
    lwmWallet40: { enabled: true, params: { marketBanner: enabled } },
  }),
});

const components = [
  {
    name: "MarketListHeaderLeft",
    Component: MarketListHeaderLeft,
    testID: "market-list-header-left",
  },
  {
    name: "MarketListHeaderTitle",
    Component: MarketListHeaderTitle,
    testID: "market-list-header-title",
  },
];

describe.each(components)("$name", ({ Component, testID }) => {
  it("should render null when marketBanner flag is disabled", () => {
    render(<Component />, withMarketBanner(false));
    expect(screen.queryByTestId(testID)).toBeNull();
  });

  it("should render when marketBanner flag is enabled", () => {
    render(<Component />, withMarketBanner(true));
    expect(screen.getByTestId(testID)).toBeOnTheScreen();
  });
});
