import React from "react";
import { DotLottie } from "@lottiefiles/dotlottie-react-native";
import Lottie from "lottie-react-native";
import { type AnimationObject } from "lottie-react-native";
import Config from "react-native-config";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

// Type predicate function because AnimationObject is only defined as an interface
// and cannot be checked with `maybeAnimation instanceof AnimationObject` for ex.
function isAnimationObject(maybeAnimation: unknown): maybeAnimation is AnimationObject {
  return (
    (maybeAnimation as AnimationObject).w !== undefined &&
    (maybeAnimation as AnimationObject).h !== undefined
  );
}

export type LottieProps = Lottie["props"];
type AnimationSource = AnimationObject | number | { uri: string };
type AnimationProps = Omit<LottieProps, "source" | "style"> & {
  source?: AnimationSource;
  style?: StyleProp<ViewStyle>;
};

export default function Animation({ style, ...lottieProps }: AnimationProps) {
  const { source, autoPlay, loop, speed, onAnimationFinish, ...rest } = lottieProps;

  if (!source) return null;

  // Compute ratio from JSON sources only.
  // .lottie assets don't expose w/h, so they must rely on explicit sizing via style.
  let aspectRatio = 1;
  const isJsonSource = isAnimationObject(source);
  const isDotLottieSource = typeof source === "number";
  if (isJsonSource) {
    const { w, h } = source;

    if (w && h && h > 0) {
      aspectRatio = w / h;
    }
  }

  // The style prop order matters:
  // Animation prop `style` could define both a width and height, or an aspectRatio, and should override the computed aspectRatio
  return (
    <View>
      {isDotLottieSource ? (
        <DotLottie
          source={source}
          style={style}
          loop={loop ?? true}
          autoplay={Config.DETOX ? false : autoPlay ?? true}
          speed={speed}
          onComplete={onAnimationFinish ? () => onAnimationFinish(false) : undefined}
        />
      ) : (
        <Lottie
          {...rest}
          source={source}
          style={isJsonSource ? [styles.default, { aspectRatio }, style] : [style]}
          loop={loop ?? true}
          autoPlay={Config.DETOX ? false : autoPlay ?? true}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  default: {
    width: 300,
  },
});
