import React from "react";
import { CheckmarkCircleFill } from "@ledgerhq/lumen-ui-rnative/symbols";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";

const CONTENT_FADE_MS = 150;

export const AnimatedCheckmark = () => {
  const scale = useSharedValue(0.5);
  const checkOpacity = useSharedValue(0);

  React.useEffect(() => {
    checkOpacity.value = withTiming(1, { duration: CONTENT_FADE_MS });
    scale.value = withSpring(1, { damping: 15, stiffness: 600 });
  }, [scale, checkOpacity]);

  const animatedCheckStyle = useAnimatedStyle(
    () => ({
      opacity: checkOpacity.value,
      transform: [{ scale: scale.value }],
    }),
    [scale, checkOpacity],
  );

  return (
    <Animated.View style={animatedCheckStyle} testID="portfolio-refresh-status-checkmark">
      <CheckmarkCircleFill size={16} color="success" />
    </Animated.View>
  );
};
