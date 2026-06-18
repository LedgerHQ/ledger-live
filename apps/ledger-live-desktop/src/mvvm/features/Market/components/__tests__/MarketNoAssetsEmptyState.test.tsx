import React from "react";
import type { TFunction } from "i18next";
import { render, screen } from "tests/testSetup";
import { MarketNoAssetsEmptyState } from "../MarketNoAssetsEmptyState";

const t = ((key: string) => key) as unknown as TFunction;

describe("MarketNoAssetsEmptyState", () => {
  it("renders the empty state with the no-assets copy", () => {
    render(<MarketNoAssetsEmptyState t={t} />);

    expect(screen.getByTestId("market-no-assets-empty")).toBeInTheDocument();
    expect(screen.getByText("market.assets.noAssets.title")).toBeInTheDocument();
    expect(screen.getByText("market.assets.noAssets.description")).toBeInTheDocument();
  });
});
