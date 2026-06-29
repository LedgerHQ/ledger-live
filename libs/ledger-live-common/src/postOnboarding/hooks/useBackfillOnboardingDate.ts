import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPostOnboardingDate } from "../actions";
import { postOnboardingOnboardingDateSelector } from "../reducer";

/**
 * Backfills the persisted `onboardingDate` for legacy users (LWD + LWM).
 *
 * On app start, if onboarding is already done and no date has been stored yet,
 * writes "today" so the large-screen upsell cooldown clock starts on the first
 * launch of the version that introduces this — nobody is upsold within the
 * cooldown window of opening the new version.
 *
 * Writes only once and never overwrites an existing date (the guard on
 * `onboardingDate == null`). Brand-new onboardings already get the date from
 * the POST_ONBOARDING_INIT handler.
 *
 * @param isOnboardingDone — app selector value for "onboarding completed"
 *   (e.g. hasCompletedOnboardingSelector).
 */
export function useBackfillOnboardingDate(isOnboardingDone: boolean): void {
  const dispatch = useDispatch();
  const onboardingDate = useSelector(postOnboardingOnboardingDateSelector);

  useEffect(() => {
    if (isOnboardingDone && onboardingDate == null) {
      dispatch(setPostOnboardingDate(new Date()));
    }
  }, [isOnboardingDone, onboardingDate, dispatch]);
}
