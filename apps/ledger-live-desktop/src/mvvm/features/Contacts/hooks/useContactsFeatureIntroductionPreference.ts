import { useCallback, useMemo } from "react";
import type { ContactsFeatureIntroductionPreferencePort } from "@features/flow-contacts";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { setHasDismissedContactsFeatureIntroduction } from "~/renderer/actions/settings";
import { hasDismissedContactsFeatureIntroductionSelector } from "~/renderer/reducers/settings";

export function useContactsFeatureIntroductionPreference(): ContactsFeatureIntroductionPreferencePort {
  const dispatch = useDispatch();
  const isDismissed = useSelector(hasDismissedContactsFeatureIntroductionSelector);

  const markDismissed = useCallback(() => {
    dispatch(setHasDismissedContactsFeatureIntroduction(true));
  }, [dispatch]);

  return useMemo(
    () => ({
      isDismissed,
      markDismissed,
    }),
    [isDismissed, markDismissed],
  );
}
