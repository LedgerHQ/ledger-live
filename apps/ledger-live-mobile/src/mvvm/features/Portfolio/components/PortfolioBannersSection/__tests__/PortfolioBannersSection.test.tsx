import React from "react";
import { View } from "react-native";
import { render, screen } from "@tests/test-renderer";
import { PortfolioBannersSection } from "../index";
import { usePortfolioBannersSectionViewModel } from "../usePortfolioBannersSectionViewModel";
import RecoverBanner from "../../RecoverBanner";
import { OnboardingWidget } from "../../OnboardingWidget";
import { LNUpsellBanner } from "LLM/features/LNUpsell/components/LNUpsellBanner";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";

jest.mock("../usePortfolioBannersSectionViewModel");
jest.mock("../../RecoverBanner", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("../../OnboardingWidget", () => ({ OnboardingWidget: jest.fn() }));
jest.mock("LLM/features/LNUpsell/components/LNUpsellBanner", () => ({
  LNUpsellBanner: jest.fn(),
}));
jest.mock("~/dynamicContent/ContentCardsLocation", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseViewModel = jest.mocked(usePortfolioBannersSectionViewModel);
const MockRecoverBanner = jest.mocked(RecoverBanner);
const MockOnboardingWidget = jest.mocked(OnboardingWidget);
const MockLNUpsellBanner = jest.mocked(LNUpsellBanner);
const MockContentCardsLocation = jest.mocked(ContentCardsLocation);

const hiddenLazyOnboardingBanner = {
  isShown: false,
  title: "Discover Ledger devices",
  description: "Explore our latest products and accessories",
  imageUrl: "lazy-onboarding-banner.png",
  onPress: jest.fn(),
  onClose: jest.fn(),
};

const baseViewModel = {
  shouldShowOnboardingWidget: false,
  lazyOnboardingBanner: hiddenLazyOnboardingBanner,
  contentCardsPaddingTop: undefined,
  hasAssets: false,
  shouldDisplayRecover: false,
  onScroll: jest.fn(),
  carouselIndex: 0,
};

const renderSection = (props: Partial<React.ComponentProps<typeof PortfolioBannersSection>> = {}) =>
  render(<PortfolioBannersSection isFirst={false} isLNUpsellBannerShown={false} {...props} />);

describe("PortfolioBannersSection", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseViewModel.mockReturnValue(baseViewModel);
    MockRecoverBanner.mockReturnValue(<View testID="mock-recover-banner" />);
    MockOnboardingWidget.mockReturnValue(<View testID="mock-onboarding-widget" />);
    MockLNUpsellBanner.mockReturnValue(<View testID="mock-ln-banner" />);
    MockContentCardsLocation.mockReturnValue(<View testID="mock-content-cards" />);
  });

  it("renders nothing when no banners or assets are active", () => {
    renderSection();
    expect(screen.queryByTestId("portfolio-banners-section")).toBeNull();
  });

  it("renders the LN upsell banner when isLNUpsellBannerShown is true", () => {
    renderSection({ isLNUpsellBannerShown: true });
    expect(screen.getByTestId("mock-ln-banner")).toBeVisible();
    expect(screen.queryByTestId("mock-recover-banner")).toBeNull();
    expect(screen.queryByTestId("mock-onboarding-widget")).toBeNull();
  });

  it("renders the lazy onboarding banner with priority over other banners", () => {
    mockUseViewModel.mockReturnValue({
      ...baseViewModel,
      lazyOnboardingBanner: { ...hiddenLazyOnboardingBanner, isShown: true },
      shouldShowOnboardingWidget: true,
      shouldDisplayRecover: true,
    });

    render(<PortfolioBannersSection isFirst={false} isLNUpsellBannerShown />);

    expect(screen.getByText("Discover Ledger devices")).toBeVisible();
    expect(screen.queryByTestId("mock-lns-banner")).toBeNull();
    expect(screen.queryByTestId("mock-recover-banner")).toBeNull();
    expect(screen.queryByTestId("mock-onboarding-widget")).toBeNull();
  });

  describe("when user has assets and onboarding is hidden", () => {
    beforeEach(() => {
      mockUseViewModel.mockReturnValue({
        ...baseViewModel,
        hasAssets: true,
        shouldDisplayRecover: true,
      });
    });

    it("renders recover banner and top_wallet content cards", () => {
      renderSection({ showAssets: true });
      expect(screen.getByTestId("mock-recover-banner")).toBeVisible();
      expect(screen.getByTestId("mock-content-cards")).toBeVisible();
    });

    it("does not render onboarding or the carousel page indicator", () => {
      renderSection({ showAssets: true });
      expect(screen.queryByTestId("mock-onboarding-widget")).toBeNull();
      expect(screen.queryByTestId("banners-page-indicator")).toBeNull();
    });

    it("renders content cards without recover when recover is off", () => {
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

  describe("when onboarding is visible", () => {
    it("renders only the onboarding widget when recover is off", () => {
      mockUseViewModel.mockReturnValue({ ...baseViewModel, shouldShowOnboardingWidget: true });
      renderSection();
      expect(screen.getByTestId("mock-onboarding-widget")).toBeVisible();
      expect(screen.queryByTestId("mock-recover-banner")).toBeNull();
      expect(screen.queryByTestId("mock-content-cards")).toBeNull();
    });

    it("does not render top_wallet content cards when user has assets", () => {
      mockUseViewModel.mockReturnValue({
        ...baseViewModel,
        shouldShowOnboardingWidget: true,
        hasAssets: true,
      });
      renderSection({ showAssets: true });
      expect(screen.getByTestId("mock-onboarding-widget")).toBeVisible();
      expect(screen.queryByTestId("mock-content-cards")).toBeNull();
    });
  });

  describe("when recover is visible without onboarding", () => {
    it("renders only the recover banner", () => {
      mockUseViewModel.mockReturnValue({ ...baseViewModel, shouldDisplayRecover: true });
      renderSection();
      expect(screen.getByTestId("mock-recover-banner")).toBeVisible();
      expect(screen.queryByTestId("mock-onboarding-widget")).toBeNull();
    });
  });

  describe("when onboarding and recover are both visible", () => {
    beforeEach(() => {
      mockUseViewModel.mockReturnValue({
        ...baseViewModel,
        shouldShowOnboardingWidget: true,
        shouldDisplayRecover: true,
      });
    });

    it("renders both banners in the carousel", () => {
      renderSection();
      expect(screen.getByTestId("mock-onboarding-widget")).toBeVisible();
      expect(screen.getByTestId("mock-recover-banner")).toBeVisible();
    });

    it("does not render top_wallet content cards when user has assets", () => {
      mockUseViewModel.mockReturnValue({
        ...baseViewModel,
        shouldShowOnboardingWidget: true,
        shouldDisplayRecover: true,
        hasAssets: true,
      });
      renderSection({ showAssets: true });
      expect(screen.queryByTestId("mock-content-cards")).toBeNull();
    });

    it("shows the page indicator", () => {
      renderSection();
      expect(screen.getByTestId("banners-page-indicator")).toBeVisible();
    });
  });

  describe("carousel page indicator", () => {
    it("is hidden when only onboarding is active", () => {
      mockUseViewModel.mockReturnValue({ ...baseViewModel, shouldShowOnboardingWidget: true });
      renderSection();
      expect(screen.queryByTestId("banners-page-indicator")).toBeNull();
    });
  });
});
