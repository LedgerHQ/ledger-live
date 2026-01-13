import React from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animation from "~/components/Animation";
import Splashscreen from "./Splashscreen.json";

const LottieLauncher = ({ onFinish }: { onFinish: () => void }) => {
  const { width, height } = Dimensions.get("window");
  const size = Math.min(width, height);

  return (
    <View style={styles.container}>
      <Animation
        source={Splashscreen}
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
