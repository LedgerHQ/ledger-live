import React from "react";
import Lottie from "lottie-react-native";
import { AnimationObject } from "lottie-react-native/lib/typescript/LottieView.types";
import Config from "react-native-config";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

// Type predicate function because AnimationObject is only defined as an interface
// and cannot be checked with `maybeAnimation instanceof AnimationObject` for ex.
function isAnimationObject(
  maybeAnimation: unknown,
): maybeAnimation is AnimationObject {
  return (
    (maybeAnimation as AnimationObject).w !== undefined &&
    (maybeAnimation as AnimationObject).h !== undefined
  );
}

export type LottieProps = Lottie["props"];

export default function Animation({
  style,
  ...lottieProps
}: LottieProps & {
  style?: StyleProp<ViewStyle>;
}) {
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
        autoPlay={Config.MOCK ? false : lottieProps.autoPlay ?? true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  default: {
    width: 300,
  },
});
