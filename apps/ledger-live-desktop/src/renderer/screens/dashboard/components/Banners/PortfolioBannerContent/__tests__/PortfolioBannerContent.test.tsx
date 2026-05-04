import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, type PostOnboardingState } from "@ledgerhq/types-live";
import { initialState as postOnboardingInitialState } from "@ledgerhq/live-common/postOnboarding/reducer";
import { render, screen } from "tests/testSetup";
import dbMiddleware from "~/renderer/middlewares/db";
import type { State } from "~/renderer/reducers";
import createStore from "~/state-manager/configureStore";
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

  it("renders FinishOnboardingWidget branch when post-onboarding is visible and finish widget is visible", () => {
    setVisibility({
      isPostOnboardingBannerVisible: true,
      isFinishOnboardingWidgetVisible: true,
    });
    const store = createStore({
      state: { postOnboarding: postOnboardingInProgressState() } as State,
      dbMiddleware,
    });
    render(<PortfolioBannerContent />, { store });
    expect(screen.getByTestId("finish-onboarding-widget")).toBeInTheDocument();
  });
});
