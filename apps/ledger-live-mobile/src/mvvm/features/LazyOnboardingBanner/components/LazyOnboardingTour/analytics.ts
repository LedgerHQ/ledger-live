import { screen, track } from "~/analytics";
import {
  LAZY_ONBOARDING_FEATURE_INTRO_PAGE,
  LAZY_ONBOARDING_FEATURE_INTRO_PAGE_NAME,
  LAZY_ONBOARDING_SOURCE_FLOW,
  type LazyOnboardingSharedAnalyticsProps,
} from "../../analyticsConstants";
import { LAZY_ONBOARDING_TOUR_PAGE, LAZY_ONBOARDING_TOUR_SHOP_PAGE } from "./const";

export type LazyOnboardingTourSharedAnalyticsProps = LazyOnboardingSharedAnalyticsProps;

/** Convert 0-based slide index to 1-based analytics card. */
const toCard = (slideIndex: number) => slideIndex + 1;

export const trackLazyOnboardingTourOpened = (
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
  hasTrackedTourOpen: boolean,
): boolean => {
  if (hasTrackedTourOpen) {
    return false;
  }

  screen(
    LAZY_ONBOARDING_FEATURE_INTRO_PAGE,
    undefined,
    {
      name: LAZY_ONBOARDING_FEATURE_INTRO_PAGE_NAME,
      sourceFlow: LAZY_ONBOARDING_SOURCE_FLOW,
      ...sharedProps,
    },
    false,
  );

  return true;
};

export const trackLazyOnboardingTourStepViewed = (
  slideIndex: number,
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
  lastTrackedSlideIndex: number | null,
): number | null => {
  if (lastTrackedSlideIndex === slideIndex) {
    return lastTrackedSlideIndex;
  }

  track("product_tour_card", {
    page: LAZY_ONBOARDING_TOUR_PAGE,
    card: toCard(slideIndex),
    ...sharedProps,
  });

  return slideIndex;
};

export const trackLazyOnboardingTourContinueClicked = (
  slideIndex: number,
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  track("button_clicked", {
    button: "Continue",
    page: LAZY_ONBOARDING_TOUR_PAGE,
    card: toCard(slideIndex),
    ...sharedProps,
  });
};

export const trackLazyOnboardingTourBuyClicked = (
  slideIndex: number,
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  track("button_clicked", {
    button: "Buy a Ledger device",
    page: LAZY_ONBOARDING_TOUR_PAGE,
    card: toCard(slideIndex),
    ...sharedProps,
  });
};

export const trackLazyOnboardingTourCloseClicked = (
  slideIndex: number,
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  track("button_clicked", {
    button: "Close",
    page: LAZY_ONBOARDING_TOUR_PAGE,
    card: toCard(slideIndex),
    ...sharedProps,
  });
};

export const trackLazyOnboardingTourDismissed = (
  slideIndex: number,
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  track("modal_dismissed", {
    page: LAZY_ONBOARDING_TOUR_PAGE,
    card: toCard(slideIndex),
    ...sharedProps,
  });
};

export const trackLazyOnboardingTourDoneClicked = (
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  track("button_clicked", {
    button: "Done",
    page: LAZY_ONBOARDING_TOUR_PAGE,
    ...sharedProps,
  });
};

export const trackLazyOnboardingTourShopReached = (
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  screen(LAZY_ONBOARDING_TOUR_SHOP_PAGE, undefined, {
    name: "shop",
    ...sharedProps,
    source: "lazy onboarding tour",
  });
};
