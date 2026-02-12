import { useCallback } from "react";
import { useNavigate } from "react-router";
import { track } from "~/renderer/analytics/segment";
import { CARD_TRACKING_PAGE_NAME } from "../constants";

const CARD_APP_ID = "card-program";
const CL_CARD_APP_ID = "cl-card";
/** Path in card-program Live App for "Choose your crypto card" / providers list */
const CARD_PROGRAM_PATH_PROVIDERS_LIST = "/providers-list";

export const useCardViewModel = () => {
  const navigate = useNavigate();

  const goToExploreCards = useCallback(() => {
    track("button_clicked", {
      button: "explore cards",
      page: CARD_TRACKING_PAGE_NAME,
    });
    navigate(`/card/${CARD_APP_ID}?path=${encodeURIComponent(CARD_PROGRAM_PATH_PROVIDERS_LIST)}`, {
      state: { fromCardLanding: true },
    });
  }, [navigate]);

  const goToIHaveACard = useCallback(() => {
    track("button_clicked", {
      button: "I have a card",
      page: CARD_TRACKING_PAGE_NAME,
    });
    navigate(`/card/${CL_CARD_APP_ID}`, {
      state: { fromCardLanding: true },
    });
  }, [navigate]);

  return {
    goToExploreCards,
    goToIHaveACard,
  };
};
