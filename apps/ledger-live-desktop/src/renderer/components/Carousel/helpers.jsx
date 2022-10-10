// @flow
import React, { useMemo } from "react";
import map from "lodash/map";
import { Trans } from "react-i18next";
import { getEnv } from "@ledgerhq/live-common/env";
import Slide from "./Slide";
import { urls } from "~/config/urls";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import LedgerAcademyBgImage from "./banners/LedgerAcademy/images/bg.png";
import LedgerAcademyCardImage from "./banners/LedgerAcademy/images/card.png";
import LedgerAcademyCoinImage from "./banners/LedgerAcademy/images/coin.png";
import LedgerAcademyHatImage from "./banners/LedgerAcademy/images/hat.png";
import LedgerAcademyNanoImage from "./banners/LedgerAcademy/images/nano.png";
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
import BackupPackBgImage from "./banners/BackupPack/images/bg.png";
import BackupPackNanosImage from "./banners/BackupPack/images/nanos.png";

import ReferralProgramBgImage from "./banners/ReferralProgram/images/bg.png";
import ReferralProgramCoinImage from "./banners/ReferralProgram/images/coin.png";

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
  name: "referralProgram",
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

const SLIDES = [
  {
    url: urls.banners.ledgerAcademy,
    name: "ledgerAcademy",
    title: <Trans i18nKey={`banners.ledgerAcademy.title`} />,
    description: <Trans i18nKey={`banners.ledgerAcademy.description`} />,
    imgs: [
      {
        source: LedgerAcademyBgImage,
        transform: [0, 60, 5, 60],
        size: {
          width: 160,
          height: 160,
        },
      },
      {
        source: LedgerAcademyCardImage,
        transform: [65, 50, 20, 50],
        size: {
          width: 109,
          height: 109,
        },
      },
      {
        source: LedgerAcademyCoinImage,
        transform: [-15, 20, 25, 20],
        size: {
          width: 28,
          height: 67,
        },
      },
      {
        source: LedgerAcademyHatImage,
        transform: [10, 30, 0, 30],
        size: {
          width: 110,
          height: 112,
        },
      },
      {
        source: LedgerAcademyNanoImage,
        transform: [75, 25, 8, 25],
        size: {
          width: 50,
          height: 27,
        },
      },
    ],
  },
  {
    path: "/exchange",
    name: "buyCrypto",
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
  },
  {
    path: "/swap",
    name: "swap",
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
  },
  {
    url: urls.banners.familyPack,
    name: "familyPack",
    title: <Trans i18nKey={`banners.familyPack.title`} />,
    description: <Trans i18nKey={`banners.familyPack.description`} />,
    imgs: [
      {
        source: BackupPackBgImage,
        transform: [20, 60, 5, 60],
        size: {
          width: 150,
          height: 150,
        },
      },
      {
        source: BackupPackNanosImage,
        transform: [-55, 13, 5, 15],
        size: {
          width: 162,
          height: 167,
        },
      },
      {
        source: BackupPackNanosImage,
        transform: [0, 15, 5, 15],
        size: {
          width: 162,
          height: 167,
        },
      },
      {
        source: BackupPackNanosImage,
        transform: [55, 17, 5, 15],
        size: {
          width: 162,
          height: 167,
        },
      },
    ],
  },
];

export const useDefaultSlides = () => {
  const referralProgramConfig = useFeature("referralProgramDesktopBanner");

  const slides = useMemo(() => {
    if (referralProgramConfig?.enabled && referralProgramConfig?.params?.path) {
      return [{ ...referralProgramSlide, path: referralProgramConfig?.params?.path }, ...SLIDES];
    } else {
      return SLIDES;
    }
  }, [referralProgramConfig]);

  return useMemo(
    () =>
      // $FlowFixMe
      map(getEnv("PLAYWRIGHT_RUN") ? [SLIDES[2], SLIDES[1]] : slides, (slide: Props) => ({
        id: slide.name,
        // eslint-disable-next-line react/display-name
        Component: () => <Slide {...slide} />,
        start: slide.start,
        end: slide.end,
      })),
    [slides],
  );
};
