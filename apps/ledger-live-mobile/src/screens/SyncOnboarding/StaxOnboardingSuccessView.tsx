import React, { useEffect, useRef, useState } from "react";
import { ViewStyle } from "react-native";
import Video from "react-native-video";
import { useTheme } from "styled-components/native";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import videoSources from "../../../assets/videos";
import { useIsFocused } from "@react-navigation/core";

const { onboardingSuccessStaxLight, onboardingSuccessStaxDark } = videoSources;
const REDIRECTION_DELAY = 5_000;
const absoluteStyle: ViewStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  top: 0,
  right: 0,
};

type StaxOnboardingSuccessViewProps = {
  onAnimationFinish?: () => void;
};

export default function StaxOnboardingSuccessView({
  onAnimationFinish,
}: StaxOnboardingSuccessViewProps) {
  const videoMounted = !useIsAppInBackground();
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const { theme } = useTheme();
  const isFocused = useIsFocused();

  const videoSource = theme === "light" ? onboardingSuccessStaxLight : onboardingSuccessStaxDark;
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
