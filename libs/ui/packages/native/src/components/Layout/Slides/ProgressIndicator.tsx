import React, { useMemo } from "react";
import { StyleSheet } from "react-native";
import Animated, { interpolate, useAnimatedStyle } from "react-native-reanimated";
import { useSlidesContext } from "./context";

export function ProgressIndicator(props: React.ComponentProps<typeof Animated.View>) {
  const { scrollProgressSharedValue, footerHeights, totalSlides } = useSlidesContext();

  const { inputRange, outputRange, hasValidHeights } = useMemo(() => {
    const input = Array.from(Array(totalSlides), (_, i) => i);
    const output = input.map((i) => footerHeights.get(i) || 0);

    const hasValid = output.some((height) => height > 0);

    return {
      inputRange: input,
      outputRange: output,
      hasValidHeights: hasValid,
    };
  }, [footerHeights, totalSlides]);

  const animatedStyle = useAnimatedStyle(() => {
    if (!hasValidHeights || inputRange.length === 0) {
      return { bottom: 0, opacity: 0 };
    }

    const bottom = interpolate(scrollProgressSharedValue.value, inputRange, outputRange, "clamp");

    return {
      bottom,
      opacity: bottom > 0 ? 1 : 0,
    };
  });

  if (!hasValidHeights) return null;

  return (
    <Animated.View {...props} style={[styles.progressIndicator, animatedStyle, props.style]} />
  );
}

const styles = StyleSheet.create({
  progressIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
});
