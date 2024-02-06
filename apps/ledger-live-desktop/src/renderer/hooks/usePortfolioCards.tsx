import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ActionCard from "~/renderer/components/ContentCards/ActionCard";
import { portfolioContentCardSelector } from "~/renderer/reducers/dynamicContent";
import * as braze from "@braze/web-sdk";
import { setPortfolioCards } from "~/renderer/actions/dynamicContent";

const usePortfolioCards = () => {
  const dispatch = useDispatch();
  const [cachedContentCards, setCachedContentCards] = useState(braze.getCachedContentCards().cards);
  const portfolioCards = useSelector(portfolioContentCardSelector);

  const findCard = (cardId: string) => cachedContentCards.find(card => card.id === cardId);

  const onImpression = (cardId: string) => {
    const currentCard = findCard(cardId);
    currentCard && braze.logContentCardImpressions([currentCard]);
  };

  const onDismiss = (cardId: string) => {
    const currentCard = findCard(cardId);

    if (currentCard) {
      braze.logCardDismissal(currentCard);
      setCachedContentCards(cachedContentCards.filter(n => n.id !== currentCard.id));
      dispatch(setPortfolioCards(portfolioCards.filter(n => n.id !== currentCard.id)));
    }
  };

  const onClick = (cardId: string) => {
    const currentCard = findCard(cardId);

    if (currentCard) {
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
