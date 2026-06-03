import React from "react";
import { StyleSheet } from "react-native";
import { useTheme } from "styled-components/native";
import { Lottie, resolveLottieSource } from "LLM/components/Lottie";
import notificationOptInDark from "../lottie/notification_optin_dark.lottie";
import notificationOptInLight from "../lottie/notification_optin_light.lottie";

const darkAnimationSource = resolveLottieSource(notificationOptInDark);
const lightAnimationSource = resolveLottieSource(notificationOptInLight);

export function NotificationsOptInIllustration() {
  const { theme } = useTheme();
  const animationSource = theme === "dark" ? darkAnimationSource : lightAnimationSource;

  return (
    <Lottie source={animationSource} style={StyleSheet.absoluteFillObject} autoPlay loop={false} />
  );
}
