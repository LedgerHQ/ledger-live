import React from "react";
import type { TFunction } from "i18next";
import { render, screen } from "tests/testSetup";
import { MarketFavoritesEmptyState } from "../MarketFavoritesEmptyState";

const t = ((key: string) => key) as unknown as TFunction;

describe("MarketFavoritesEmptyState", () => {
  it("renders the empty state with the favorites copy", () => {
    render(<MarketFavoritesEmptyState t={t} />);

    expect(screen.getByTestId("market-favorites-empty")).toBeInTheDocument();
    expect(screen.getByText("market.assets.emptyFavorites")).toBeInTheDocument();
  });
});
