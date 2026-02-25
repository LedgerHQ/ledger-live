import Braze from "@braze/react-native-sdk";
import { useCallback, useRef } from "react";
import { useSelector, useDispatch } from "~/context/hooks";
import { track } from "~/analytics";
import { setDismissedContentCard } from "~/actions/settings";
import { trackingEnabledSelector } from "~/reducers/settings";
import { localMobileCardsSelector } from "~/reducers/dynamicContent";

const isLocalCard = (cardId: string, localMobileCards: Braze.ContentCard[]) =>
  localMobileCards.some(c => c.id === cardId);

export const useBrazeContentCard = (mobileCards: Braze.ContentCard[]) => {
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const localMobileCards = useSelector(localMobileCardsSelector);
  const mobileCardRef = useRef(mobileCards);
  const dispatch = useDispatch();

  const logDismissCard = useCallback(
    (cardId: string) => {
      if (isTrackedUser) {
        const isLocal = isLocalCard(cardId, localMobileCards);
        if (isLocal) return;
        Braze.logContentCardDismissed(cardId);
      } else {
        dispatch(setDismissedContentCard({ [cardId]: Date.now() }));
      }
    },
    [isTrackedUser, dispatch, localMobileCards],
  );

  const logClickCard = useCallback(
    (cardId: string) => {
      if (!isTrackedUser) return;
      const isLocal = isLocalCard(cardId, localMobileCards);
      if (isLocal) return;
      Braze.logContentCardClicked(cardId);
    },
    [isTrackedUser, localMobileCards],
  );

  const logImpressionCard = useCallback(
    (cardId: string, displayedPosition?: number) => {
      if (!isTrackedUser) return;

      const card = mobileCardRef.current.find(card => card.id === cardId);

      const isLocal = isLocalCard(cardId, localMobileCards);

      if (isLocal) return;

      Braze.logContentCardImpression(cardId);

      if (!card) return;
      track("contentcard_impression", {
        ...card.extras,
        page: card.extras.location,
        displayedPosition,
      });
    },
    [isTrackedUser, localMobileCards],
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
