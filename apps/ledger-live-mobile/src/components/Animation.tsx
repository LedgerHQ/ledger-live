import React from "react";
import { Lottie, type LottieProps } from "@shared/lottie";
import Config from "react-native-config";
import { StyleSheet, View } from "react-native";

type AnimationObject = Readonly<{ w: number; h: number }>;

function isAnimationObject(maybeAnimation: unknown): maybeAnimation is AnimationObject {
  return (
    typeof maybeAnimation === "object" &&
    maybeAnimation !== null &&
    "w" in maybeAnimation &&
    "h" in maybeAnimation
  );
}

export type { LottieProps };

export default function Animation({ style, ...lottieProps }: LottieProps) {
  const { source } = lottieProps;

  if (!source) return null;

  // Computes the ration w / h because lottie-react-native v6 seems not to compute and apply a ratio anymore.
  // It will be overridden if the provided style sets one (see below)
  let aspectRatio = 1;
  if (isAnimationObject(source)) {
    const { w, h } = source;

    if (w && h && h > 0) {
      aspectRatio = w / h;
    }
  }

  // The style prop order matters:
  // Animation prop `style` could define both a width and height, or an aspectRatio, and should override the computed aspectRatio
  return (
    <View>
      <Lottie
        {...lottieProps}
        style={[styles.default, { aspectRatio }, style]}
        loop={lottieProps.loop ?? true}
        autoPlay={Config.DETOX ? false : (lottieProps.autoPlay ?? true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  default: {
    width: 300,
  },
});
