import React, { useMemo } from "react";
import map from "lodash/map";
import { Trans } from "react-i18next";
import { getEnv } from "@ledgerhq/live-common/env";
import Slide from "./Slide";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import ReferralProgramBgImage from "./banners/ReferralProgram/images/bg.png";
import ReferralProgramCoinImage from "./banners/ReferralProgram/images/coin.png";
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

export const getTransitions = (transition: "slide" | "flip", reverse: boolean = false) => {
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

const referralProgramSlide = {
  id: "referralProgram",
  title: <Trans i18nKey={`banners.referralProgram.title`} />,
  description: <Trans i18nKey={`banners.referralProgram.description`} />,
  imgs: [
    {
      source: ReferralProgramBgImage,
      transform: [0, -30, -40, 30],
      size: {
        width: 154,
        height: 200,
      },
    },
    {
      source: ReferralProgramCoinImage,
      transform: [0, -50, -50, 50],
      size: {
        width: 134,
        height: 200,
      },
    },
  ],
};

const exchangeSlide = {
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
const swapSlide = {
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

export const useDefaultSlides = () => {
  const referralProgramConfig = useFeature("referralProgramDesktopBanner");
  const portfolioCards = useSelector(portfolioContentCardSelector);

  const slides = useMemo(() => {
    if (referralProgramConfig?.enabled && referralProgramConfig?.params?.path) {
      return [{ ...referralProgramSlide, path: referralProgramConfig?.params?.path }, ...portfolioCards];
    } else {
      return portfolioCards;
    }
  }, [referralProgramConfig, portfolioCards]);

  return useMemo(
    () =>
      map(getEnv("PLAYWRIGHT_RUN") ? [swapSlide, exchangeSlide] : slides, (slide: Props) => ({
        id: slide.name,
        // eslint-disable-next-line react/display-name
        Component: () => <Slide {...slide} />,
      })),
    [slides],
  );
};
