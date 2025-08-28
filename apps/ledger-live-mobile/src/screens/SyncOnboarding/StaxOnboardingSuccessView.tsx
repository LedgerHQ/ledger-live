import React, { useEffect, useRef } from "react";
import { ViewStyle } from "react-native";
import Video from "react-native-video";
import { useTheme } from "styled-components/native";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import videoSources from "../../../assets/videos";

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
  onAnimationFinish: () => void;
};

export default function StaxOnboardingSuccessView({
  onAnimationFinish,
}: StaxOnboardingSuccessViewProps) {
  const videoMounted = !useIsAppInBackground();
  const { theme } = useTheme();

  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    delayRef.current = setTimeout(onAnimationFinish, REDIRECTION_DELAY);
    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
    };
  }, [onAnimationFinish]);

  return videoMounted ? (
    <Video
      disableFocus
      source={theme === "light" ? onboardingSuccessStaxLight : onboardingSuccessStaxDark}
      style={absoluteStyle}
      muted
      repeat
      resizeMode="cover"
    />
  ) : null;
}
