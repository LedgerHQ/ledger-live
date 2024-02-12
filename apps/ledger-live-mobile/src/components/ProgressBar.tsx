import React, { memo, useEffect } from "react";
import { View, StyleSheet, StyleProp, ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";

type Props = {
  style?: StyleProp<ViewStyle>;
  height?: number;
  progress: number;
  progressColor: string;
  backgroundColor?: string;
  animationDurationMs?: number;
};

// Animated bar displaying a bar filling itself with a color until it reaches the progress percentage.
function ProgressBar({
  style,
  height,
  backgroundColor,
  progressColor,
  progress,
  animationDurationMs = 1000,
}: Props) {
  const { colors } = useTheme();

  const animatedProgress = useSharedValue(0);

  // Updates the animated progress towards the given value
  useEffect(() => {
    // Avoids any mistakes on `progress`
    const boundedProgress = Math.max(0, Math.min(progress, 100));

    animatedProgress.value = withTiming(boundedProgress, {
      duration: animationDurationMs,
    });
  }, [animatedProgress, animationDurationMs, progress]);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: `${animatedProgress.value}%`,
    };
  });

  return (
    <View
      style={[
        styles.wrapper,
        {
          height,
          backgroundColor: backgroundColor ?? colors.lightFog,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.bar,
          {
            backgroundColor: progressColor,
          },
          progressStyle,
        ]}
      />
    </View>
  );
}

ProgressBar.defaultProps = {
  height: 6,
};
const styles = StyleSheet.create({
  wrapper: {
    flexGrow: 1,
    borderRadius: 6,
    overflow: "hidden",
  },
  bar: {
    height: "100%",
    borderRadius: 6,
  },
});
export default memo<Props>(ProgressBar);
