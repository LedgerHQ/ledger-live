import React from "react";
import { View } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { PortfolioBannersSection } from "../index";
import { usePortfolioBannersSectionViewModel } from "../usePortfolioBannersSectionViewModel";
import RecoverBanner from "../../RecoverBanner";
import { OnboardingWidget } from "../../OnboardingWidget";
import { LNSUpsellBanner } from "LLM/features/LNSUpsell/components/LNSUpsellBanner";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";

jest.mock("../usePortfolioBannersSectionViewModel");
jest.mock("../../RecoverBanner", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../OnboardingWidget", () => ({ OnboardingWidget: jest.fn() }));
jest.mock("LLM/features/LNSUpsell/components/LNSUpsellBanner", () => ({
  LNSUpsellBanner: jest.fn(),
}));
jest.mock("~/dynamicContent/ContentCardsLocation", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseViewModel = jest.mocked(usePortfolioBannersSectionViewModel);
const MockRecoverBanner = jest.mocked(RecoverBanner);
const MockOnboardingWidget = jest.mocked(OnboardingWidget);
const MockLNSUpsellBanner = jest.mocked(LNSUpsellBanner);
const MockContentCardsLocation = jest.mocked(ContentCardsLocation);

const baseViewModel = {
  shouldShowOnboardingWidget: false,
  sectionMarginTop: "s16" as const,
  hasAssets: false,
  shouldDisplayRecover: false,
  onScroll: jest.fn(),
  carouselIndex: 0,
};

const renderSection = (props: Partial<React.ComponentProps<typeof PortfolioBannersSection>> = {}) =>
  render(<PortfolioBannersSection isFirst={false} isLNSUpsellBannerShown={false} {...props} />);

describe("PortfolioBannersSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseViewModel.mockReturnValue(baseViewModel);
    MockRecoverBanner.mockReturnValue(<View testID="mock-recover-banner" />);
    MockOnboardingWidget.mockReturnValue(<View testID="mock-onboarding-widget" />);
    MockLNSUpsellBanner.mockReturnValue(<View testID="mock-lns-banner" />);
    MockContentCardsLocation.mockReturnValue(<View testID="mock-content-cards" />);
  });

  it("renders nothing when no banners or assets are active", () => {
    renderSection();
    expect(screen.queryByTestId("portfolio-banners-section")).toBeNull();
  });

  it("renders the LNS upsell banner when isLNSUpsellBannerShown is true", () => {
    renderSection({ isLNSUpsellBannerShown: true });
    expect(screen.getByTestId("mock-lns-banner")).toBeVisible();
    expect(screen.queryByTestId("mock-recover-banner")).toBeNull();
    expect(screen.queryByTestId("mock-onboarding-widget")).toBeNull();
  });

  describe("static layout (assets visible, onboarding widget not active)", () => {
    beforeEach(() => {
      mockUseViewModel.mockReturnValue({
        ...baseViewModel,
        hasAssets: true,
        shouldDisplayRecover: true,
      });
    });

    it("renders the recover banner and content cards", () => {
      renderSection({ showAssets: true });
      expect(screen.getByTestId("mock-recover-banner")).toBeVisible();
      expect(screen.getByTestId("mock-content-cards")).toBeVisible();
    });

    it("does not render the onboarding widget or page indicator", () => {
      renderSection({ showAssets: true });
      expect(screen.queryByTestId("mock-onboarding-widget")).toBeNull();
      expect(screen.queryByTestId("banners-page-indicator")).toBeNull();
    });

    it("renders content cards without recover when recover banner is off", () => {
      mockUseViewModel.mockReturnValue({
        ...baseViewModel,
        hasAssets: true,
        shouldDisplayRecover: false,
      });
      renderSection({ showAssets: true });
      expect(screen.getByTestId("mock-content-cards")).toBeVisible();
      expect(screen.queryByTestId("mock-recover-banner")).toBeNull();
    });
  });

  describe("carousel layout", () => {
    it("renders only the onboarding widget when recover banner is not active", () => {
      mockUseViewModel.mockReturnValue({ ...baseViewModel, shouldShowOnboardingWidget: true });
      renderSection();
      expect(screen.getByTestId("mock-onboarding-widget")).toBeVisible();
      expect(screen.queryByTestId("mock-recover-banner")).toBeNull();
    });

    it("renders only the recover banner when onboarding widget is not active", () => {
      mockUseViewModel.mockReturnValue({ ...baseViewModel, shouldDisplayRecover: true });
      renderSection();
      expect(screen.getByTestId("mock-recover-banner")).toBeVisible();
      expect(screen.queryByTestId("mock-onboarding-widget")).toBeNull();
    });

    it("renders both banners when both are active", () => {
      mockUseViewModel.mockReturnValue({
        ...baseViewModel,
        shouldShowOnboardingWidget: true,
        shouldDisplayRecover: true,
      });
      renderSection();
      expect(screen.getByTestId("mock-onboarding-widget")).toBeVisible();
      expect(screen.getByTestId("mock-recover-banner")).toBeVisible();
    });

    it("hides the page indicator when only one banner is active", () => {
      mockUseViewModel.mockReturnValue({ ...baseViewModel, shouldShowOnboardingWidget: true });
      renderSection();
      expect(screen.queryByTestId("banners-page-indicator")).toBeNull();
    });

    it("shows the page indicator when both banners are active", () => {
      mockUseViewModel.mockReturnValue({
        ...baseViewModel,
        shouldShowOnboardingWidget: true,
        shouldDisplayRecover: true,
      });
      renderSection();
      expect(screen.getByTestId("banners-page-indicator")).toBeVisible();
    });
  });
});
