import React from "react";
import { render, screen, act } from "tests/testSetup";
import Analytics from "../index";
import useAnalyticsViewModel from "../useAnalyticsViewModel";
import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import type { AllocationViewProps } from "../types";

jest.mock("../useAnalyticsViewModel");
const mockedUseAnalyticsViewModel = useAnalyticsViewModel as jest.Mock;

jest.mock("~/renderer/screens/dashboard/GlobalSummary", () => ({
  __esModule: true,
  default: () => <div data-testid="portfolio-balance-summary">PortfolioBalanceSummary</div>,
}));

let intersectionCallback: IntersectionObserverCallback;
const mockObserve = jest.fn();
const mockDisconnect = jest.fn();

beforeEach(() => {
  window.IntersectionObserver = jest.fn(cb => {
    intersectionCallback = cb;
    return { observe: mockObserve, disconnect: mockDisconnect, unobserve: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
});

const mockNavigateToDashboard = jest.fn();

const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");

const mockShowMore = jest.fn();
const mockOnItemClick = jest.fn();

const emptyAllocation: AllocationViewProps = {
  items: [],
  hasMore: false,
  showMore: mockShowMore,
  onItemClick: mockOnItemClick,
};

const populatedAllocation: AllocationViewProps = {
  items: [
    { currency: bitcoin, balance: 100000, distribution: 60 },
    { currency: ethereum, balance: 50000, distribution: 30 },
  ],
  hasMore: false,
  showMore: mockShowMore,
  onItemClick: mockOnItemClick,
};

const defaultViewModel = {
  counterValue: { ticker: "USD", name: "US Dollar" },
  selectedTimeRange: "month",
  navigateToDashboard: mockNavigateToDashboard,
  allocation: emptyAllocation,
};

describe("Analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAnalyticsViewModel.mockReturnValue(defaultViewModel);
  });

  it("should render the Analytics page with header and balance summary", () => {
    render(<Analytics />);

    expect(screen.getByText("Analytics")).toBeVisible();
    expect(screen.getByTestId("analytics-chart")).toBeVisible();
  });

  it("should call navigateToDashboard when back button is clicked", async () => {
    const { user } = render(<Analytics />);

    const backButton = screen.getByRole("button");
    await user.click(backButton);

    expect(mockNavigateToDashboard).toHaveBeenCalledTimes(1);
  });

  it("should not render allocation section when shouldDisplayAssetSection is false", () => {
    mockedUseAnalyticsViewModel.mockReturnValue({
      ...defaultViewModel,
      shouldDisplayAssetSection: false,
    });

    render(<Analytics />);

    expect(screen.queryByText("Asset allocation")).not.toBeInTheDocument();
  });

  it("should render allocation table with asset details when shouldDisplayAssetSection is true", () => {
    mockedUseAnalyticsViewModel.mockReturnValue({
      ...defaultViewModel,
      shouldDisplayAssetSection: true,
      allocation: populatedAllocation,
    });

    render(<Analytics />);

    expect(screen.getByText("Asset allocation")).toBeVisible();
    expect(screen.getByText("Bitcoin")).toBeVisible();
    expect(screen.getByText("BTC")).toBeVisible();
    expect(screen.getByText("Ethereum")).toBeVisible();
    expect(screen.getByText("ETH")).toBeVisible();
  });

  it("should render column headers in allocation table", () => {
    mockedUseAnalyticsViewModel.mockReturnValue({
      ...defaultViewModel,
      shouldDisplayAssetSection: true,
      allocation: populatedAllocation,
    });

    render(<Analytics />);

    expect(screen.getByText("Name")).toBeVisible();
    expect(screen.getByText("Balance")).toBeVisible();
    expect(screen.getByText("Value")).toBeVisible();
    expect(screen.getByText("Allocation")).toBeVisible();
  });

  it("should render formatted distribution percentages", () => {
    mockedUseAnalyticsViewModel.mockReturnValue({
      ...defaultViewModel,
      shouldDisplayAssetSection: true,
      allocation: populatedAllocation,
    });

    render(<Analytics />);

    expect(screen.getByText("60%")).toBeVisible();
    expect(screen.getByText("30%")).toBeVisible();
  });

  it("should render loader and call showMore when sentinel becomes visible", () => {
    mockedUseAnalyticsViewModel.mockReturnValue({
      ...defaultViewModel,
      shouldDisplayAssetSection: true,
      allocation: { ...populatedAllocation, hasMore: true },
    });

    render(<Analytics />);

    expect(screen.getByTestId("allocation-loader")).toBeInTheDocument();
    expect(mockObserve).toHaveBeenCalled();

    act(() => {
      intersectionCallback(
        [{ isIntersecting: true } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      );
    });

    expect(mockShowMore).toHaveBeenCalledTimes(1);
  });

  it("should not render loader when hasMore is false", () => {
    mockedUseAnalyticsViewModel.mockReturnValue({
      ...defaultViewModel,
      shouldDisplayAssetSection: true,
      allocation: populatedAllocation,
    });

    render(<Analytics />);

    expect(screen.queryByTestId("allocation-loader")).not.toBeInTheDocument();
    expect(mockObserve).not.toHaveBeenCalled();
  });

  it("should call onItemClick when a row is clicked", async () => {
    mockedUseAnalyticsViewModel.mockReturnValue({
      ...defaultViewModel,
      shouldDisplayAssetSection: true,
      allocation: populatedAllocation,
    });

    const { user } = render(<Analytics />);

    await user.click(screen.getByText("Bitcoin"));

    expect(mockOnItemClick).toHaveBeenCalledWith(populatedAllocation.items[0]);
  });
});
