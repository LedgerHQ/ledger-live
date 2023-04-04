import React, { useMemo } from "react";
import map from "lodash/map";
import { Trans } from "react-i18next";
import { getEnv } from "@ledgerhq/live-common/env";
import Slide from "./Slide";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

import ReferralProgramBgImage from "./banners/ReferralProgram/images/bg.png";
import ReferralProgramCoinImage from "./banners/ReferralProgram/images/coin.png";
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
  // image: ,
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

export const useDefaultSlides = () => {
  const referralProgramConfig = useFeature("referralProgramDesktopBanner");
  const portfolioCards = useSelector(portfolioContentCardSelector) || [];

  const slides = useMemo(() => {
    if (referralProgramConfig?.enabled && referralProgramConfig?.params?.path) {
      return [{ ...referralProgramSlide, path: referralProgramConfig?.params?.path }, ...portfolioCards];
    } else {
      return portfolioCards;
    }
  }, [referralProgramConfig]);

  return useMemo(
    () =>
      map(getEnv("PLAYWRIGHT_RUN") ? [] : slides, (slide: Props) => ({
        id: slide.name,
        // eslint-disable-next-line react/display-name
        Component: () => <Slide {...slide} />,
      })),
    [slides],
  );
};
