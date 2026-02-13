import React, { useMemo } from "react";
import { View, StyleSheet, Dimensions, Image } from "react-native";
import LottieView from "lottie-react-native";
import Config from "react-native-config";

import splashscreenLottieModule from "./Splashscreen.lottie";

function resolveSplashSource(): { uri: string } | null {
  const resolved = Image.resolveAssetSource(splashscreenLottieModule);
  if (resolved?.uri) return { uri: resolved.uri };
  return null;
}

const LottieLauncher = () => {
  const { width, height } = Dimensions.get("window");
  const size = Math.min(width, height);
  const resolvedSource = Config.DETOX ? null : resolveSplashSource();
  const lottieStyle = useMemo(
    () => ({ width: size, height: size, backgroundColor: "transparent" as const }),
    [size],
  );

  if (Config.DETOX) {
    return <View style={styles.container} testID="lottie-launcher-detox" />;
  }

  if (!resolvedSource) {
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      <LottieView source={resolvedSource} style={lottieStyle} loop={false} autoPlay speed={2} />
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
