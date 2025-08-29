import React, { useEffect, useRef } from "react";
import { ViewStyle } from "react-native";
import Video from "react-native-video";
import { useTheme } from "styled-components/native";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import videoSources from "../../../assets/videos";

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
  onAnimationFinish: () => void;
};

export default function ApexOnboardingSuccessView({
  onAnimationFinish,
}: ApexOnboardingSuccessViewProps) {
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
      source={theme === "light" ? onboardingSuccessApexLight : onboardingSuccessApexDark}
      style={absoluteStyle}
      muted
      repeat
      resizeMode="cover"
    />
  ) : null;
}
