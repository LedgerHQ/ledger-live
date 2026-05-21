import React from "react";
import type { ViewStyle } from "react-native";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "styled-components/native";
import { Lottie, resolveLottieSource } from "LLM/components/Lottie";
import notificationOptInDark from "../lottie/notification_optin_dark.lottie";
import notificationOptInLight from "../lottie/notification_optin_light.lottie";

const darkAnimationSource = resolveLottieSource(notificationOptInDark);
const lightAnimationSource = resolveLottieSource(notificationOptInLight);

const lottieStyle: ViewStyle = {
  width: "100%",
  height: "100%",
  transform: [{ translateY: 64 }, { scale: 1.28 }],
};

export function NotificationsOptInIllustration() {
  const { theme } = useTheme();
  const animationSource = theme === "dark" ? darkAnimationSource : lightAnimationSource;

  return (
    <Box
      lx={{
        flex: 1,
        width: "full",
        paddingHorizontal: "s16",
        alignItems: "center",
        justifyContent: "center",
      }}
      pointerEvents="none"
      testID="notifications-opt-in-illustration"
    >
      <Lottie
        source={animationSource}
        style={lottieStyle}
        autoPlay
        loop={false}
        testID="notifications-opt-in-lottie"
      />
    </Box>
  );
}
