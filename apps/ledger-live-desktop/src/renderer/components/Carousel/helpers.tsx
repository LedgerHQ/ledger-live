import React, { useCallback, useEffect, useMemo, useState } from "react";
import map from "lodash/map";
import Slide from "./Slide";
import { portfolioContentCardSelector } from "~/renderer/reducers/dynamicContent";
import { useSelector } from "react-redux";
import * as braze from "@braze/web-sdk";

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
        position: "absolute",
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

export const useDefaultSlides = () => {
  const [cachedContentCards, setCachedContentCards] = useState<braze.Card[]>([]);
  const portfolioCards = useSelector(portfolioContentCardSelector);

  useEffect(() => {
    const cards = braze.getCachedContentCards().cards;
    setCachedContentCards(cards);
  }, []);

  const logSlideImpression = useCallback(
    index => {
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

  const logSlideClick = useCallback(
    cardId => {
      const currentCard = cachedContentCards.find(card => card.id === cardId);

      if (currentCard) {
        // For some reason braze won't log the click event if the card url is empty
        // Setting it as the card id just to have a dummy non empty value
        // @ts-ignore
        currentCard.url = currentCard.id;
        braze.logContentCardClick(currentCard);
      }
    },
    [portfolioCards, cachedContentCards],
  );
  const slides = useMemo(
    () =>
      map(portfolioCards, (slide: Props) => ({
        id: slide.name,
        // eslint-disable-next-line react/display-name
        Component: () => <Slide {...slide} onClickOnSlide={logSlideClick} />,
      })),
    [portfolioCards, logSlideClick],
  );

  return {
    slides,
    logSlideImpression,
  };
};
