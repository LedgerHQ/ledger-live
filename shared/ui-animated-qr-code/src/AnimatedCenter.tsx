import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import {
  getQrElementFrame,
  getShimmerReveal,
  toRgbString,
  type QrElement,
} from "./animationTimeline";
import type { QrClock } from "./useQrClock";
import type { QrAnimation } from "./types";

const CENTER: QrElement = { x: 0.5, y: 0.5, kind: "center" };

type AnimatedCenterProps = QrClock &
  Readonly<{
    animation: QrAnimation;
    size: number;
    diameter: number;
    children?: React.ReactNode;
  }>;

/**
 * The center badge, over either implementation: a React node (a CryptoIcon) cannot be drawn by
 * the native view, so both animate it here. It is one element: it does not skew the benchmark.
 */
export function AnimatedCenter({
  time,
  touch,
  animation,
  size,
  diameter,
  children,
}: AnimatedCenterProps): React.JSX.Element {
  const placeholderStyle = useAnimatedStyle(() => {
    if (animation !== "shimmer") return { opacity: 0 };
    const frame = getQrElementFrame(animation, time.get(), CENTER, touch.get());
    return {
      backgroundColor: toRgbString(frame.color),
      opacity: 1 - getShimmerReveal(time.get()),
    };
  });

  const contentStyle = useAnimatedStyle(() => {
    const frame = getQrElementFrame(animation, time.get(), CENTER, touch.get());
    return {
      opacity: animation === "shimmer" ? getShimmerReveal(time.get()) : 1,
      transform: [{ scale: frame.scale }],
    };
  });

  const offset = (size - diameter) / 2;
  const box = { left: offset, top: offset, width: diameter, height: diameter };

  return (
    <View pointerEvents="none" style={[styles.absolute, box]}>
      <Animated.View style={[styles.fill, { borderRadius: diameter / 2 }, placeholderStyle]} />
      <Animated.View style={[styles.fill, styles.centered, contentStyle]}>{children}</Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  absolute: { position: "absolute" },
  fill: { ...StyleSheet.absoluteFillObject },
  centered: { alignItems: "center", justifyContent: "center" },
});
