import Braze from "react-native-appboy-sdk";

export const useBrazeContentCard = () => {
  const logDismissCard = (cardId: string) =>
    Braze.logContentCardDismissed(cardId);

  const logClickCard = (cardId: string) => Braze.logContentCardClicked(cardId);
  const refreshDynamicContent = () => Braze.requestContentCardsRefresh();

  return { logClickCard, logDismissCard, refreshDynamicContent, Braze };
};
