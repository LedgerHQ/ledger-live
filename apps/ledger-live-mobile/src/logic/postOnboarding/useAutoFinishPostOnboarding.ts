import { useEffect, useMemo } from "react";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import {
  usePostOnboardingHubState,
  usePostOnboardingPortfolioWidgetVisibility,
} from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { postOnboardingSetFinished } from "@ledgerhq/live-common/postOnboarding/actions";
import { useDispatch, useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import {
  hasCompletedOnboardingSelector,
  onboardingCompletionDateSelector,
} from "~/reducers/settings";
import { usePostOnboardingHubStepperDisplay } from "~/logic/postOnboarding/usePostOnboardingHubStepperDisplay";

const cutoffDays = 15;

export function useAutoFinishPostOnboarding() {
  const dispatch = useDispatch();
  const { actionsState, postOnboardingInProgress } = usePostOnboardingHubState();
  const { isPortfolioWidgetBaseVisible } =
    usePostOnboardingPortfolioWidgetVisibility(flattenAccountsSelector);
  const { areAllActionsCompleted } = usePostOnboardingHubStepperDisplay(actionsState);

  const onboardingCompletionDate = useSelector(onboardingCompletionDateSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  const isCutoffElapsed = useMemo(() => {
    if (onboardingCompletionDate === null) return !hasCompletedOnboarding;
    return differenceInCalendarDays(new Date(), new Date(onboardingCompletionDate)) > cutoffDays;
  }, [onboardingCompletionDate, hasCompletedOnboarding]);

  const areHubStepsDone = actionsState.length > 0 && areAllActionsCompleted;

  const isPhaseOver = !isPortfolioWidgetBaseVisible || isCutoffElapsed || areHubStepsDone;

  useEffect(() => {
    if (postOnboardingInProgress && isPhaseOver) {
      dispatch(postOnboardingSetFinished());
    }
  }, [dispatch, postOnboardingInProgress, isPhaseOver]);

  return null;
}
