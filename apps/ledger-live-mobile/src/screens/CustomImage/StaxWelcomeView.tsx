import React from "react";
import { useTheme } from "@react-navigation/native";
import Video from "react-native-video";
import videoSources from "../../../assets/videos";
import { useSystem } from "~/hooks";

const videoDimensions = {
  height: 550,
  width: 1080,
};

const StaxWelcomeView = () => {
  const theme = useTheme();
  const { screen } = useSystem();

  return (
    <Video
      disableFocus
      source={
        theme.dark
          ? videoSources.customLockScreenBannerDark
          : videoSources.customLockScreenBannerLight
      }
      style={{
        width: screen.width,
        height: (videoDimensions.height / videoDimensions.width) * screen.width,
      }}
      muted
      repeat
      resizeMode={"contain"}
    />
  );
};

export default StaxWelcomeView;
