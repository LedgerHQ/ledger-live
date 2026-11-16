import React from "react";
import { render, screen, withFlagOverrides } from "tests/testSetup";
import { useHorizontalScroll } from "LLD/components/HorizontalScroll/hooks/useHorizontalScroll";
import { PortfolioServicesEntryPoints } from "..";

jest.mock("LLD/components/HorizontalScroll/hooks/useHorizontalScroll");

const mockScrollRight = jest.fn();

const servicesFlags = withFlagOverrides({
  entryPointsServices: {
    enabled: true,
    params: { services: ["perps", "borrow", "predictions"] },
  },
  ptxPerpsLiveApp: { enabled: true, params: { manifest_id: "perps-live-app" } },
  ptxBorrowLiveApp: { enabled: true },
  ptxPredictionsLiveAppDesktop: {
    enabled: true,
    params: { manifest_id: "predictions-live-app" },
  },
});

describe("PortfolioServicesEntryPoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useHorizontalScroll).mockReturnValue({
      scrollContainerRef: { current: null },
      isAtStart: true,
      isAtEnd: false,
      scrollLeft: jest.fn(),
      scrollRight: mockScrollRight,
    });
  });

  it("should scroll the cards inside the section when they don't fit", async () => {
    const { user } = render(<PortfolioServicesEntryPoints />, { initialState: servicesFlags });

    expect(screen.getByTestId("portfolio-services-entry-points-scroll-container")).toContainElement(
      screen.getByTestId("portfolio-services-entry-points"),
    );

    await user.click(screen.getByLabelText("Scroll right"));

    expect(mockScrollRight).toHaveBeenCalledTimes(1);
  });
});
