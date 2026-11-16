import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle } from "react-native-reanimated";
import { getQrElementFrame, toRgbString, type QrElement } from "./animationTimeline";
import { useCenterTime } from "./useCenterTime";
import type { QrAnimation } from "./types";

const CENTER: QrElement = { x: 0.5, y: 0.5, kind: "center" };
// useCenterTime counts the pop from the last press: in its time, every press happens at 0.
const PRESSED_AT = 0;

type AnimatedCenterProps = Readonly<{
  animation: QrAnimation;
  animated: boolean;
  pressCount: number;
  size: number;
  diameter: number;
  children?: React.ReactNode;
}>;

/**
 * The center badge: a React node (a CryptoIcon) cannot be drawn by the native view, so it is
 * animated here, on the same timeline. While loading, a skeleton disc takes its place.
 */
export function AnimatedCenter({
  animation,
  animated,
  pressCount,
  size,
  diameter,
  children,
}: AnimatedCenterProps): React.JSX.Element {
  const loading = animation === "loading";
  const time = useCenterTime(animation, animated, pressCount);

  const placeholderStyle = useAnimatedStyle(() => {
    if (!loading) return { opacity: 0 };
    const frame = getQrElementFrame(animation, time.get(), CENTER, PRESSED_AT);
    return { backgroundColor: toRgbString(frame.color), opacity: 1 };
  });

  const contentStyle = useAnimatedStyle(() => {
    if (loading) return { opacity: 0, transform: [{ scale: 1 }] };
    const frame = getQrElementFrame(animation, time.get(), CENTER, PRESSED_AT);
    return { opacity: 1, transform: [{ scale: frame.scale }] };
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
