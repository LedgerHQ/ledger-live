import React from "react";
import { Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { usePortfolioRefreshStatusViewModel } from "./usePortfolioRefreshStatusViewModel";
import { AnimatedCheckmark } from "./AnimatedCheckmark";

const FADE_DURATION_MS = 300;
const CONTENT_FADE_MS = 150;
const VISIBLE_HEIGHT = 60;

const innerStyle = {
  paddingTop: 32,
  paddingBottom: 8,
  alignItems: "center" as const,
  flexDirection: "row" as const,
  justifyContent: "center" as const,
  gap: 8,
};

const StatusText = ({ testID, children }: { testID: string; children: string }) => (
  <Text testID={testID} typography="body2" lx={{ color: "base" }}>
    {children}
  </Text>
);

export const PortfolioRefreshStatus = () => {
  const { isVisible, isRefreshing, refreshingLabel, upToDateLabel } =
    usePortfolioRefreshStatusViewModel();

  const opacity = useSharedValue(0);
  const height = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  useAnimatedReaction(
    () => isVisible,
    visible => {
      if (visible) {
        height.value = withDelay(32, withTiming(VISIBLE_HEIGHT, { duration: FADE_DURATION_MS }));
        opacity.value = withDelay(32, withTiming(1, { duration: FADE_DURATION_MS }));
      } else {
        opacity.value = withTiming(0, { duration: FADE_DURATION_MS });
        height.value = withTiming(0, { duration: FADE_DURATION_MS });
      }
    },
  );

  useAnimatedReaction(
    () => isRefreshing,
    (_current, previous) => {
      if (previous === null) return;
      contentOpacity.value = 0;
      contentOpacity.value = withDelay(50, withTiming(1, { duration: CONTENT_FADE_MS }));
    },
  );

  const animatedStyle = useAnimatedStyle(
    () => ({
      height: height.value,
      opacity: opacity.value,
      overflow: "hidden",
    }),
    [height, opacity],
  );

  const contentAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: contentOpacity.value,
    }),
    [contentOpacity],
  );

  const getContent = () => {
    if (isRefreshing) {
      return (
        <>
          <Spinner size={16} testID="portfolio-refresh-status-spinner" />
          <StatusText testID="portfolio-refresh-status-refreshing">{refreshingLabel}</StatusText>
        </>
      );
    }

    if (isVisible) {
      return (
        <>
          <AnimatedCheckmark />
          <StatusText testID="portfolio-refresh-status-up-to-date">{upToDateLabel}</StatusText>
        </>
      );
    }

    return null;
  };

  return (
    <Animated.View style={animatedStyle} testID="portfolio-refresh-status">
      <Animated.View style={[innerStyle, contentAnimatedStyle]}>{getContent()}</Animated.View>
    </Animated.View>
  );
};
