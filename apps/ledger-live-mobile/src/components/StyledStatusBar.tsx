import React, { memo } from "react";
import { StatusBar, Platform } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useIsSplashScreenHidden } from "LLM/features/LaunchScreen/splashScreenVisibility";

type Props = {
  hidden?: boolean;
  animated?: boolean;
  backgroundColor?: string;
  translucent?: boolean;
  barStyle?: "default" | "light-content" | "dark-content";
  networkActivityIndicatorVisible?: boolean;
  showHideTransition?: "fade" | "slide";
};
// SPIKE rn88: React Native 0.88 StatusBar has no backgroundColor / translucent (edge-to-edge only)
function StyledStatusBar({ animated = true, barStyle = "dark-content" }: Props) {
  const { dark } = useTheme();
  // Android: the app theme hides the status bar; it stays hidden until the splash screen goes, so
  // it appears once with the app instead of reappearing during the startup.
  const splashScreenHidden = useIsSplashScreenHidden();
  const statusBarStyle = dark ? "light-content" : barStyle;
  return (
    <StatusBar
      hidden={Platform.OS === "android" && !splashScreenHidden}
      animated={animated}
      barStyle={statusBarStyle}
    />
  );
}

export default memo<Props>(StyledStatusBar);
