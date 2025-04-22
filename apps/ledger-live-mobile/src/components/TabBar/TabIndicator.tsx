import React from "react";
import Animated, { useAnimatedStyle, withSpring, SharedValue } from "react-native-reanimated";
import { StyleSheet } from "react-native";
import { useTheme } from "styled-components/native";

interface TabIndicatorProps {
  translateX: SharedValue<number>;
}

export const TAB_INDICATOR_WIDTH = 24;

export function TabIndicator({ translateX }: TabIndicatorProps) {
  const { colors } = useTheme();

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX: withSpring(translateX.value, {
          duration: 300,
        }),
      },
    ],
  }));

  return (
    <Animated.View
      style={[styles.indicator, indicatorStyle, { backgroundColor: colors.primary.c80 }]}
    />
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: "absolute",
    top: 0,
    width: TAB_INDICATOR_WIDTH,
    height: 3,
  },
});
