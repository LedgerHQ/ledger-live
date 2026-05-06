import * as braze from "@braze/web-sdk";
import { ClassicCard } from "@braze/web-sdk";
import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";

import { track } from "~/renderer/analytics/segment";
import { setPortfolioCards, setBottomPortfolioCards } from "~/renderer/actions/dynamicContent";
import { setDismissedContentCards } from "~/renderer/actions/settings";
import {
  desktopContentCardSelector,
  portfolioContentCardSelector,
  bottomPortfolioContentCardSelector,
} from "~/renderer/reducers/dynamicContent";
import { trackingEnabledSelector } from "~/renderer/reducers/settings";
import type { PortfolioContentCard } from "~/types/dynamicContent";
import type { CarouselActions } from "../types";
import { sanitizeExtras } from "~/renderer/hooks/useBraze";

export type PortfolioCarouselVariant = "top" | "bottom";

const SELECTORS = {
  top: portfolioContentCardSelector,
  bottom: bottomPortfolioContentCardSelector,
} as const;

const SETTERS = {
  top: setPortfolioCards,
  bottom: setBottomPortfolioCards,
} as const;

export type UsePortfolioCarouselCardsResult = {
  portfolioCards: PortfolioContentCard[];
} & CarouselActions;

export function usePortfolioCarouselCards(
  variant: PortfolioCarouselVariant,
): UsePortfolioCarouselCardsResult {
  const desktopCards = useSelector(desktopContentCardSelector);
  const portfolioCards = useSelector(SELECTORS[variant]);
  const isTrackedUser = useSelector(trackingEnabledSelector);
  const dispatch = useDispatch();
  const setCards = SETTERS[variant];

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
            ...sanitizeExtras(currentCard.extras),
            card: slide.id,
            page: "Portfolio",
            type: "portfolio_carousel",
            location: slide.location,
            displayedPosition: index,
          });
        } else if (currentCard.id) {
          dispatch(setDismissedContentCards({ id: currentCard.id, timestamp: Date.now() }));
        }
      }
      dispatch(setCards(portfolioCards.filter(n => n.id !== slide.id)));
    },
    [portfolioCards, getBrazeCard, isTrackedUser, dispatch, setCards],
  );

  const logSlideClick = useCallback<CarouselActions["logSlideClick"]>(
    cardId => {
      if (!isTrackedUser) return;

      const slideIndex = portfolioCards.findIndex(card => card.id === cardId);
      const slide = slideIndex >= 0 ? portfolioCards[slideIndex] : undefined;
      if (!slide) return;
      const currentCard = getBrazeCard(cardId);

      if (!currentCard || !(currentCard instanceof ClassicCard)) return;
      // For some reason braze won't log the click event if the card url is empty
      // Setting it as the card id just to have a dummy non empty value
      currentCard.url = currentCard.id;
      braze.logContentCardClick(currentCard);
      track("contentcard_clicked", {
        ...sanitizeExtras(currentCard.extras),
        contentcard: slide.title,
        link: slide.path || slide.url,
        campaign: cardId,
        page: "Portfolio",
        type: "portfolio_carousel",
        location: slide.location,
        displayedPosition: slideIndex,
      });
    },
    [portfolioCards, getBrazeCard, isTrackedUser],
  );

  return { portfolioCards, logSlideClick, dismissCard };
}
