import React from "react";
import { render, screen, waitFor, act } from "tests/testSetup";
import { useNavigate } from "react-router";
import MarketBanner from "../index";

const mockNavigate = jest.fn();

jest.mock("react-router", () => ({
  ...jest.requireActual("react-router"),
  useNavigate: jest.fn(() => mockNavigate),
}));

const mockedUseNavigate = jest.mocked(useNavigate);

function simulateScrollLayout(
  container: Element,
  scrollLeft: number,
  clientWidth: number,
  scrollWidth: number,
) {
  Object.defineProperty(container, "scrollLeft", {
    value: scrollLeft,
    writable: true,
    configurable: true,
  });
  Object.defineProperty(container, "clientWidth", {
    value: clientWidth,
    configurable: true,
  });
  Object.defineProperty(container, "scrollWidth", {
    value: scrollWidth,
    configurable: true,
  });
  container.dispatchEvent(new Event("scroll"));
}

describe("MarketBanner integration", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseNavigate.mockReturnValue(mockNavigate);
  });

  it("should render loading skeleton then display trending assets", async () => {
    render(<MarketBanner />, { withRampCatalog: true });

    expect(screen.getByTestId("skeleton-list")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("trending-assets-list")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("skeleton-list")).not.toBeInTheDocument();
    expect(screen.getByText("BTC")).toBeInTheDocument();
  });

  it("should show and hide scroll arrows based on scroll position", async () => {
    render(<MarketBanner />, { withRampCatalog: true });

    await waitFor(() => {
      expect(screen.getByTestId("trending-assets-list")).toBeInTheDocument();
    });

    const scrollContainer = screen.getByTestId("scroll-container");

    await act(async () => simulateScrollLayout(scrollContainer, 0, 500, 1000));
    expect(screen.queryByTestId("scroll-arrow-left")).not.toBeInTheDocument();
    expect(screen.getByTestId("scroll-arrow-right")).toBeInTheDocument();

    await act(async () => simulateScrollLayout(scrollContainer, 200, 500, 1000));
    expect(screen.getByTestId("scroll-arrow-left")).toBeInTheDocument();
    expect(screen.getByTestId("scroll-arrow-right")).toBeInTheDocument();

    await act(async () => simulateScrollLayout(scrollContainer, 500, 500, 1000));
    expect(screen.getByTestId("scroll-arrow-left")).toBeInTheDocument();
    expect(screen.queryByTestId("scroll-arrow-right")).not.toBeInTheDocument();
  });

  it("should navigate to market page when header is clicked", async () => {
    const { user } = render(<MarketBanner />, { withRampCatalog: true });

    await waitFor(() => {
      expect(screen.getByTestId("market-banner-button")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("market-banner-button"));

    expect(mockNavigate).toHaveBeenCalledWith("/market");
  });

  it("should navigate to asset detail when an asset tile is clicked", async () => {
    const { user } = render(<MarketBanner />, { withRampCatalog: true });

    await waitFor(() => {
      expect(screen.getByTestId("market-banner-asset-bitcoin")).toBeInTheDocument();
    });

    await user.click(screen.getByTestId("market-banner-asset-bitcoin"));

    expect(mockNavigate).toHaveBeenCalledWith("/market/bitcoin");
  });
});
