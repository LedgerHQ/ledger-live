import React from "react";
import { render, screen } from "tests/testSetup";
import { MarketBannerView } from "..";
import { useHistory } from "react-router-dom";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useHistory: jest.fn(),
}));

const mockPush = jest.fn();
(useHistory as jest.Mock).mockReturnValue({ push: mockPush });

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

    expect(mockPush).toHaveBeenCalledWith({
      pathname: "/market",
    });
  });

  it("should render error state when there is an error", () => {
    render(<MarketBannerView isLoading={false} isError={true} />);
    expect(screen.getByText(/Connection failed/)).toBeInTheDocument();
  });
});
