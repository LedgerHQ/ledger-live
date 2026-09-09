import React from "react";
import { render, screen } from "tests/testSetup";
import { mockDomMeasurements } from "../../../../../__tests__/shared";
import { AssetVirtualList } from "../AssetVirtualList";
import { AssetType } from "../../../../types";

const ethereum: AssetType = { id: "ethereum", name: "Ethereum", ticker: "ETH" };
const bitcoin: AssetType = { id: "bitcoin", name: "Bitcoin", ticker: "BTC", disabled: true };
const polygon: AssetType = { id: "polygon", name: "Polygon", ticker: "MATIC" };
const solana: AssetType = { id: "solana", name: "Solana", ticker: "SOL", disabled: true };

describe("AssetVirtualList", () => {
  beforeEach(() => {
    mockDomMeasurements();
  });

  it("should group unavailable assets under a 'Not available yet' section", () => {
    render(<AssetVirtualList assets={[bitcoin, ethereum, solana, polygon]} onClick={jest.fn()} />);

    expect(screen.getByTestId("asset-selector-unavailable-assets-header")).toBeInTheDocument();
    expect(screen.getByText("Not available yet")).toBeInTheDocument();

    const tickers = screen
      .getAllByTestId(/asset-item-ticker-/)
      .map(asset => asset.getAttribute("data-testid"));

    expect(tickers).toEqual([
      "asset-item-ticker-eth",
      "asset-item-ticker-matic",
      "asset-item-ticker-btc",
      "asset-item-ticker-sol",
    ]);
  });

  it("should not render the 'Not available yet' section when every asset is available", () => {
    render(<AssetVirtualList assets={[ethereum, polygon]} onClick={jest.fn()} />);

    expect(
      screen.queryByTestId("asset-selector-unavailable-assets-header"),
    ).not.toBeInTheDocument();
  });
});
