import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ActionCard from "~/renderer/components/ContentCards/ActionCard";
import { actionContentCardSelector } from "~/renderer/reducers/dynamicContent";
import * as braze from "@braze/web-sdk";
import { setActionCards } from "~/renderer/actions/dynamicContent";
import { openURL } from "~/renderer/linking";
import { track } from "../analytics/segment";
import { trackingEnabledSelector } from "../reducers/settings";
import { setDismissedContentCards } from "../actions/settings";

const useActionCards = () => {
  const dispatch = useDispatch();
  const [cachedContentCards, setCachedContentCards] = useState(braze.getCachedContentCards().cards);
  const actionCards = useSelector(actionContentCardSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);

  useEffect(() => {
    setCachedContentCards(braze.getCachedContentCards().cards);
  }, [actionCards]);

  const findCard = (cardId: string) => cachedContentCards.find(card => card.id === cardId);
  const findActionCard = (cardId: string) => actionCards.find(card => card.id === cardId);

  const onImpression = (cardId: string) => {
    const currentCard = findCard(cardId);
    isTrackedUser && currentCard && braze.logContentCardImpressions([currentCard]);
  };

  const onDismiss = (cardId: string) => {
    const currentCard = findCard(cardId);
    const actionCard = findActionCard(cardId);

    if (currentCard) {
      isTrackedUser
        ? braze.logCardDismissal(currentCard)
        : currentCard.id &&
          dispatch(setDismissedContentCards({ id: currentCard.id, timestamp: Date.now() }));
      setCachedContentCards(cachedContentCards.filter(n => n.id !== currentCard.id));
      dispatch(setActionCards(actionCards.filter(n => n.id !== currentCard.id)));
    }
    if (actionCard) {
      track("contentcard_dismissed", {
        contentcard: actionCard.title,
        campaign: actionCard.id,
        page: "Portfolio",
        type: "action_card",
      });
    }
  };

  const onClick = (cardId: string, link?: string) => {
    const currentCard = findCard(cardId);
    const actionCard = findActionCard(cardId);

    if (currentCard) {
      // For some reason braze won't log the click event if the card url is empty
      // Setting it as the card id just to have a dummy non empty value
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      currentCard.url = currentCard.id;
      isTrackedUser && braze.logContentCardClick(currentCard as braze.ClassicCard);
      link && openURL(link);
    }
    if (actionCard) {
      track("contentcard_clicked", {
        contentcard: actionCard.title,
        link: actionCard.link,
        campaign: actionCard.id,
        page: "Portfolio",
        type: "action_card",
      });
    }
  };

  const slides = actionCards.map(slide => (
    <ActionCard
      key={slide.id}
      img={slide.image}
      title={slide.title}
      description={slide.description}
      actions={{
        primary: {
          label: slide.mainCta,
          action: () => onClick(slide.id, slide.link),
        },
        dismiss: {
          label: slide.secondaryCta,
          action: () => onDismiss(slide.id),
        },
      }}
      onView={() => onImpression(slide.id)}
    />
  ));

  return slides;
};

export default useActionCards;
