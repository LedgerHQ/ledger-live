import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { usePostOnboardingPortfolioWidgetVisibility } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import {
  hasCompletedOnboardingSelector,
  onboardingCompletionDateSelector,
} from "~/reducers/settings";
import { addCompletionDate } from "~/actions/settings";

export const useOnboardingWidgetVisibility = () => {
  const dispatch = useDispatch();
  const { shouldDisplayOnboardingWidget } = useWalletFeaturesConfig("mobile");
  const onboardingCompletionDate = useSelector(onboardingCompletionDateSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const { isPortfolioWidgetBaseVisible } = usePostOnboardingPortfolioWidgetVisibility(
    flattenAccountsSelector,
  );

  const isBeforeCutoffTime = useMemo(() => {
    return onboardingCompletionDate === null
      ? hasCompletedOnboarding
      : differenceInCalendarDays(new Date(), new Date(onboardingCompletionDate)) <= 15;
  }, [onboardingCompletionDate, hasCompletedOnboarding]);

  useEffect(() => {
    // Populate completion dates for all users that have already completed onboarding
    // before completion date was introduced
    if (hasCompletedOnboarding && onboardingCompletionDate === null) {
      dispatch(addCompletionDate());
    }
  }, [hasCompletedOnboarding, onboardingCompletionDate, dispatch]);

  return isPortfolioWidgetBaseVisible && shouldDisplayOnboardingWidget && isBeforeCutoffTime;
};
