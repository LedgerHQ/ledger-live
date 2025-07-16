import * as braze from "@braze/web-sdk";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { track } from "~/renderer/analytics/segment";
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

  const dismissCard = useCallback<CarouselActions["dismissCard"]>(
    index => {
      const slide = portfolioCards[index];
      if (!slide?.id) return;

      if (isTrackedUser) {
        track("contentcard_dismissed", {
          card: slide.id,
          page: "Portfolio",
          type: "portfolio_carousel",
        });
      }

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

  const logSlideClick = useCallback<CarouselActions["logSlideClick"]>(
    cardId => {
      if (!isTrackedUser) return;

      const slide = portfolioCards.find(card => card.id === cardId);
      if (!slide) return;

      track("contentcard_clicked", {
        contentcard: slide.title,
        link: slide.path || slide.url,
        campaign: cardId,
        page: "Portfolio",
        type: "portfolio_carousel",
      });

      const currentCard = cachedContentCards.find(card => card.id === cardId);
      if (!currentCard) return;
      // For some reason braze won't log the click event if the card url is empty
      // Setting it as the card id just to have a dummy non empty value
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-expect-error
      currentCard.url = currentCard.id;
      braze.logContentCardClick(currentCard as braze.ClassicCard);
    },
    [portfolioCards, cachedContentCards, isTrackedUser],
  );

  return { portfolioCards, logSlideClick, dismissCard };
}
