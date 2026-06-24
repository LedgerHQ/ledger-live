import React from "react";
import { Box, Pressable, Text } from "@ledgerhq/lumen-ui-rnative";
import { LumenViewStyle } from "@ledgerhq/lumen-ui-rnative/styles";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import { useLocalClockViewModel } from "./useLocalClockViewModel";

const expandedContainerStyle: LumenViewStyle = {
  alignItems: "center",
};

export const LocalClock = () => {
  const { time, date, isExpanded, toggleExpanded } = useLocalClockViewModel();
  const expandedOpacity = useSharedValue(0);
  const expandedHeight = useSharedValue(0);

  React.useEffect(() => {
    expandedOpacity.value = withTiming(isExpanded ? 1 : 0, { duration: 200 });
    expandedHeight.value = withTiming(isExpanded ? 1 : 0, { duration: 200 });
  }, [isExpanded, expandedOpacity, expandedHeight]);

  const animatedStyle = useAnimatedStyle(
    () => ({
      opacity: expandedOpacity.value,
      transform: [{ scaleY: expandedHeight.value }],
    }),
    [expandedOpacity, expandedHeight],
  );

  return (
    <Pressable onPress={toggleExpanded} accessibilityRole="button" hitSlop={8}>
      <Box lx={expandedContainerStyle}>
        {isExpanded ? (
          <Text typography="heading4SemiBold" lx={{ color: "base" }}>
            {time}
          </Text>
        ) : (
          <Text typography="body2SemiBold" lx={{ color: "base" }}>
            {time}
          </Text>
        )}
        <Animated.View style={animatedStyle}>
          <Box lx={{ paddingTop: "s4" }}>
            <Text typography="body3" lx={{ color: "muted" }}>
              {date}
            </Text>
          </Box>
        </Animated.View>
      </Box>
    </Pressable>
  );
};
