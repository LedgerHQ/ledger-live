import React, { useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { interpolate, interpolateColor, useAnimatedStyle } from "react-native-reanimated";
import { useTheme } from "styled-components/native";
import { useSlidesContext } from "@ledgerhq/native-ui";

const Dot = ({ index }: { index: number }) => {
  const { scrollProgressSharedValue } = useSlidesContext();
  const { colors } = useTheme();

  const activeColor = colors.primary.c80;
  const inactiveColor = colors.neutral.c40;

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
      inactiveColor,
      activeColor,
      inactiveColor,
    ]);

    return { transform: [{ scale }], opacity, backgroundColor };
  }, [inactiveColor, activeColor, scrollProgressSharedValue.value, inputRange]);

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
