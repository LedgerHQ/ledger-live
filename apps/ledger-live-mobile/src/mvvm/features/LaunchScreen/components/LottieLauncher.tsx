import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions, Image } from "react-native";

import { Lottie } from "LLM/components/Lottie";

import splashscreenLottieModule from "./Splashscreen.lottie";

function resolveSplashSource(): { uri: string } | null {
  const resolved = Image.resolveAssetSource(splashscreenLottieModule);
  return resolved?.uri ? { uri: resolved.uri } : null;
}

const LottieLauncher = () => {
  const { width, height } = Dimensions.get("window");
  const size = Math.min(width, height);
  const resolvedSource = resolveSplashSource();
  const lottieStyle = useMemo(
    () => ({ width: size, height: size, backgroundColor: "transparent" as const }),
    [size],
  );

  return (
    <View style={styles.container}>
      <Lottie
        testID="lottie-launcher"
        source={resolvedSource}
        style={lottieStyle}
        loop={false}
        autoPlay
        speed={2}
      />
    </View>
  );
};

export default LottieLauncher;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#131214",
  },
});
