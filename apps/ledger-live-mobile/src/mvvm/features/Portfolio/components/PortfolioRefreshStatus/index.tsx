import React, { useEffect } from "react";
import { View } from "react-native";
import { Spinner, Text } from "@ledgerhq/lumen-ui-rnative";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { useTranslation } from "~/context/Locale";
import { usePortfolioRefreshStatusViewModel } from "./usePortfolioRefreshStatusViewModel";

const FADE_DURATION_MS = 300;
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
  const { t } = useTranslation();
  const { isVisible, isRefreshing, lastRefreshLabel } = usePortfolioRefreshStatusViewModel();

  const opacity = useSharedValue(0);
  const height = useSharedValue(0);

  useEffect(() => {
    if (isVisible) {
      // Delay height slightly so content has time to mount before the space opens
      height.value = withDelay(32, withTiming(VISIBLE_HEIGHT, { duration: FADE_DURATION_MS }));
      opacity.value = withDelay(32, withTiming(1, { duration: FADE_DURATION_MS }));
    } else {
      opacity.value = withTiming(0, { duration: FADE_DURATION_MS });
      height.value = withTiming(0, { duration: FADE_DURATION_MS });
    }
  }, [isVisible, opacity, height]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: height.value,
    opacity: opacity.value,
    overflow: "hidden",
  }));

  const getContent = () => {
    if (isRefreshing) {
      const label = lastRefreshLabel
        ? t("portfolio.refreshStatus.refreshing", { timeAgo: lastRefreshLabel })
        : t("portfolio.refreshStatus.refreshingInitial");

      return (
        <>
          <Spinner size={16} testID="portfolio-refresh-status-spinner" />
          <StatusText testID="portfolio-refresh-status-refreshing">{label}</StatusText>
        </>
      );
    }

    if (isVisible) {
      return (
        <StatusText testID="portfolio-refresh-status-up-to-date">
          {t("portfolio.refreshStatus.upToDate")}
        </StatusText>
      );
    }

    return null;
  };

  return (
    <Animated.View style={animatedStyle} testID="portfolio-refresh-status">
      <View style={innerStyle}>{getContent()}</View>
    </Animated.View>
  );
};
