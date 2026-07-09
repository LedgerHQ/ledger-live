import { useEffect, useMemo } from "react";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { postOnboardingSetFinished } from "@ledgerhq/live-common/postOnboarding/actions";
import { useDispatch, useSelector } from "~/context/hooks";
import { flattenAccountsSelector } from "~/reducers/accounts";
import {
  hasCompletedOnboardingSelector,
  onboardingCompletionDateSelector,
} from "~/reducers/settings";
import { usePostOnboardingHubStepperDisplay } from "~/logic/postOnboarding/usePostOnboardingHubStepperDisplay";
import {
  isPostOnboardingCutoffElapsed,
  usePostOnboardingCompletionDateBackfill,
} from "../utils/postOnboardingCompletionWindow";

export function useAutoFinishPostOnboarding() {
  const dispatch = useDispatch();
  const { actionsState, postOnboardingInProgress } = usePostOnboardingHubState();
  const { areAllActionsCompleted } = usePostOnboardingHubStepperDisplay(actionsState);
  const accounts = useSelector(flattenAccountsSelector);
  const onboardingCompletionDate = useSelector(onboardingCompletionDateSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  usePostOnboardingCompletionDateBackfill();

  const hasAccountsWithFunds = useMemo(
    () => accounts.some(account => account?.balance?.isGreaterThan(0)),
    [accounts],
  );

  const areHubStepsDone = actionsState.length > 0 && areAllActionsCompleted;

  const isCutoffElapsed = isPostOnboardingCutoffElapsed({
    onboardingCompletionDate,
    hasCompletedOnboarding,
  });

  const isPhaseOver = hasAccountsWithFunds || isCutoffElapsed || areHubStepsDone;

  useEffect(() => {
    if (postOnboardingInProgress && isPhaseOver) {
      dispatch(postOnboardingSetFinished());
    }
  }, [dispatch, postOnboardingInProgress, isPhaseOver]);
}
