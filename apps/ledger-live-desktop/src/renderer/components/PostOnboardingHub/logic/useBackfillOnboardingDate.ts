import { useEffect } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setPostOnboardingDate } from "@ledgerhq/live-common/postOnboarding/actions";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";

/**
 * Backfills `onboardingDate` for legacy users: users who already completed
 * onboarding before this field existed have no date stored. On the first launch
 * of the version introducing it, we set `onboardingDate = today` so the
 * post-onboarding cooldown clock starts then.
 *
 * Writes only once and never overwrites an existing date (new onboardings set
 * the real completion date via POST_ONBOARDING_INIT).
 */
export function useBackfillOnboardingDate(): void {
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const onboardingDate = useSelector(onboardingDateSelector);

  useEffect(() => {
    if (hasCompletedOnboarding && onboardingDate == null) {
      dispatch(setPostOnboardingDate({ onboardingDate: new Date() }));
    }
  }, [dispatch, hasCompletedOnboarding, onboardingDate]);
}
