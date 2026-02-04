import { useCallback } from "react";
import { useNavigate } from "react-router";

const CARD_APP_ID = "card-program";
const CL_CARD_APP_ID = "cl-card";
/** Path in card-program Live App for "Choose your crypto card" / providers list */
const CARD_PROGRAM_PATH_PROVIDERS_LIST = "/providers-list";

export const useCardViewModel = () => {
  const navigate = useNavigate();

  const goToExploreCards = useCallback(() => {
    navigate(`/card/${CARD_APP_ID}?path=${encodeURIComponent(CARD_PROGRAM_PATH_PROVIDERS_LIST)}`, {
      state: { fromCardLanding: true },
    });
  }, [navigate]);

  const goToIHaveACard = useCallback(() => {
    navigate(`/card/${CL_CARD_APP_ID}`, {
      state: { fromCardLanding: true },
    });
  }, [navigate]);

  return {
    goToExploreCards,
    goToIHaveACard,
  };
};
