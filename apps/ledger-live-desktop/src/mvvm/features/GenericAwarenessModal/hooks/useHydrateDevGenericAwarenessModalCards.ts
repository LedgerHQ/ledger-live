import { useEffect } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { developerModeSelector } from "~/renderer/reducers/settings";
import { syncDevCardsToRedux } from "~/renderer/screens/settings/sections/Developer/GenericAwarenessModalDevTool/utils/applyDevCardsToStore";
import { getDevGenericAwarenessModalCards } from "~/renderer/screens/settings/sections/Developer/GenericAwarenessModalDevTool/utils/devCardsStore";

/**
 * Re-applies persisted QA content cards to Redux after reload so app-start can open them.
 * Only runs in developer mode; no-op otherwise (avoids QA cards in production).
 */
const useHydrateDevGenericAwarenessModalCards = (): void => {
  const dispatch = useDispatch();
  const developerMode = useSelector(developerModeSelector);

  useEffect(() => {
    if (!developerMode) {
      return;
    }
    if (getDevGenericAwarenessModalCards().length === 0) {
      return;
    }

    dispatch(syncDevCardsToRedux());
  }, [developerMode, dispatch]);
};

export default useHydrateDevGenericAwarenessModalCards;
