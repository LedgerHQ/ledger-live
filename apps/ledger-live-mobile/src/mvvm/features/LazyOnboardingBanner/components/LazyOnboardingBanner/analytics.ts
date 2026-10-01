import { trackPage, track } from "@shared/analytics";
import type { LazyOnboardingBannerMode } from "@features/flow-lazy-onboarding-banner";
import {
  buildLazyOnboardingSharedAnalyticsProps,
  LAZY_ONBOARDING_BANNER_BUTTON,
  LAZY_ONBOARDING_BANNER_PAGE,
  LAZY_ONBOARDING_BANNER_PAGE_NAME,
  type LazyOnboardingSharedAnalyticsProps,
} from "../../analyticsConstants";

export const trackLazyOnboardingBannerShown = (sharedProps: LazyOnboardingSharedAnalyticsProps) => {
  trackPage({
    category: LAZY_ONBOARDING_BANNER_PAGE,
    props: {
      name: LAZY_ONBOARDING_BANNER_PAGE_NAME,
      ...sharedProps,
    },
  });
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
