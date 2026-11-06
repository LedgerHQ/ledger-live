/* eslint-disable i18next/no-literal-string */
import * as React from "react";
import { screen, waitForElementToBeRemoved, renderWithReactQuery } from "@tests/test-renderer";
import { MarketPages } from "./shared";

describe("Market integration test", () => {
  it("Should filter the market list when searching for a coin", async () => {
    const { user } = renderWithReactQuery(<MarketPages />);

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
    expect(await screen.findByText("Ethereum (ETH)")).toBeOnTheScreen();

    const searchInput = await screen.findByPlaceholderText("Search");
    await user.type(searchInput, "BTC");

    await waitForElementToBeRemoved(() => screen.queryByText("Ethereum (ETH)"));

    expect(await screen.findByText("Bitcoin (BTC)")).toBeOnTheScreen();
  });
});
