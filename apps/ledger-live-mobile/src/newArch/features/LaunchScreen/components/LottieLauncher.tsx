import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animation from "~/components/Animation";
import { useLottieAsset } from "~/utils/lottieAsset";

const splashscreenAsset = require("./Splashscreen.lottie.json");

const LottieLauncher = ({ onFinish }: { onFinish: () => void }) => {
  const { width, height } = Dimensions.get("window");
  const size = Math.min(width, height);

  const splashscreen = useLottieAsset(splashscreenAsset);

  return (
    <View style={styles.container}>
      <Animation
        source={splashscreen}
        style={{ width: size, height: size }}
        loop={false}
        autoPlay
        speed={2}
        onAnimationFinish={onFinish}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#131214",
  },
});

export default LottieLauncher;
