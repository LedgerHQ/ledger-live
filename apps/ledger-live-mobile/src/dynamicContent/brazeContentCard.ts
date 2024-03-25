import { useCallback } from "react";
import Braze from "@braze/react-native-sdk";

export const useBrazeContentCard = () => {
  const logDismissCard = useCallback(() => console.log("dismiss card"), []);

  const logClickCard = useCallback(() => console.log("dismiss card"), []);

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
