import React from "react";
import { View, ViewStyle } from "react-native";
import LottieView from "lottie-react-native";
import Config from "react-native-config";

export type LottieSource = { uri: string } | null;

type LottieProps = {
  source: LottieSource;
  style?: ViewStyle;
  loop?: boolean;
  autoPlay?: boolean;
  speed?: number;
  testID?: string;
};

/**
 * Shared Lottie wrapper that handles Detox bypass (empty view in E2E)
 * and invalid source. Use this instead of lottie-react-native directly
 * so Detox logic is consistent across the app.
 */
export function Lottie({
  source,
  style,
  loop = false,
  autoPlay = true,
  speed = 1,
  testID = "lottie",
}: LottieProps) {
  if (Config.DETOX) {
    return <View testID={`${testID}-detox`} style={style} />;
  }
  if (!source?.uri) {
    return <View style={style} />;
  }
  return (
    <LottieView
      testID={testID}
      source={source}
      style={style}
      loop={loop}
      autoPlay={autoPlay}
      speed={speed}
    />
  );
}
