import { useEffect } from "react";
import { setPostOnboardingDate } from "@ledgerhq/live-common/postOnboarding/actions";
import { onboardingDateSelector } from "@ledgerhq/live-common/postOnboarding/reducer";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";

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
