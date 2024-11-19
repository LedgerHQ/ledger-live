import * as braze from "@braze/web-sdk";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { setPortfolioCards } from "~/renderer/actions/dynamicContent";
import { setDismissedContentCards } from "~/renderer/actions/settings";
import { portfolioContentCardSelector } from "~/renderer/reducers/dynamicContent";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import type { PortfolioContentCard } from "~/types/dynamicContent";
import type { CarouselActions } from "../types";

type UsePortfolioCards = { portfolioCards: PortfolioContentCard[] } & CarouselActions;

export function usePortfolioCards(): UsePortfolioCards {
  const [cachedContentCards, setCachedContentCards] = useState<braze.Card[]>([]);
  const portfolioCards = useSelector(portfolioContentCardSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    const cards = braze.getCachedContentCards().cards;
    setCachedContentCards(cards);
  }, []);

  const logSlideImpression = useCallback(
    (index: number) => {
      if (!isTrackedUser) return;

      const slide = portfolioCards[index];
      if (!slide?.id) return;

      const currentCard = cachedContentCards.find(card => card.id === slide.id);
      if (!currentCard) return;

      braze.logContentCardImpressions([currentCard]);
    },
    [portfolioCards, cachedContentCards, isTrackedUser],
  );

  const dismissCard = useCallback(
    (index: number) => {
      const slide = portfolioCards[index];
      if (!slide?.id) return;

      const currentCard = cachedContentCards.find(card => card.id === slide.id);
      if (currentCard) {
        if (isTrackedUser) {
          braze.logCardDismissal(currentCard);
        } else if (currentCard.id) {
          dispatch(setDismissedContentCards({ id: currentCard.id, timestamp: Date.now() }));
        }
        setCachedContentCards(cachedContentCards.filter(n => n.id !== currentCard.id));
      }
      dispatch(setPortfolioCards(portfolioCards.filter(n => n.id !== slide.id)));
    },
    [portfolioCards, cachedContentCards, isTrackedUser, dispatch],
  );

  const logSlideClick = useCallback(
    (cardId: string) => {
      if (!isTrackedUser) return;

      const currentCard = cachedContentCards.find(card => card.id === cardId);
      if (!currentCard) return;

      braze.logContentCardClick(currentCard);
    },
    [cachedContentCards, isTrackedUser],
  );

  return {
    portfolioCards,
    logSlideClick,
    logSlideImpression,
    dismissCard,
  };
}
