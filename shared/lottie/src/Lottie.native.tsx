import React, { useEffect, useRef } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import LottieView from "lottie-react-native";
import type { LottieBaseProps } from "./types";

/** Parsed animation data, a `{ uri }`, a URL or `.lottie` asset path string, or a bundler asset id. */
export type LottieSource = string | number | { uri: string } | Record<string, unknown>;

export type LottieProps = LottieBaseProps &
  Readonly<{
    source: LottieSource;
    style?: StyleProp<ViewStyle>;
  }>;

export function Lottie({
  source,
  loop = false,
  autoPlay = true,
  paused,
  speed = 1,
  style,
  testID,
  onComplete,
}: LottieProps): React.JSX.Element {
  const player = useRef<LottieView>(null);

  useEffect(() => {
    if (paused === undefined) return;
    if (paused) player.current?.pause();
    else player.current?.play();
  }, [paused, source]);

  // lottie-react-native accepts bundler asset ids at runtime but its types don't.
  const lottieSource = source as React.ComponentProps<typeof LottieView>["source"];

  return (
    <LottieView
      ref={player}
      testID={testID}
      source={lottieSource}
      style={style}
      loop={loop}
      autoPlay={autoPlay}
      speed={speed}
      onAnimationFinish={isCancelled => {
        if (!isCancelled) onComplete?.();
      }}
    />
  );
}
