import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, View } from "react-native";
import { useStyleSheet } from "@ledgerhq/lumen-ui-rnative/styles";

export const PROGRESS_ANIMATION_MS = 500;

export const FINISHING_ANIMATION_MS = 1000;

const PROGRESS_BAR_WIDTH = 247;

type ProgressBarProps = Readonly<{
  progress: number;
  initialProgress?: number;
  animationMs?: number;
  onAnimationEnd?: () => void;
  testID?: string;
}>;

const toPercentage = (progress: number) => Math.round(Math.min(Math.max(progress, 0), 1) * 100);

/**
 * The Lumen progress bar is not available yet, so this one is drawn by hand. Replace it by the
 * Lumen component as soon as it ships, keeping the same props.
 */
export function ProgressBar({
  progress,
  initialProgress = progress,
  animationMs = PROGRESS_ANIMATION_MS,
  onAnimationEnd,
  testID,
}: ProgressBarProps) {
  const styles = useStyleSheet(
    theme => ({
      track: {
        width: PROGRESS_BAR_WIDTH,
        height: theme.spacings.s8,
        alignSelf: "center",
        borderRadius: theme.spacings.s4,
        backgroundColor: theme.colors.bg.muted,
        overflow: "hidden",
      },
      fill: {
        height: "100%",
        borderRadius: theme.spacings.s4,
        backgroundColor: theme.colors.bg.interactive,
      },
    }),
    [],
  );
  const percentage = toPercentage(progress);
  const [animatedPercentage] = useState(() => new Animated.Value(toPercentage(initialProgress)));

  const onAnimationEndRef = useRef(onAnimationEnd);
  useEffect(() => {
    onAnimationEndRef.current = onAnimationEnd;
  });

  useEffect(() => {
    const animation = Animated.timing(animatedPercentage, {
      toValue: percentage,
      duration: animationMs,
      easing: Easing.out(Easing.quad),
      // The width is a layout property, which the native driver cannot animate.
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished) onAnimationEndRef.current?.();
    });

    return () => animation.stop();
  }, [animatedPercentage, percentage, animationMs]);

  const width = animatedPercentage.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
    extrapolate: "clamp",
  });

  return (
    <View
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: percentage }}
      style={styles.track}
    >
      <Animated.View
        testID={testID ? `${testID}-fill` : undefined}
        style={[styles.fill, { width }]}
      />
    </View>
  );
}
