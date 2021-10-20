import React from "react";
import { useFonts } from "expo-font";

export default ({ children }: { children: React.ReactNode }) => {
  const [fontsLoaded] = useFonts({
    Inter_medium: require("../../assets/fonts/inter/Inter-Medium.otf"),
    Inter_semibold: require("../../assets/fonts/inter/Inter-SemiBold.otf"),
    Inter_bold: require("../../assets/fonts/inter/Inter-Bold.otf"),
    Alpha_medium: require("../../assets/fonts/alpha/HMAlphaMono-Medium.otf"),
  });

  if (!fontsLoaded) {
    return null;
  }

  return children;
};
