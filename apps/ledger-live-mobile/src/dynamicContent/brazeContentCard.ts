import { useCallback } from "react";
import Braze from "@braze/react-native-sdk";
import { trackingEnabledSelector } from "../reducers/settings";
import { useSelector, useDispatch } from "react-redux";
import { track } from "~/analytics";
import { setDismissedContentCard } from "../actions/settings";

export const useBrazeContentCard = () => {
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const dispatch = useDispatch();

  const logDismissCard = useCallback(
    (cardId: string) =>
      isTrackedUser
        ? Braze.logContentCardDismissed(cardId)
        : dispatch(setDismissedContentCard({ [cardId]: Date.now() })),
    [isTrackedUser, dispatch],
  );

  const logClickCard = useCallback(
    (cardId: string) => isTrackedUser && Braze.logContentCardClicked(cardId),
    [isTrackedUser],
  );

  const logImpressionCard = useCallback(
    async (cardId: string) => {
      if (!isTrackedUser) return;

      Braze.logContentCardImpression(cardId);

      const allCachedContentCards = await Braze.getCachedContentCards();
      const card = allCachedContentCards.find(card => card.id === cardId);
      if (!card) return;
      track("contentcard_impression", { ...card.extras, page: card.extras.location });
    },
    [isTrackedUser],
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
