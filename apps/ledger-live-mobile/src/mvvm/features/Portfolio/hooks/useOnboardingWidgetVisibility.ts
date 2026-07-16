import { useMemo } from "react";
import { useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import { useFeature } from "@features/platform-feature-flags";
import {
  usePostOnboardingHubState,
  usePostOnboardingPortfolioWidgetVisibility,
} from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { usePostOnboardingHubStepperDisplay } from "~/logic/postOnboarding/usePostOnboardingHubStepperDisplay";
import {
  isPostOnboardingBeforeCutoffTime,
  usePostOnboardingCompletionDateBackfill,
} from "LLM/features/PostOnboarding/utils/postOnboardingCompletionWindow";
import {
  hasCompletedOnboardingSelector,
  onboardingCompletionDateSelector,
} from "~/reducers/settings";

export const useOnboardingWidgetVisibility = () => {
  const onboardingWidgetFeature = useFeature("onboardingWidget");
  const shouldDisplayOnboardingWidget = onboardingWidgetFeature?.enabled ?? false;
  const onboardingCompletionDate = useSelector(onboardingCompletionDateSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const { isPortfolioWidgetBaseVisible } =
    usePostOnboardingPortfolioWidgetVisibility(flattenAccountsSelector);

  const { actionsState } = usePostOnboardingHubState();
  const { areAllActionsCompleted } = usePostOnboardingHubStepperDisplay(actionsState);

  const isBeforeCutoffTime = useMemo(
    () => isPostOnboardingBeforeCutoffTime({ onboardingCompletionDate, hasCompletedOnboarding }),
    [onboardingCompletionDate, hasCompletedOnboarding],
  );

  usePostOnboardingCompletionDateBackfill();

  const areHubStepsDone = actionsState.length > 0 && areAllActionsCompleted;

  return (
    isPortfolioWidgetBaseVisible &&
    shouldDisplayOnboardingWidget &&
    isBeforeCutoffTime &&
    !areHubStepsDone
  );
};
