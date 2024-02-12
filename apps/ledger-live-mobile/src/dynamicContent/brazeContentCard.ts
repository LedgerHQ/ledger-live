import { useCallback } from "react";
import Braze from "@braze/react-native-sdk";

export const useBrazeContentCard = () => {
  const logDismissCard = useCallback((cardId: string) => Braze.logContentCardDismissed(cardId), []);

  const logClickCard = useCallback((cardId: string) => Braze.logContentCardClicked(cardId), []);

  const logImpressionCard = useCallback(
    (cardId: string) => Braze.logContentCardImpression(cardId),
    [],
  );

  const refreshDynamicContent = () => Braze.requestContentCardsRefresh();

  return {
    logClickCard,
    logDismissCard,
    logImpressionCard,
    refreshDynamicContent,
    Braze,
  };
};
