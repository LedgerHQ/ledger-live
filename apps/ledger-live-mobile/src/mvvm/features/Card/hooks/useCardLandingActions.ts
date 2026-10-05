import { track } from "@shared/analytics";
import { useCallback } from "react";
import { useNavigation } from "@react-navigation/core";
import { PAGE_NAME, CARD_APP_ID, CL_CARD_APP_ID } from "../constants";
import { NavigatorName, ScreenName } from "~/const";

const TRACKING_BUTTON_EVENT = "button_clicked";

export function useCardLandingActions() {
  const navigation = useNavigation();

  const goToExploreCards = useCallback(() => {
    track(TRACKING_BUTTON_EVENT, {
      button: "explore cards",
      page: PAGE_NAME,
    });
    navigation.navigate(NavigatorName.Card, {
      screen: ScreenName.Card,
      params: {
        platform: CARD_APP_ID,
        name: "Card Program",
        path: "/providers-list",
      },
    });
  }, [navigation]);

  const goToIHaveACard = useCallback(() => {
    track(TRACKING_BUTTON_EVENT, {
      button: "I have a card",
      page: PAGE_NAME,
    });
    navigation.navigate(NavigatorName.Card, {
      screen: ScreenName.Card,
      params: {
        platform: CL_CARD_APP_ID,
        name: "CL Card Powered by Ledger",
      },
    });
  }, [navigation]);

  return { goToExploreCards, goToIHaveACard };
}
