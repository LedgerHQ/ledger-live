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

let hasTrackedTourOpen = false;
let lastTrackedStepIndex: number | null = null;

export const resetLazyOnboardingTourViewTracking = () => {
  hasTrackedTourOpen = false;
  lastTrackedStepIndex = null;
};

export const trackLazyOnboardingTourOpened = (
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  if (hasTrackedTourOpen) {
    return;
  }

  hasTrackedTourOpen = true;
  lastTrackedStepIndex = 0;

  screen(LAZY_ONBOARDING_TOUR_PAGE, undefined, {
    name: "lazy onboarding tour",
    step: 0,
    ...sharedProps,
  });
};

export const trackLazyOnboardingTourStepViewed = (
  step: number,
  sharedProps: LazyOnboardingTourSharedAnalyticsProps,
) => {
  if (lastTrackedStepIndex === step) {
    return;
  }

  lastTrackedStepIndex = step;

  screen(LAZY_ONBOARDING_TOUR_PAGE, undefined, {
    name: "lazy onboarding tour",
    step,
    ...sharedProps,
  });
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
    source: "lazy onboarding tour",
    ...sharedProps,
  });
};
