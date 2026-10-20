import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { getEnv } from "@shared/env";
import { Lottie } from "@shared/lottie";
import { useAnimationData } from "./useAnimationData";

interface AnimatedLogoProps {
  readonly collapsed: boolean;
}

export function AnimatedLogo({ collapsed }: AnimatedLogoProps) {
  const prevCollapsed = useRef(collapsed);
  const [playing, setPlaying] = useState(false);
  const isPlaywright = !!getEnv("PLAYWRIGHT_RUN");
  const { collapse, expand, themeKey } = useAnimationData();
  const handleComplete = useCallback(() => setPlaying(false), []);

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
  const animationData = collapsed === playing ? collapse : expand;

  return (
    <Lottie
      key={themeKey}
      source={animationData}
      role="presentation"
      autoPlay={false}
      paused={isPlaywright || !playing}
      onComplete={handleComplete}
      style={{ flexShrink: 0, width: 100, height: 35 }}
    />
  );
}
