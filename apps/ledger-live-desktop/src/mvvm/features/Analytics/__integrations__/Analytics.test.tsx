import React from "react";
import { render, screen } from "tests/testSetup";
import Analytics from "../index";
import useAnalyticsViewModel from "../useAnalyticsViewModel";

jest.mock("../useAnalyticsViewModel");
const mockedUseAnalyticsViewModel = useAnalyticsViewModel as jest.Mock;

jest.mock("~/renderer/screens/dashboard/GlobalSummary", () => ({
  __esModule: true,
  default: () => <div data-testid="portfolio-balance-summary">PortfolioBalanceSummary</div>,
}));

const mockNavigateToDashboard = jest.fn();

const defaultViewModel = {
  counterValue: { ticker: "USD", name: "US Dollar" },
  selectedTimeRange: "month",
  t: (key: string) => key,
  navigateToDashboard: mockNavigateToDashboard,
};

describe("Analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseAnalyticsViewModel.mockReturnValue(defaultViewModel);
  });

  it("should render the Analytics page with header and balance summary", () => {
    render(<Analytics />);

    expect(screen.getByText("analytics.title")).toBeVisible();
    expect(screen.getByTestId("portfolio-balance-summary")).toBeVisible();
  });

  it("should call navigateToDashboard when back button is clicked", async () => {
    const { user } = render(<Analytics />);

    const pageHeader = screen.getByTestId("page-header");
    expect(pageHeader).toBeInTheDocument();

    await user.click(pageHeader);

    expect(mockNavigateToDashboard).toHaveBeenCalledTimes(1);
  });
});
