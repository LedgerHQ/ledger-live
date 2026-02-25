import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";

import { Lottie, resolveLottieSource } from "LLM/components/Lottie";

import splashscreenLottieModule from "./Splashscreen.lottie";

const LottieLauncher = () => {
  const { width, height } = Dimensions.get("window");
  const size = Math.min(width, height);
  const source = resolveLottieSource(splashscreenLottieModule);
  const lottieStyle = useMemo(
    () => ({ width: size, height: size, backgroundColor: "transparent" as const }),
    [size],
  );

  return (
    <View style={styles.container}>
      <Lottie
        testID="lottie-launcher"
        source={source}
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
