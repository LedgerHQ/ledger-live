import * as React from "react";
import { render, screen } from "@tests/test-renderer";
import { RegionRestrictedDrawerView } from "../RegionRestrictedDrawerView";

describe("RegionRestrictedDrawerView", () => {
  it("names the restricted currency and offers a way out", async () => {
    render(
      <RegionRestrictedDrawerView
        isOpen
        title="Hyperliquid is not available in your region"
        description="Access to Hyperliquid is restricted in your region."
        learnMoreLabel="Learn more"
        closeLabel="Close"
        onLearnMore={jest.fn()}
        onPressClose={jest.fn()}
        onDismiss={jest.fn()}
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
