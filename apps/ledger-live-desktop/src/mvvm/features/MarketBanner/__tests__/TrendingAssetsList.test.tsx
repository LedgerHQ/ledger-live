import React from "react";
import { render, screen } from "tests/testSetup";
import { TrendingAssetsList } from "../components/TrendingAssetsList";
import { useNavigate } from "react-router";
import { MOCK_MARKET_PERFORMERS } from "@ledgerhq/live-common/market/utils/fixtures";
import { useHorizontalScroll } from "../hooks/useHorizontalScroll";

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(),
}));

jest.mock("../hooks/useHorizontalScroll");

const mockNavigate = jest.fn();
(useNavigate as jest.Mock).mockReturnValue(mockNavigate);

const mockScrollLeft = jest.fn();
const mockScrollRight = jest.fn();
const mockUseHorizontalScroll = useHorizontalScroll as jest.Mock;

const defaultScrollState = {
  scrollContainerRef: { current: null },
  isAtStart: true,
  isAtEnd: false,
  scrollLeft: mockScrollLeft,
  scrollRight: mockScrollRight,
};

describe("TrendingAssetsList", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseHorizontalScroll.mockReturnValue(defaultScrollState);
  });

  it("should render assets, hide left arrow, show right arrow and handle scroll right at start position", async () => {
    const { user } = render(<TrendingAssetsList items={MOCK_MARKET_PERFORMERS} />);

    expect(screen.getByTestId("trending-assets-list")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
    expect(screen.getByText("ETH")).toBeVisible();
    expect(screen.queryByTestId("scroll-arrow-left")).not.toBeInTheDocument();
    expect(screen.getByTestId("scroll-arrow-right")).toBeVisible();

    await user.click(screen.getByLabelText("Scroll right"));
    expect(mockScrollRight).toHaveBeenCalledTimes(1);
  });

  it("should navigate to asset detail page when asset is clicked", async () => {
    const { user } = render(<TrendingAssetsList items={MOCK_MARKET_PERFORMERS} />);

    await user.click(screen.getByTestId("market-banner-asset-bitcoin"));
    expect(mockNavigate).toHaveBeenCalledWith("/market/bitcoin");
  });

  it("should show left arrow and handle scroll left when not at start", async () => {
    mockUseHorizontalScroll.mockReturnValue({
      ...defaultScrollState,
      isAtStart: false,
    });

    const { user } = render(<TrendingAssetsList items={MOCK_MARKET_PERFORMERS} />);

    expect(screen.getByTestId("scroll-arrow-left")).toBeVisible();

    await user.click(screen.getByLabelText("Scroll left"));
    expect(mockScrollLeft).toHaveBeenCalledTimes(1);
  });

  it("should hide right arrow when at end of list", () => {
    mockUseHorizontalScroll.mockReturnValue({
      ...defaultScrollState,
      isAtEnd: true,
    });

    render(<TrendingAssetsList items={MOCK_MARKET_PERFORMERS} />);

    expect(screen.queryByTestId("scroll-arrow-right")).not.toBeInTheDocument();
  });
});
