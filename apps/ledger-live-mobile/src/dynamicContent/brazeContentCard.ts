import { useCallback } from "react";
import Braze from "@braze/react-native-sdk";
import { trackingEnabledSelector } from "../reducers/settings";
import { useSelector, useDispatch } from "react-redux";
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
    (cardId: string) => isTrackedUser && Braze.logContentCardImpression(cardId),
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
