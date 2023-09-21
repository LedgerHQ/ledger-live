import React, { useCallback, useEffect, useMemo, useState } from "react";
import map from "lodash/map";
import { Trans } from "react-i18next";
import { getEnv } from "@ledgerhq/live-env";
import Slide from "./Slide";
import BuyCryptoBgImage from "./banners/BuyCrypto/images/bg.png";
import BuyCryptoCartImage from "./banners/BuyCrypto/images/cart.png";
import BuyCryptoCoinImage from "./banners/BuyCrypto/images/coin.png";
import BuyCryptoCoin2Image from "./banners/BuyCrypto/images/coin2.png";
import BuyCryptoCoin3Image from "./banners/BuyCrypto/images/coin3.png";
import SwapBgImage from "./banners/Swap/images/bg.png";
import SwapCoin1Image from "./banners/Swap/images/coin1.png";
import SwapCoin2Image from "./banners/Swap/images/coin2.png";
import SwapLoopImage from "./banners/Swap/images/loop.png";
import SwapSmallCoin1Image from "./banners/Swap/images/smallcoin1.png";
import SwapSmallCoin2Image from "./banners/Swap/images/smallcoin2.png";
import SwapSmallCoin3Image from "./banners/Swap/images/smallcoin3.png";
import { portfolioContentCardSelector } from "~/renderer/reducers/dynamicContent";
import { useSelector } from "react-redux";
import * as braze from "@braze/web-sdk";
import { ContentCard } from "~/types/dynamicContent";

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

const exchangeSlide: ContentCard = {
  path: "/exchange",
  id: "buyCrypto",
  title: <Trans i18nKey={`banners.buyCrypto.title`} />,
  description: <Trans i18nKey={`banners.buyCrypto.description`} />,
  imgs: [
    {
      source: BuyCryptoBgImage,
      transform: [-10, 60, -8, 60],
      size: {
        width: 180,
        height: 180,
      },
    },
    {
      source: BuyCryptoCartImage,
      transform: [20, 40, 7, 40],
      size: {
        width: 131,
        height: 130,
      },
    },
    {
      source: BuyCryptoCoinImage,
      transform: [53, 30, 53, 30],
      size: {
        width: 151,
        height: 21,
      },
    },
    {
      source: BuyCryptoCoin2Image,
      transform: [58, 25, 20, 25],
      size: {
        width: 151,
        height: 17,
      },
    },
    {
      source: BuyCryptoCoin3Image,
      transform: [29, 20, 33, 20],
      size: {
        width: 151,
        height: 24,
      },
    },
  ],
};
const swapSlide: ContentCard = {
  path: "/swap",
  id: "swap",
  title: <Trans i18nKey={`banners.swap.title`} />,
  description: <Trans i18nKey={`banners.swap.description`} />,
  imgs: [
    {
      source: SwapBgImage,
      transform: [0, 60, 5, 60],
      size: {
        width: 180,
        height: 180,
      },
    },
    {
      source: SwapCoin1Image,
      transform: [37, 25, 24, 25],
      size: {
        width: 48,
        height: 55,
      },
    },
    {
      source: SwapCoin2Image,
      transform: [115, 25, 28, 25],
      size: {
        width: 50,
        height: 53,
      },
    },
    {
      source: SwapLoopImage,
      transform: [20, 35, 5, 35],
      size: {
        width: 160,
        height: 99,
      },
    },
    {
      source: SwapSmallCoin1Image,
      transform: [115, 15, 35, 15],
      size: {
        width: 18,
        height: 14,
      },
    },
    {
      source: SwapSmallCoin2Image,
      transform: [88, 20, 65, 20],
      size: {
        width: 4,
        height: 5,
      },
    },
    {
      source: SwapSmallCoin3Image,
      transform: [78, 17, 32, 17],
      size: {
        width: 10,
        height: 13,
      },
    },
  ],
};

type SlideRes = {
  id: string;
  Component: React.ComponentType<{}>;
};

export const useDefaultSlides = (): {
  slides: SlideRes[];
  logSlideImpression: (index: number) => void;
} => {
  const [cachedContentCards, setCachedContentCards] = useState<braze.Card[]>([]);
  const portfolioCards = useSelector(portfolioContentCardSelector);

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
        getEnv("PLAYWRIGHT_RUN") ? [swapSlide, exchangeSlide] : portfolioCards,
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
  };
};
