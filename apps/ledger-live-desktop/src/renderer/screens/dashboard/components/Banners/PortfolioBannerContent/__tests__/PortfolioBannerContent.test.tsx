import React from "react";
import { render, screen } from "tests/testSetup";
import { useBannersVisibility } from "../../hooks/useBannersVisibility";
import { PortfolioBannerContent } from "..";

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
}));

jest.mock("@braze/web-sdk", () => ({}));

jest.mock("../../hooks/useBannersVisibility", () => ({
  useBannersVisibility: jest.fn(),
}));

const mockUseBannersVisibility = jest.mocked(useBannersVisibility);

type BannersVisibility = ReturnType<typeof useBannersVisibility>;

const DEFAULT_VISIBILITY: BannersVisibility = {
  isClearCacheBannerVisible: false,
  isPostOnboardingBannerVisible: false,
  isFinishOnboardingWidgetVisible: false,
  isActionCardsVisible: false,
  isLNSUpsellBannerVisible: false,
  isPortfolioContentCardsVisible: false,
  hasAnyContentBannerVisible: false,
};

function setVisibility(overrides: Partial<BannersVisibility>) {
  mockUseBannersVisibility.mockReturnValue({ ...DEFAULT_VISIBILITY, ...overrides });
}

describe("PortfolioBannerContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setVisibility({});
  });

  it("renders PostOnboardingHubBanner branch when post-onboarding is visible and finish widget is hidden", () => {
    setVisibility({
      isPostOnboardingBannerVisible: true,
      isFinishOnboardingWidgetVisible: false,
      isLNSUpsellBannerVisible: true,
    });

    render(<PortfolioBannerContent />);

    expect(screen.getByTestId("postonboarding-banner-entry-point")).toBeInTheDocument();
  });

  it("renders nothing when finish onboarding widget is visible (after LNS branch)", () => {
    setVisibility({
      isFinishOnboardingWidgetVisible: true,
      isActionCardsVisible: true,
      hasAnyContentBannerVisible: true,
    });
    const { container } = render(<PortfolioBannerContent />);
    expect(container.firstChild).toBeNull();
  });
});
