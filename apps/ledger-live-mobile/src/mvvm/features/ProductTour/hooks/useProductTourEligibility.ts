import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";

/** `lwmProductTour` on and onboarding complete (LIVE-28122). */
export const useProductTourEligibility = () => {
  const lwmProductTour = useFeature("lwmProductTour");
  const isLwmProductTourEnabled = lwmProductTour?.enabled ?? false;
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const isProductTourEligible = isLwmProductTourEnabled && hasCompletedOnboarding;

  return { isProductTourEligible };
};
