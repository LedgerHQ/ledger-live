import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "~/context/hooks";
import { hasCompletedOnboardingSelector, productTourCompletedSelector } from "~/reducers/settings";

export const useProductTourEligibility = () => {
  const lwmProductTour = useFeature("lwmProductTour");
  const isLwmProductTourEnabled = lwmProductTour?.enabled ?? false;
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const productTourCompleted = useSelector(productTourCompletedSelector);

  const isProductTourEligible =
    isLwmProductTourEnabled && hasCompletedOnboarding && !productTourCompleted;

  return { isProductTourEligible };
};
