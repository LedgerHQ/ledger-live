import React from "react";
import { View, ViewStyle, Image } from "react-native";
import LottieView from "lottie-react-native";
import Config from "react-native-config";

export type LottieSource = { uri: string } | number | null;

/** Resolves require() of a .lottie asset for <Lottie>; uses asset id when Repack returns a path instead of file://. */
export function resolveLottieSource(module: number): LottieSource {
  const resolved = Image.resolveAssetSource(module);
  const uri = resolved?.uri;
  if (
    uri &&
    (uri.startsWith("file://") || uri.startsWith("http://") || uri.startsWith("https://"))
  ) {
    return { uri };
  }
  return module;
}

type LottieProps = {
  source: LottieSource;
  style?: ViewStyle;
  loop?: boolean;
  autoPlay?: boolean;
  speed?: number;
  testID?: string;
};

function hasValidSource(source: LottieSource): source is { uri: string } | number {
  if (source == null) return false;
  if (typeof source === "number") return true;
  return Boolean(source.uri);
}

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
  if (!hasValidSource(source)) {
    return <View style={style} />;
  }
  // lottie-react-native accepts asset id (number) at runtime but its types don't; cast is safe.
  const lottieSource = source as React.ComponentProps<typeof LottieView>["source"];
  return (
    <LottieView
      testID={testID}
      source={lottieSource}
      style={style}
      loop={loop}
      autoPlay={autoPlay}
      speed={speed}
    />
  );
}
