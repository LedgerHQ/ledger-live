import React, { useCallback, useEffect, useMemo, useState } from "react";
import map from "lodash/map";
import Slide from "./Slide";
import { portfolioContentCardSelector } from "~/renderer/reducers/dynamicContent";
import { useDispatch, useSelector } from "react-redux";
import * as braze from "@braze/web-sdk";
import { ContentCard } from "~/types/dynamicContent";
import { setPortfolioCards } from "~/renderer/actions/dynamicContent";

export const getTransitions = (transition: "slide" | "flip", reverse = false) => {
  const mult = reverse ? -1 : 1;
  return {
    flip: {
      from: {
        opacity: 1,
        transform: `rotateX(${180 * mult}deg)`,
      },
      enter: {
        opacity: 1,
        transform: "rotateX(0deg)",
      },
      leave: {
        opacity: 1,
        transform: `rotateX(${-180 * mult}deg)`,
      },
      config: { mass: 20, tension: 200, friction: 100 },
    },
    slide: {
      from: {
        opacity: 1,
        transform: `translate3d(${100 * mult}%,0,0)`,
      },
      enter: {
        opacity: 1,
        transform: "translate3d(0%,0,0)",
      },
      leave: {
        opacity: 1,
        transform: `translate3d((${-100 * mult}%,0,0)`,
      },
      initial: null,
    },
  }[transition];
};

type SlideRes = {
  id: string;
  Component: React.ComponentType<{}>;
};

export const useDefaultSlides = (): {
  slides: SlideRes[];
  logSlideImpression: (index: number) => void;
  dismissCard: (index: number) => void;
} => {
  const [cachedContentCards, setCachedContentCards] = useState<braze.Card[]>([]);
  const portfolioCards = useSelector(portfolioContentCardSelector);
  const dispatch = useDispatch();

  useEffect(() => {
    const cards = braze.getCachedContentCards().cards;
    setCachedContentCards(cards);
  }, []);

  const logSlideImpression = useCallback(
    (index: number) => {
      if (portfolioCards && portfolioCards.length > index) {
        const slide = portfolioCards[index];
        if (slide?.id) {
          const currentCard = cachedContentCards.find(card => card.id === slide.id);

          if (currentCard) {
            braze.logContentCardImpressions([currentCard]);
          }
        }
      }
    },
    [portfolioCards, cachedContentCards],
  );

  const dismissCard = useCallback(
    (index: number) => {
      if (portfolioCards && portfolioCards.length > index) {
        const slide = portfolioCards[index];
        if (slide?.id) {
          const currentCard = cachedContentCards.find(card => card.id === slide.id);

          if (currentCard) {
            braze.logCardDismissal(currentCard);
            setCachedContentCards(cachedContentCards.filter(n => n.id !== currentCard.id));
            dispatch(setPortfolioCards(portfolioCards.filter(n => n.id !== slide.id)));
          }
        }
      }
    },
    [portfolioCards, cachedContentCards, dispatch],
  );

  const logSlideClick = useCallback(
    (cardId: string) => {
      const currentCard = cachedContentCards.find(card => card.id === cardId);

      if (currentCard) {
        // For some reason braze won't log the click event if the card url is empty
        // Setting it as the card id just to have a dummy non empty value
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        currentCard.url = currentCard.id;
        braze.logContentCardClick(currentCard);
      }
    },
    [cachedContentCards],
  );
  const slides = useMemo(
    () =>
      map<ContentCard, SlideRes>(
        portfolioCards,
        (slide): SlideRes => ({
          id: slide.id,
          // eslint-disable-next-line react/display-name
          Component: () => <Slide {...slide} onClickOnSlide={logSlideClick} />,
        }),
      ),
    [portfolioCards, logSlideClick],
  );

  return {
    slides,
    logSlideImpression,
    dismissCard,
  };
};
