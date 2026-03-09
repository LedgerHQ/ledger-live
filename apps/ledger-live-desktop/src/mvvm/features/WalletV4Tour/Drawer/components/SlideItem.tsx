import React from "react";
import { useSelector } from "LLD/hooks/redux";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { getEnv } from "@ledgerhq/live-env";
import { themeSelector } from "~/renderer/actions/general";

import animation1Dark from "../animations/1_Dark.lottie";
import animation1Light from "../animations/1_Light.lottie";
import animation2Dark from "../animations/2_Dark.lottie";
import animation2Light from "../animations/2_Light.lottie";
import animation3Dark from "../animations/3_Dark.lottie";
import animation3Light from "../animations/3_Light.lottie";

const SLIDE_LOTTIES = {
  dark: [animation1Dark, animation2Dark, animation3Dark],
  light: [animation1Light, animation2Light, animation3Light],
} as const;

interface SlideItemProps {
  readonly slideIndex: number;
  readonly title: string;
  readonly description: string;
}

export function SlideItem({ slideIndex, title, description }: SlideItemProps) {
  const theme = useSelector(themeSelector);
  const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");
  const lottieSrc = SLIDE_LOTTIES[theme][slideIndex] ?? SLIDE_LOTTIES[theme][0];

  return (
    <div className="flex size-full flex-col">
      <div
        className="flex w-full shrink-0 items-center justify-center overflow-hidden rounded-2xl"
        style={{ height: 280, marginTop: -24 }}
      >
        <DotLottieReact
          src={lottieSrc}
          loop={false}
          autoplay={!isPlaywright}
          layout={{ fit: "cover" }}
          style={{ width: "100%", height: "100%" }}
        />
      </div>

      <div
        className="flex flex-1 flex-col items-center px-20"
        style={{ gap: 30, paddingBottom: 8 }}
      >
        <div
          className="flex animate-fade-in flex-col items-center text-center"
          style={{ pointerEvents: "none" }}
        >
          <div>
            <h3 className="m-0 mb-8 heading-4-semi-bold text-base">{title}</h3>
            <p className="m-0 body-2 text-muted">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
