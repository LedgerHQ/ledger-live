import { useEffect } from "react";
import differenceInCalendarDays from "date-fns/differenceInCalendarDays";
import { useDispatch, useSelector } from "~/context/hooks";
import { addCompletionDate } from "~/actions/settings";
import {
  hasCompletedOnboardingSelector,
  onboardingCompletionDateSelector,
} from "~/reducers/settings";

export const POST_ONBOARDING_CUTOFF_DAYS = 15;

export function isPostOnboardingBeforeCutoffTime({
  onboardingCompletionDate,
  hasCompletedOnboarding,
  now = new Date(),
}: {
  onboardingCompletionDate: string | null;
  hasCompletedOnboarding: boolean;
  now?: Date;
}): boolean {
  if (onboardingCompletionDate === null) {
    return hasCompletedOnboarding;
  }
  return (
    differenceInCalendarDays(now, new Date(onboardingCompletionDate)) <= POST_ONBOARDING_CUTOFF_DAYS
  );
}

export function isPostOnboardingCutoffElapsed({
  onboardingCompletionDate,
  hasCompletedOnboarding,
  now = new Date(),
}: {
  onboardingCompletionDate: string | null;
  hasCompletedOnboarding: boolean;
  now?: Date;
}): boolean {
  return (
    onboardingCompletionDate !== null &&
    !isPostOnboardingBeforeCutoffTime({ onboardingCompletionDate, hasCompletedOnboarding, now })
  );
}

export function usePostOnboardingCompletionDateBackfill() {
  const dispatch = useDispatch();
  const onboardingCompletionDate = useSelector(onboardingCompletionDateSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);

  useEffect(() => {
    if (hasCompletedOnboarding && onboardingCompletionDate === null) {
      dispatch(addCompletionDate());
    }
  }, [hasCompletedOnboarding, onboardingCompletionDate, dispatch]);
}
