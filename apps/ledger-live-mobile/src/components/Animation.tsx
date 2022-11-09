import React from "react";
import Lottie from "lottie-react-native";
import Config from "react-native-config";
import type { StyleProp, ViewStyle } from "react-native";
import { StyleSheet } from "react-native";

export type LottieProps = Lottie["props"];
export default function Animation({
  style,
  ...lottieProps
}: LottieProps & {
  style?: StyleProp<ViewStyle>;
}) {
  return lottieProps.source ? (
    <Lottie
      {...lottieProps}
      style={[styles.default, style]}
      loop={lottieProps.loop ?? true}
      autoPlay={Config.MOCK ? false : lottieProps.autoPlay ?? true}
    />
  ) : null;
}
const styles = StyleSheet.create({
  default: {
    width: 300,
  },
});
