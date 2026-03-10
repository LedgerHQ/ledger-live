import { ClassicCard } from "@braze/web-sdk";
import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";

import * as braze from "@braze/web-sdk";
import { setActionCards } from "~/renderer/actions/dynamicContent";
import { openURL } from "~/renderer/linking";
import {
  actionContentCardSelector,
  desktopContentCardSelector,
} from "~/renderer/reducers/dynamicContent";
import { track } from "../analytics/segment";
import { trackingEnabledSelector } from "../reducers/settings";
import { setDismissedContentCards } from "../actions/settings";
import { ActionContentCard } from "~/types/dynamicContent";

const useActionCards = () => {
  const dispatch = useDispatch();
  const desktopCards = useSelector(desktopContentCardSelector);
  const actionCards = useSelector(actionContentCardSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);

  const findCard = useCallback(
    (cardId: string) => desktopCards.find(card => card.id === cardId),
    [desktopCards],
  );
  const findActionCard = useCallback(
    (cardId: string) => actionCards.find(card => card.id === cardId),
    [actionCards],
  );

  const onDismiss = (cardId: string, displayedPosition?: number) => {
    const currentCard = findCard(cardId);
    const actionCard = findActionCard(cardId);

    if (currentCard) {
      if (isTrackedUser) {
        braze.logCardDismissal(currentCard);
      } else if (currentCard.id) {
        dispatch(setDismissedContentCards({ id: currentCard.id, timestamp: Date.now() }));
      }
    }
    dispatch(setActionCards(actionCards.filter((n: ActionContentCard) => n.id !== actionCard?.id)));

    if (actionCard && !actionCard.isMock) {
      track("contentcard_dismissed", {
        ...currentCard?.extras,
        contentcard: actionCard.title,
        campaign: actionCard.id,
        page: "Portfolio",
        type: "action_card",
        displayedPosition,
        location: actionCard.location,
      });
    }
  };

  const onClick = (cardId: string, link?: string, displayedPosition?: number) => {
    const currentCard = findCard(cardId);
    const actionCard = findActionCard(cardId);

    if (actionCard?.isMock && link) openURL(link);

    if (currentCard && currentCard instanceof ClassicCard) {
      // For some reason braze won't log the click event if the card url is empty
      // Setting it as the card id just to have a dummy non empty value
      currentCard.url = currentCard.id;
      if (isTrackedUser) braze.logContentCardClick(currentCard);
      if (link) openURL(link);
    }
    if (actionCard) {
      track("contentcard_clicked", {
        ...currentCard?.extras,
        contentcard: actionCard.title,
        link: actionCard.link,
        campaign: actionCard.id,
        page: "Portfolio",
        type: "action_card",
        location: actionCard.location,
        displayedPosition,
      });
    }
  };

  return { onClick, onDismiss, actionCards };
};

export default useActionCards;
