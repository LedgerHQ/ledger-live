import React, { useLayoutEffect, useMemo, useRef, useState } from "react";
import { getEnv } from "@ledgerhq/live-env";
import Lottie from "react-lottie";
import collapseAnimation from "./collapse.json";
import expandAnimation from "./expand.json";

interface AnimatedLogoProps {
  readonly collapsed: boolean;
}

export function AnimatedLogo({ collapsed }: AnimatedLogoProps) {
  const prevCollapsed = useRef(collapsed);
  const [playing, setPlaying] = useState(false);
  const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");

  useLayoutEffect(() => {
    if (prevCollapsed.current !== collapsed) {
      prevCollapsed.current = collapsed;
      if (!isPlaywright) {
        setPlaying(true);
      }
    }
  }, [collapsed, isPlaywright]);

  // When idle, show the opposite animation's first frame (matches the resting state).
  // When playing, show the actual transition animation.
  const animationData = collapsed === playing ? collapseAnimation : expandAnimation;

  const eventListeners = useMemo(
    () => [{ eventName: "complete" as const, callback: () => setPlaying(false) }],
    [],
  );

  return (
    <Lottie
      isClickToPauseDisabled
      ariaRole="presentation"
      isPaused={isPlaywright || !playing}
      options={{
        loop: false,
        autoplay: false,
        animationData,
      }}
      height={35}
      width={100}
      eventListeners={eventListeners}
    />
  );
}
