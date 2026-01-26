import React from "react";
import { render, screen } from "tests/testSetup";
import { MarketBannerView } from "..";
import { MOCK_MARKET_PERFORMERS } from "@ledgerhq/live-common/market/utils/fixtures";
import { useNavigate } from "react-router";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

const mockNavigate = jest.fn();
(useNavigate as jest.Mock).mockReturnValue(mockNavigate);

describe("MarketBannerView", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render correctly", () => {
    render(<MarketBannerView isLoading={false} isError={false} data={undefined} />);
    expect(screen.getByText("Explore market")).toBeVisible();
    expect(screen.queryByTestId("skeleton-list")).toBeNull();
  });

  it("should render skeleton when loading", () => {
    render(<MarketBannerView isLoading={true} isError={false} data={undefined} />);
    expect(screen.getByTestId("skeleton-list")).toBeTruthy();
  });

  it("should navigate to market page when button is clicked", async () => {
    const { user } = render(
      <MarketBannerView isLoading={false} isError={false} data={undefined} />,
    );
    const marketButton = screen.getByTestId("market-banner-button");
    await user.click(marketButton);

    expect(mockNavigate).toHaveBeenCalledWith("/market");
  });

  it("should render error state when there is an error", () => {
    render(<MarketBannerView isLoading={false} isError={true} data={undefined} />);
    expect(screen.getByTestId("generic-error")).toBeVisible();
  });

  it("should render TrendingAssetsList when data is provided", () => {
    render(<MarketBannerView isLoading={false} isError={false} data={MOCK_MARKET_PERFORMERS} />);

    expect(screen.getByTestId("trending-assets-list")).toBeVisible();
    expect(screen.queryByTestId("skeleton-list")).toBeNull();
    expect(screen.queryByTestId("generic-error")).toBeNull();
  });

  it("should not render TrendingAssetsList when data is empty array", () => {
    render(<MarketBannerView isLoading={false} isError={false} data={[]} />);

    expect(screen.queryByTestId("trending-assets-list")).toBeNull();
    expect(screen.queryByTestId("skeleton-list")).toBeNull();
    expect(screen.queryByTestId("generic-error")).toBeNull();
  });
});
