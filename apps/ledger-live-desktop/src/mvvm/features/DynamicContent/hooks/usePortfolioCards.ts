import * as braze from "@braze/web-sdk";
import { ClassicCard } from "@braze/web-sdk";
import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";

import { track } from "~/renderer/analytics/segment";
import { setPortfolioCards } from "~/renderer/actions/dynamicContent";
import { setDismissedContentCards } from "~/renderer/actions/settings";
import {
  desktopContentCardSelector,
  portfolioContentCardSelector,
} from "~/renderer/reducers/dynamicContent";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import type { PortfolioContentCard } from "~/types/dynamicContent";
import type { CarouselActions } from "../types";

type UsePortfolioCards = { portfolioCards: PortfolioContentCard[] } & CarouselActions;

export function usePortfolioCards(): UsePortfolioCards {
  const desktopCards = useSelector(desktopContentCardSelector);
  const portfolioCards = useSelector(portfolioContentCardSelector);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const dispatch = useDispatch();

  const getBrazeCard = useCallback(
    (cardId: string) => desktopCards.find(card => card.id === cardId),
    [desktopCards],
  );

  const dismissCard = useCallback<CarouselActions["dismissCard"]>(
    index => {
      const slide = portfolioCards[index];
      if (!slide?.id) return;
      const currentCard = getBrazeCard(slide.id);

      if (currentCard) {
        if (isTrackedUser) {
          braze.logCardDismissal(currentCard);
          track("contentcard_dismissed", {
            ...currentCard.extras,
            card: slide.id,
            page: "Portfolio",
            type: "portfolio_carousel",
            location: slide.location,
          });
        } else if (currentCard.id) {
          dispatch(setDismissedContentCards({ id: currentCard.id, timestamp: Date.now() }));
        }
      }
      dispatch(setPortfolioCards(portfolioCards.filter(n => n.id !== slide.id)));
    },
    [portfolioCards, getBrazeCard, isTrackedUser, dispatch],
  );

  const logSlideClick = useCallback<CarouselActions["logSlideClick"]>(
    cardId => {
      if (!isTrackedUser) return;

      const slide = portfolioCards.find(card => card.id === cardId);
      if (!slide) return;
      const currentCard = getBrazeCard(cardId);

      if (!currentCard || !(currentCard instanceof ClassicCard)) return;
      // For some reason braze won't log the click event if the card url is empty
      // Setting it as the card id just to have a dummy non empty value
      currentCard.url = currentCard.id;
      braze.logContentCardClick(currentCard);
      track("contentcard_clicked", {
        ...currentCard.extras,
        contentcard: slide.title,
        link: slide.path || slide.url,
        campaign: cardId,
        page: "Portfolio",
        type: "portfolio_carousel",
        location: slide.location,
      });
    },
    [portfolioCards, getBrazeCard, isTrackedUser],
  );

  return { portfolioCards, logSlideClick, dismissCard };
}
