import Video from "react-native-video";
import React, { useEffect, useRef } from "react";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import { useTheme } from "styled-components/native";
import videoSources from "../../../assets/videos";
import { Device } from "@ledgerhq/types-devices";

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
  onAnimationFinish: () => void;
};

const redirectDelay = 5000;

const StaxCompletionView: React.FC<Props> = ({ onAnimationFinish }) => {
  const videoMounted = !useIsAppInBackground();
  const { theme } = useTheme();
  const videoSource = theme === "light" ? sourceLight : sourceDark;
  const delayRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    delayRef.current = setTimeout(onAnimationFinish, redirectDelay);

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
      source={videoSource}
      style={absoluteStyle}
      muted
      repeat
      resizeMode="cover"
    />
  ) : null;
};

export default StaxCompletionView;
