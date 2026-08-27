import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  Easing,
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

type StoryProgressBarProps = {
  durationMs?: number;
  isActivated?: boolean;
  isCompleted?: boolean;
  restartKey?: number;
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
  restartKey = 0,
}: Readonly<StoryProgressBarProps>) {
  const progress = useSharedValue(0);

  useEffect(() => {
    // A completed story keeps a full bar, every other state starts from an empty one.
    progress.value = isCompleted ? 100 : 0;

    // durationMs is 0 until the video reports its length. Animating over 0ms would
    // snap the bar to full, then restart it once the real duration arrives.
    if (isActivated && !isCompleted && durationMs > 0) {
      progress.value = withTiming(100, {
        duration: durationMs,
        easing: Easing.linear,
        // The bar mirrors the video playing behind it, so it has to run even when the
        // system asks for less motion: withTiming would otherwise jump straight to full.
        reduceMotion: ReduceMotion.Never,
      });
    }
  }, [durationMs, isActivated, isCompleted, progress, restartKey]);

  // The width comes from the shared value alone: mixing props into the worklet makes it
  // re-register on every story change, and the bar then keeps the previous story's width
  // until that lands.
  const animatedStyles = useAnimatedStyle(() => {
    return {
      width: `${progress.value}%`,
    };
  }, [progress]);

  return (
    <View style={styles.container} testID="welcome-progress-bar">
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
