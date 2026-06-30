import { useEffect } from "react";
import { useLocation } from "react-router";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { isAppStartContentCardId } from "LLD/features/GenericAwarenessModal/utils/isAppStartContentCardId";
import { developerModeSelector } from "~/renderer/reducers/settings";
import {
  syncDevAppStartCardsToRedux,
  syncDevCardsToRedux,
} from "~/renderer/screens/settings/sections/Developer/GenericAwarenessModalDevTool/utils/applyDevCardsToStore";
import { getDevGenericAwarenessModalCards } from "~/renderer/screens/settings/sections/Developer/GenericAwarenessModalDevTool/utils/devCardsStore";

const isPortfolioPath = (pathname: string): boolean =>
  pathname === "/" || pathname === "/portfolio";

/**
 * Re-applies persisted QA cards to Redux.
 * Banner/deeplink cards hydrate on launch; APP_START cards hydrate only on `/` or `/portfolio`
 * (not on save-to-store) so dismiss state survives relaunch.
 * Only runs in developer mode; no-op otherwise (avoids QA cards in production).
 */
const useHydrateDevGenericAwarenessModalCards = (): void => {
  const dispatch = useDispatch();
  const developerMode = useSelector(developerModeSelector);
  const { pathname } = useLocation();
  const isPortfolio = isPortfolioPath(pathname);
  const hasAppStartDevCards = getDevGenericAwarenessModalCards().some(card =>
    isAppStartContentCardId(card.id),
  );

  useEffect(() => {
    if (!developerMode) {
      return;
    }
    if (getDevGenericAwarenessModalCards().length === 0) {
      return;
    }

    dispatch(syncDevCardsToRedux({ excludeAppStart: true }));
  }, [developerMode, dispatch]);

  useEffect(() => {
    if (!developerMode || !isPortfolio || !hasAppStartDevCards) {
      return;
    }

    dispatch(syncDevAppStartCardsToRedux());
  }, [developerMode, dispatch, hasAppStartDevCards, isPortfolio]);
};

export default useHydrateDevGenericAwarenessModalCards;
