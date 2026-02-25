import React from "react";
import { render, screen } from "tests/testSetup";
import { TrendingAssetsList } from "../components/TrendingAssetsList";
import { useNavigate } from "react-router";
import { MOCK_MARKET_PERFORMERS } from "@ledgerhq/live-common/market/utils/fixtures";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
(useNavigate as jest.Mock).mockReturnValue(mockNavigate);

describe("TrendingAssetsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render the list with all assets", () => {
    render(<TrendingAssetsList items={MOCK_MARKET_PERFORMERS} />);

    expect(screen.getByTestId("trending-assets-list")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
    expect(screen.getByText("ETH")).toBeVisible();
  });

  it("should navigate to asset detail page when asset is clicked", async () => {
    const { user } = render(<TrendingAssetsList items={MOCK_MARKET_PERFORMERS} />);

    const bitcoinTile = screen.getByText("BTC").closest("div[role='button']");
    if (bitcoinTile) {
      await user.click(bitcoinTile);
      expect(mockNavigate).toHaveBeenCalledWith(`/market/bitcoin`);
    }
  });
});
