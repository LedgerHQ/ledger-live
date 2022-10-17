import React from "react";
import Lottie from "lottie-react-native";
import Config from "react-native-config";
import type { ViewStyleProp } from "react-native/Libraries/StyleSheet/StyleSheet";
import { StyleSheet } from "react-native";

type LottieProps = Lottie["props"];
export default function Animation({
  style,
  ...lottieProps
}: LottieProps & {
  style?: ViewStyleProp;
}) {
  return lottieProps.source ? (
    <Lottie
      {...lottieProps}
      style={[styles.default, style]}
      loop={lottieProps.loop ?? true}
      autoPlay={Config.MOCK ? false : lottieProps.autoplay ?? true}
    />
  ) : null;
}
const styles = StyleSheet.create({
  default: {
    width: 300,
  },
});
