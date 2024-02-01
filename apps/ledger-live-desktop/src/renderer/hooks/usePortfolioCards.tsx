import map from "lodash/map";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ActionCard from "~/renderer/components/ContentCards/ActionCard";
import { portfolioContentCardSelector } from "~/renderer/reducers/dynamicContent";
import * as braze from "@braze/web-sdk";
import { setPortfolioCards } from "~/renderer/actions/dynamicContent";

const usePortfolioCards = () => {
  const [cachedContentCards, setCachedContentCards] = useState<braze.Card[]>([]);
  const portfolioCards = useSelector(portfolioContentCardSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    const cards = braze.getCachedContentCards().cards;
    setCachedContentCards(cards);
  }, []);

  const onImpression = (cardId: string) => {
    const currentCard = cachedContentCards.find(card => card.id === cardId);

    if (currentCard) {
      braze.logContentCardImpressions([currentCard]);
    }
  };

  const onDismiss = (cardId: string) => {
    const currentCard = cachedContentCards.find(card => card.id === cardId);

    if (currentCard) {
      braze.logCardDismissal(currentCard);
      setCachedContentCards(cachedContentCards.filter(n => n.id !== currentCard.id));
      dispatch(setPortfolioCards(portfolioCards.filter(n => n.id !== currentCard.id)));
    }
  };

  const onClick = (cardId: string) => {
    const currentCard = cachedContentCards.find(card => card.id === cardId);

    if (currentCard) {
      // For some reason braze won't log the click event if the card url is empty
      // Setting it as the card id just to have a dummy non empty value
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      currentCard.url = currentCard.id;
      braze.logContentCardClick(currentCard);
    }
  };

  const slides = portfolioCards.map(slide => (
    <ActionCard
      key={slide.id}
      img={slide.image}
      title={slide.title}
      description={slide.description}
      actions={{
        primary: {
          label: slide.cta,
          action: () => onClick(slide.id),
        },
        dismiss: {
          label: slide.dismissCta,
          action: () => onDismiss(slide.id),
        },
      }}
      onView={() => onImpression(slide.id)}
    />
  ));

  return slides;
};

export default usePortfolioCards;
