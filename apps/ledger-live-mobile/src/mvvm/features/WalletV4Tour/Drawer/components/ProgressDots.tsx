import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { interpolate, interpolateColor, useAnimatedStyle } from "react-native-reanimated";
import { useSlidesContext } from "@ledgerhq/native-ui";

interface DotProps {
  readonly index: number;
}

const Dot = ({ index }: DotProps) => {
  const { scrollProgressSharedValue } = useSlidesContext();

  const inputRange = useMemo(() => [index - 1, index, index + 1], [index]);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(scrollProgressSharedValue.value, inputRange, [1, 1.25, 1], "clamp");
    const opacity = interpolate(
      scrollProgressSharedValue.value,
      inputRange,
      [0.5, 1, 0.5],
      "clamp",
    );
    const backgroundColor = interpolateColor(scrollProgressSharedValue.value, inputRange, [
      "#ccc",
      "#000",
      "#ccc",
    ]);

    return { transform: [{ scale }], opacity, backgroundColor };
  }, [scrollProgressSharedValue.value, inputRange]);

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export const ProgressDots = () => {
  const { totalSlides } = useSlidesContext();

  return (
    <View style={styles.container}>
      {Array.from({ length: totalSlides }, (_, index) => (
        <Dot key={index} index={index} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});
