import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type StoryProgressBarProps = {
  durationMs?: number;
  isActivated?: boolean;
  isCompleted?: boolean;
};

/**
 * StoryProgressBar component to display the progress of a story.
 * @param param0 {StoryProgressBarProps} - Props for the StoryProgressBar component.
 * @returns React.JSX.Element
 */
export function StoryProgressBar({
  durationMs = 5000,
  isActivated = false,
  isCompleted = false,
}: Readonly<StoryProgressBarProps>) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = 0;
    if (isActivated) {
      progress.value = withTiming(100, { duration: durationMs, easing: Easing.linear });
    }
  }, [durationMs, isActivated, isCompleted, progress]);

  const animatedStyles = useAnimatedStyle(() => ({
    width: isCompleted ? "100%" : `${progress.value}%`,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.progress, animatedStyles]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 4,
    borderRadius: 5,
    overflow: "hidden",
    backgroundColor: "#1C1C1C",
  },
  progress: {
    height: 4,
    backgroundColor: "#FFFFFF",
  },
});
