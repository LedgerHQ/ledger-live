import React from "react";
import Lottie from "lottie-react-native";
import type { AnimationObject } from "lottie-react-native";
import Config from "react-native-config";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet, View } from "react-native";

export type DeviceActionAnimationProps = Omit<Lottie["props"], "source"> & {
  source?: Lottie["props"]["source"];
  style?: StyleProp<ViewStyle>;
};

function isAnimationObject(maybeAnimation: unknown): maybeAnimation is AnimationObject {
  return (
    (maybeAnimation as AnimationObject).w !== undefined &&
    (maybeAnimation as AnimationObject).h !== undefined
  );
}

export function DeviceActionAnimation({ style, ...lottieProps }: DeviceActionAnimationProps) {
  const { source } = lottieProps;

  if (!source) return null;

  let aspectRatio = 1;
  if (isAnimationObject(source)) {
    const { w, h } = source;

    if (w && h && h > 0) {
      aspectRatio = w / h;
    }
  }

  return (
    <View>
      <Lottie
        {...lottieProps}
        style={[styles.default, { aspectRatio }, style]}
        loop={lottieProps.loop ?? true}
        autoPlay={Config.DETOX ? false : lottieProps.autoPlay ?? true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  default: {
    width: 200,
  },
});
