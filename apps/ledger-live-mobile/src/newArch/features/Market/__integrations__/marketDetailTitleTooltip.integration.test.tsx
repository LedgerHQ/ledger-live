/* eslint-disable i18next/no-literal-string */
import * as React from "react";
import { screen, waitFor } from "@testing-library/react-native";
import { render } from "@tests/test-renderer";
import { MarketPages } from "./shared";

describe("Market integration test - Title Tooltip", () => {
  it("Should display tooltip on long press of coin title", async () => {
    const { user } = render(<MarketPages />);

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();

    const searchInput = await screen.findByTestId("search-box");
    await user.type(searchInput, "BTC");

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();

    await user.press(screen.getByText("Bitcoin (BTC)"));

    // Wait for the title pressable to appear in the header
    // ScrollContainerHeader renders the title twice (one hidden with opacity: 0 for animation, one visible)
    // We need to get all and take the visible one (the one without opacity: 0)
    await waitFor(() => {
      const titleElements = screen.queryAllByTestId("market-detail-title-pressable");
      expect(titleElements.length).toBeGreaterThan(0);
    });

    const titleElements = screen.getAllByTestId("market-detail-title-pressable");
    // The visible one is typically the second one (index 1) or the one without opacity: 0
    // Based on the render tree, the visible one is the second instance
    const titlePressable = titleElements.length > 1 ? titleElements[1] : titleElements[0];

    // Perform long press on the title
    await user.longPress(titlePressable);

    // Wait for tooltip to appear - verify there are now multiple "Bitcoin" texts (header + tooltip)
    await waitFor(() => {
      const allBitcoinTexts = screen.getAllByText("Bitcoin");
      // Should have at least 2: one in header and one in tooltip
      expect(allBitcoinTexts.length).toBeGreaterThanOrEqual(2);
    }, { timeout: 3000 });
  }, 10000);
});

