import { useCallback, useMemo } from "react";
import type { ContactsFeatureIntroductionPreferencePort } from "@features/flow-contacts";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasDismissedContactsFeatureIntroduction } from "~/actions/settings";
import { hasDismissedContactsFeatureIntroductionSelector } from "~/reducers/settings";

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
