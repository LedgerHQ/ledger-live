// @flow
import React from "react";
import Lottie from "lottie-react-native";
import Config from "react-native-config";
import type { ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";
import { StyleSheet } from "react-native";

type LottieProps = $PropertyType<Lottie, "props">;

export default function Animation({
  style,
  ...lottieProps
}: {
  ...LottieProps,
  style: ViewStyleProp,
}) {
  return (
    <Lottie
      {...lottieProps}
      style={[styles.default, style]}
      loop={lottieProps.loop ?? true}
      autoPlay={Config.MOCK ? false : lottieProps.autoplay ?? true}
    />
  );
}

const styles = StyleSheet.create({
  default: {
    width: 300,
  },
});
