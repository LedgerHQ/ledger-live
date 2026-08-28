import type { LazyOnboardingBannerMode } from "@features/flow-lazy-onboarding-banner";
import { screen, track } from "~/analytics";
import {
  buildLazyOnboardingSharedAnalyticsProps,
  LAZY_ONBOARDING_BANNER_BUTTON,
  LAZY_ONBOARDING_BANNER_PAGE,
  LAZY_ONBOARDING_BANNER_PAGE_NAME,
  type LazyOnboardingSharedAnalyticsProps,
} from "../../analyticsConstants";

export const trackLazyOnboardingBannerShown = (sharedProps: LazyOnboardingSharedAnalyticsProps) => {
  screen(
    LAZY_ONBOARDING_BANNER_PAGE,
    undefined,
    {
      name: LAZY_ONBOARDING_BANNER_PAGE_NAME,
      ...sharedProps,
    },
    false,
  );
};

export const trackLazyOnboardingBannerPressed = (
  mode: LazyOnboardingBannerMode,
  personalRecoOptIn: boolean,
) => {
  track("button_clicked", {
    button: LAZY_ONBOARDING_BANNER_BUTTON,
    page: LAZY_ONBOARDING_BANNER_PAGE,
    ...buildLazyOnboardingSharedAnalyticsProps(mode, personalRecoOptIn),
  });
};

export const trackLazyOnboardingBannerDismissed = () => {
  track("button_clicked", {
    button: "Dismiss",
    page: "Wallet",
    banner: "Lazy onboarding banner",
  });
};
