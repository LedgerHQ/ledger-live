import React from "react";
import { render, screen } from "tests/testSetup";
import { TrendingAssetTile } from "../components/TrendingAssetTile";
import { createMockMarketPerformer } from "@ledgerhq/live-common/market/utils/fixtures";

describe("TrendingAssetTile", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should render capitalized ticker with performance and navigate on click", async () => {
    const clickHandler = jest.fn();
    const onNavigate = jest.fn(() => clickHandler);
    const item = createMockMarketPerformer({
      id: "bitcoin",
      ticker: "btc",
      priceChangePercentage24h: 5.5,
    });

    const { user } = render(<TrendingAssetTile item={item} onNavigate={onNavigate} />);

    expect(screen.getByText("BTC")).toBeVisible();
    expect(screen.getByText("+5.50%")).toBeVisible();

    await user.click(screen.getByTestId("market-banner-asset-bitcoin"));
    expect(onNavigate).toHaveBeenCalledWith("bitcoin");
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });
});
