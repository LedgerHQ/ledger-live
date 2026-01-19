import React from "react";
import { render, screen } from "tests/testSetup";
import { MarketBannerView } from "..";
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
    render(<MarketBannerView isLoading={false} isError={false} />);
    expect(screen.getByText("Explore market")).toBeInTheDocument();
    expect(screen.queryByTestId("skeleton-list")).toBeNull();
  });

  it("should render skeleton when loading", () => {
    render(<MarketBannerView isLoading={true} isError={false} />);
    expect(screen.getByTestId("skeleton-list")).toBeTruthy();
  });

  it("should navigate to market page when button is clicked", async () => {
    const { user } = render(<MarketBannerView isLoading={false} isError={false} />);
    const marketButton = screen.getByTestId("market-banner-button");
    await user.click(marketButton);

    expect(mockNavigate).toHaveBeenCalledWith("/market");
  });

  it("should render error state when there is an error", () => {
    render(<MarketBannerView isLoading={false} isError={true} />);
    expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
  });
});
