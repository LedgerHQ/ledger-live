import { screen, track } from "~/analytics";
import {
  LAZY_ONBOARDING_FEATURE_INTRO_PAGE,
  LAZY_ONBOARDING_FEATURE_INTRO_PAGE_NAME,
  LAZY_ONBOARDING_SOURCE_FLOW,
} from "../../analyticsConstants";
import {
  trackLazyOnboardingTourBuyClicked,
  trackLazyOnboardingTourCloseClicked,
  trackLazyOnboardingTourContinueClicked,
  trackLazyOnboardingTourDismissed,
  trackLazyOnboardingTourDoneClicked,
  trackLazyOnboardingTourOpened,
  trackLazyOnboardingTourShopReached,
  trackLazyOnboardingTourStepViewed,
  type LazyOnboardingTourSharedAnalyticsProps,
} from "../analytics";
import { LAZY_ONBOARDING_TOUR_PAGE, LAZY_ONBOARDING_TOUR_SHOP_PAGE } from "../const";

jest.mock("~/analytics", () => ({
  screen: jest.fn(),
  track: jest.fn(),
}));

const sharedProps: LazyOnboardingTourSharedAnalyticsProps = {
  hasConnectedDevice: false,
  personalRecoOptIn: true,
  offerType: "discount",
  platform: "lwm",
  deviceModel: "none",
  abLazyBannerFlow: "feature intro",
};

describe("LazyOnboardingTour analytics", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("tracks tour open once and ignores duplicate opens", () => {
    expect(trackLazyOnboardingTourOpened(sharedProps, false)).toBe(true);
    expect(screen).toHaveBeenCalledWith(
      LAZY_ONBOARDING_FEATURE_INTRO_PAGE,
      undefined,
      {
        name: LAZY_ONBOARDING_FEATURE_INTRO_PAGE_NAME,
        sourceFlow: LAZY_ONBOARDING_SOURCE_FLOW,
        ...sharedProps,
      },
      false,
    );

    expect(trackLazyOnboardingTourOpened(sharedProps, true)).toBe(false);
    expect(screen).toHaveBeenCalledTimes(1);
  });

  it("tracks product_tour_card for new slides and skips duplicates", () => {
    expect(trackLazyOnboardingTourStepViewed(1, sharedProps, null)).toBe(1);
    expect(track).toHaveBeenCalledWith(
      "product_tour_card",
      expect.objectContaining({ page: LAZY_ONBOARDING_TOUR_PAGE, card: 2 }),
    );

    expect(trackLazyOnboardingTourStepViewed(1, sharedProps, 1)).toBe(1);
    expect(track).toHaveBeenCalledTimes(1);
  });

  it("tracks continue, buy, close, dismiss, done, and shop events", () => {
    trackLazyOnboardingTourContinueClicked(0, sharedProps);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Continue", card: 1 }),
    );

    trackLazyOnboardingTourBuyClicked(2, sharedProps);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Buy a Ledger device", card: 3 }),
    );

    trackLazyOnboardingTourCloseClicked(1, sharedProps);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Close", card: 2 }),
    );

    trackLazyOnboardingTourDismissed(1, sharedProps);
    expect(track).toHaveBeenCalledWith(
      "modal_dismissed",
      expect.objectContaining({ page: LAZY_ONBOARDING_TOUR_PAGE, card: 2 }),
    );

    trackLazyOnboardingTourDoneClicked(sharedProps);
    expect(track).toHaveBeenCalledWith(
      "button_clicked",
      expect.objectContaining({ button: "Done", page: LAZY_ONBOARDING_TOUR_PAGE }),
    );

    trackLazyOnboardingTourShopReached(sharedProps);
    expect(screen).toHaveBeenCalledWith(LAZY_ONBOARDING_TOUR_SHOP_PAGE, undefined, {
      name: "shop",
      ...sharedProps,
      source: "lazy onboarding tour",
    });
  });
});
