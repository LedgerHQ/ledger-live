import Video from "react-native-video";
import React, { useEffect, useRef, useState } from "react";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import { useTheme } from "styled-components/native";
import videoSources from "../../../assets/videos";
import { Device } from "@ledgerhq/types-devices";
import { useIsFocused } from "@react-navigation/core";

const sourceLight = videoSources.onboardingSuccessStaxLight;
const sourceDark = videoSources.onboardingSuccessStaxDark;

const absoluteStyle = {
  position: "absolute" as const,
  bottom: 0,
  left: 0,
  top: 0,
  right: 0,
};

type Props = {
  device?: Device;
  onAnimationFinish?: () => void;
};

const redirectDelay = 5000;

const StaxCompletionView: React.FC<Props> = ({ onAnimationFinish }) => {
  const videoMounted = !useIsAppInBackground();
  const [isPaused, setIsPaused] = useState<boolean>(true);
  const { theme } = useTheme();
  const isFocused = useIsFocused();

  const videoSource = theme === "light" ? sourceLight : sourceDark;
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (onAnimationFinish) {
      delayRef.current = setTimeout(onAnimationFinish, redirectDelay);
    }

    return () => {
      if (delayRef.current) {
        clearTimeout(delayRef.current);
        delayRef.current = null;
      }
    };
  }, [onAnimationFinish]);

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
};

export default StaxCompletionView;
