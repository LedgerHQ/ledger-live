import Video from "react-native-video";
import React, { useEffect, useRef, useState } from "react";
import { ViewStyle } from "react-native";
import { useTheme } from "styled-components/native";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import videoSources from "../../../assets/videos";
import { useIsFocused } from "@react-navigation/core";

const { onboardingSuccessApexDark, onboardingSuccessApexLight } = videoSources;
const REDIRECTION_DELAY = 5_000;
const absoluteStyle: ViewStyle = {
  position: "absolute",
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
};

type ApexOnboardingSuccessViewProps = {
  onAnimationFinish?: () => void;
};

export default function ApexOnboardingSuccessView({
  onAnimationFinish,
}: ApexOnboardingSuccessViewProps) {
  const videoMounted = !useIsAppInBackground();
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const { theme } = useTheme();
  const isFocused = useIsFocused();

  const videoSource = theme === "light" ? onboardingSuccessApexLight : onboardingSuccessApexDark;
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (onAnimationFinish && videoMounted && !isPaused) {
      delayRef.current = setTimeout(onAnimationFinish, REDIRECTION_DELAY);
    }

    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
    };
  }, [onAnimationFinish, videoMounted, isPaused]);

  useEffect(() => {
    if (isPaused && isFocused) {
      setIsPaused(false);
    }
  }, [isFocused, setIsPaused, isPaused]);

  return videoMounted ? (
    <Video
      disableFocus
      source={videoSource}
      style={absoluteStyle}
      muted
      repeat
      resizeMode="cover"
      paused={isPaused}
    />
  ) : null;
}
