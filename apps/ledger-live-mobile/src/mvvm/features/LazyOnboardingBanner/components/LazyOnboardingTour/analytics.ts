import { screen, track } from "~/analytics";
import { LAZY_ONBOARDING_TOUR_PAGE, LAZY_ONBOARDING_TOUR_SHOP_PAGE } from "./const";

export type LazyOnboardingTourSharedAnalyticsProps = Readonly<{
  hasConnectedDevice: false;
  personalRecoOptIn: boolean;
  offerType: "none";
  platform: "llm";
  source: "lazy onboarding";
  mode: "feature_intro";
}>;

const LAZY_ONBOARDING_TOUR_CARD_EVENT = "lazy_onboarding_tour_card";

export const trackLazyOnboardingTourOpened = (
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
  hasTrackedTourOpen: boolean,
): boolean => {
  if (hasTrackedTourOpen) {
    return false;
  }

  track(LAZY_ONBOARDING_TOUR_CARD_EVENT, {
    page: LAZY_ONBOARDING_TOUR_PAGE,
    card: 1,
    ...sharedProps,
  });

  return true;
};

export const trackLazyOnboardingTourStepViewed = (
  step: number,
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
  lastTrackedStepIndex: number | null,
): number | null => {
  if (lastTrackedStepIndex === step) {
    return lastTrackedStepIndex;
  }

  track(LAZY_ONBOARDING_TOUR_CARD_EVENT, {
    page: LAZY_ONBOARDING_TOUR_PAGE,
    card: step + 1,
    ...sharedProps,
  });

  return step;
};

export const trackLazyOnboardingTourContinueClicked = (
  step: number,
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  track("button_clicked", {
    button: "continue",
    page: LAZY_ONBOARDING_TOUR_PAGE,
    step,
    ...sharedProps,
  });
};

export const trackLazyOnboardingTourBuyClicked = (
  step: number,
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  track("button_clicked", {
    button: "buy a ledger device",
    page: LAZY_ONBOARDING_TOUR_PAGE,
    step,
    ...sharedProps,
  });
};

export const trackLazyOnboardingTourCloseClicked = (
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  track("button_clicked", {
    button: "close",
    page: LAZY_ONBOARDING_TOUR_PAGE,
    ...sharedProps,
  });
};

export const trackLazyOnboardingTourDoneClicked = (
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  track("button_clicked", {
    button: "done",
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
