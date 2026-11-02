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
const oldAndroid = Platform.OS === "android" && Platform.Version < 23;

function StyledStatusBar({
  animated = true,
  translucent = true,
  backgroundColor = "transparent",
  barStyle = "dark-content",
}: Props) {
  const { colors, dark } = useTheme();
  // Android: the app theme hides the status bar; it stays hidden until the splash screen goes, so
  // it appears once with the app instead of reappearing during the startup.
  const splashScreenHidden = useIsSplashScreenHidden();
  const newColor = oldAndroid && barStyle === "dark-content" ? colors.live : backgroundColor;
  const statusBarStyle = dark ? "light-content" : barStyle;
  return (
    <StatusBar
      hidden={Platform.OS === "android" && !splashScreenHidden}
      backgroundColor={newColor}
      animated={animated}
      translucent={translucent}
      barStyle={statusBarStyle}
    />
  );
}

export default memo<Props>(StyledStatusBar);
