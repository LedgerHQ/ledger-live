import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, type PostOnboardingState } from "@ledgerhq/types-live";
import { initialState as postOnboardingInitialState } from "@ledgerhq/live-common/postOnboarding/reducer";
import { render, screen } from "tests/testSetup";
import dbMiddleware from "~/renderer/middlewares/db";
import type { State } from "~/renderer/reducers";
import createStore from "~/state-manager/configureStore";
import { useRecoverWidgetViewModel } from "LLD/features/FinishOnboarding/RecoverWidget/useRecoverWidgetViewModel";
import { useBannersVisibility } from "../../hooks/useBannersVisibility";
import { PortfolioBannerContent } from "..";

jest.mock("~/renderer/store", () => ({
  getStoreValue: jest.fn(),
  setStoreValue: jest.fn(),
}));

jest.mock("@braze/web-sdk", () => ({}));

/** Isolate routing from FinishOnboardingWidget view-model + Redux (avoids null render on CI). */
jest.mock("LLD/features/FinishOnboarding/FinishOnboardingWidget", () => ({
  __esModule: true,
  default: () => <div data-testid="finish-onboarding-widget" />,
}));

jest.mock("LLD/features/FinishOnboarding/RecoverWidget/RecoverWidgetView", () => ({
  __esModule: true,
  default: () => <div data-testid="recover-widget" />,
}));

jest.mock("LLD/features/FinishOnboarding/RecoverWidget/useRecoverWidgetViewModel", () => ({
  useRecoverWidgetViewModel: jest.fn(),
}));

jest.mock("LLD/features/LNSUpsell", () => ({
  LNSUpsellBanner: () => <div data-testid="lns-upsell-banner" />,
}));

jest.mock("LLD/features/DynamicContent/components/PortfolioContentCards", () => ({
  __esModule: true,
  default: () => <div data-testid="portfolio-content-cards" />,
}));

jest.mock("~/renderer/screens/dashboard/ActionContentCards", () => ({
  __esModule: true,
  default: () => <div data-testid="action-content-cards" />,
}));

jest.mock("../../hooks/useBannersVisibility", () => ({
  useBannersVisibility: jest.fn(),
}));

const mockUseBannersVisibility = jest.mocked(useBannersVisibility);
const mockUseRecoverWidgetViewModel = jest.mocked(useRecoverWidgetViewModel);

function defaultRecoverWidgetViewModelReturn() {
  return {
    isVisible: true,
    shouldDisplayRecoverInPortfolioBannerRow: true,
    titleKey: "postOnboarding.dialog.actions.recover.title",
    descriptionKey: "postOnboarding.dialog.actions.recover.description",
    onOpenRecover: jest.fn(),
  };
}

function setWallet40RecoverInRow(show: boolean) {
  mockUseRecoverWidgetViewModel.mockReturnValue({
    ...defaultRecoverWidgetViewModelReturn(),
    shouldDisplayRecoverInPortfolioBannerRow: show,
  });
}

type BannersVisibility = ReturnType<typeof useBannersVisibility>;

const DEFAULT_VISIBILITY: BannersVisibility = {
  isClearCacheBannerVisible: false,
  isPostOnboardingBannerVisible: false,
  isFinishOnboardingWidgetVisible: false,
  shouldDisplayFinishOnboardingWidget: false,
  isActionCardsVisible: false,
  isLNSUpsellBannerVisible: false,
  isPortfolioContentCardsVisible: false,
  hasAnyContentBannerVisible: false,
};

function setVisibility(overrides: Partial<BannersVisibility>) {
  mockUseBannersVisibility.mockReturnValue({ ...DEFAULT_VISIBILITY, ...overrides });
}

function postOnboardingInProgressState(): PostOnboardingState {
  return {
    ...postOnboardingInitialState,
    deviceModelId: DeviceModelId.nanoX,
    walletEntryPointDismissed: false,
    entryPointFirstDisplayedDate: new Date("2024-06-01"),
    walletEntryPointEligibleForPortfolio: true,
    actionsToComplete: [PostOnboardingActionId.claimMock, PostOnboardingActionId.personalizeMock],
    actionsCompleted: {
      [PostOnboardingActionId.claimMock]: true,
      [PostOnboardingActionId.personalizeMock]: false,
    },
    lastActionCompleted: PostOnboardingActionId.claimMock,
    postOnboardingInProgress: true,
  };
}

describe("PortfolioBannerContent", () => {
  beforeEach(() => {
    mockUseBannersVisibility.mockClear();
    mockUseRecoverWidgetViewModel.mockReturnValue(defaultRecoverWidgetViewModelReturn());
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

  it("renders FinishOnboardingWidget branch when post-onboarding is visible and finish widget is visible", () => {
    setVisibility({
      isPostOnboardingBannerVisible: true,
      isFinishOnboardingWidgetVisible: true,
      shouldDisplayFinishOnboardingWidget: true,
    });
    const store = createStore({
      state: { postOnboarding: postOnboardingInProgressState() } as State,
      dbMiddleware,
    });
    render(<PortfolioBannerContent />, { store });
    expect(screen.getByTestId("finish-onboarding-widget")).toBeInTheDocument();
  });

  describe("Wallet40 finish-onboarding gating (shouldDisplayFinishOnboardingWidget)", () => {
    it("prefers LNS upsell over the finish/recover row when LNS is visible", () => {
      setWallet40RecoverInRow(true);
      setVisibility({
        shouldDisplayFinishOnboardingWidget: true,
        isLNSUpsellBannerVisible: true,
        isFinishOnboardingWidgetVisible: true,
      });

      render(<PortfolioBannerContent />);

      expect(screen.getByTestId("lns-upsell-banner")).toBeVisible();
      expect(screen.queryByTestId("finish-onboarding-widget")).not.toBeInTheDocument();
      expect(screen.queryByTestId("recover-widget")).not.toBeInTheDocument();
    });

    it("renders finish onboarding and recover widgets when both should show and LNS is off", () => {
      setWallet40RecoverInRow(true);
      setVisibility({
        shouldDisplayFinishOnboardingWidget: true,
        isLNSUpsellBannerVisible: false,
        isFinishOnboardingWidgetVisible: true,
      });

      render(<PortfolioBannerContent />);

      expect(screen.getByTestId("finish-onboarding-widget")).toBeInTheDocument();
      expect(screen.getByTestId("recover-widget")).toBeInTheDocument();
    });

    it("renders only recover widget when finish widget is off but recover banner should show", () => {
      setWallet40RecoverInRow(true);
      setVisibility({
        shouldDisplayFinishOnboardingWidget: true,
        isLNSUpsellBannerVisible: false,
        isFinishOnboardingWidgetVisible: false,
      });

      render(<PortfolioBannerContent />);

      expect(screen.queryByTestId("finish-onboarding-widget")).not.toBeInTheDocument();
      expect(screen.getByTestId("recover-widget")).toBeInTheDocument();
    });

    it("falls back to portfolio content cards when finish and recover are both off", () => {
      setWallet40RecoverInRow(false);
      setVisibility({
        shouldDisplayFinishOnboardingWidget: true,
        isLNSUpsellBannerVisible: false,
        isFinishOnboardingWidgetVisible: false,
      });

      render(<PortfolioBannerContent />);

      expect(screen.getByTestId("portfolio-content-cards")).toBeInTheDocument();
    });

    it("shows finish onboarding without recover when displayBanner is false", () => {
      setWallet40RecoverInRow(false);
      setVisibility({
        shouldDisplayFinishOnboardingWidget: true,
        isLNSUpsellBannerVisible: false,
        isFinishOnboardingWidgetVisible: true,
      });

      render(<PortfolioBannerContent />);

      expect(screen.getByTestId("finish-onboarding-widget")).toBeInTheDocument();
      expect(screen.queryByTestId("recover-widget")).not.toBeInTheDocument();
    });

    it("falls back to portfolio content cards when banner allows recover but RecoverWidget visibility gates are off", () => {
      mockUseRecoverWidgetViewModel.mockReturnValue({
        ...defaultRecoverWidgetViewModelReturn(),
        isVisible: false,
        shouldDisplayRecoverInPortfolioBannerRow: false,
      });
      setVisibility({
        shouldDisplayFinishOnboardingWidget: true,
        isLNSUpsellBannerVisible: false,
        isFinishOnboardingWidgetVisible: false,
      });

      render(<PortfolioBannerContent />);

      expect(screen.getByTestId("portfolio-content-cards")).toBeInTheDocument();
      expect(screen.queryByTestId("recover-widget")).not.toBeInTheDocument();
    });
  });

  describe("legacy RecoverBanner branch", () => {
    it("renders action content cards when action cards are visible", () => {
      setVisibility({
        isPostOnboardingBannerVisible: false,
        shouldDisplayFinishOnboardingWidget: false,
        isActionCardsVisible: true,
      });

      render(<PortfolioBannerContent />);

      expect(screen.getByTestId("action-content-cards")).toBeInTheDocument();
    });

    it("renders LNS upsell when action cards are off but LNS is visible", () => {
      setVisibility({
        isPostOnboardingBannerVisible: false,
        shouldDisplayFinishOnboardingWidget: false,
        isActionCardsVisible: false,
        isLNSUpsellBannerVisible: true,
      });

      render(<PortfolioBannerContent />);

      expect(screen.getByTestId("lns-upsell-banner")).toBeVisible();
      expect(screen.queryByTestId("action-content-cards")).not.toBeInTheDocument();
    });

    it("falls back to portfolio content cards when action cards and LNS are off", () => {
      setVisibility({
        isPostOnboardingBannerVisible: false,
        shouldDisplayFinishOnboardingWidget: false,
        isActionCardsVisible: false,
        isLNSUpsellBannerVisible: false,
      });

      render(<PortfolioBannerContent />);

      expect(screen.getByTestId("portfolio-content-cards")).toBeInTheDocument();
    });
  });
});
