import { Image } from "react-native";
import customLockScreenBanner from "~/images/customLockScreenBanner.webp";
import React from "react";
import { useSystem } from "~/hooks";

const imageDimensions = {
  width: 2160,
  height: 1102,
};

const EuropaWelcomeView = () => {
  const { screen } = useSystem();

  return (
    <Image
      source={customLockScreenBanner}
      resizeMode="contain"
      style={{
        width: screen.width,
        height: (imageDimensions.height / imageDimensions.width) * screen.width,
      }}
    />
  );
};

export default EuropaWelcomeView;
