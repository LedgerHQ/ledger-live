import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  interpolate,
  SharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const SPRING_CONFIG = {
  damping: 30,
  stiffness: 400,
};

type SwipeableCardProps = {
  children: React.ReactNode;
  index: number;
  swipeX: SharedValue<number>;
  swipeY: SharedValue<number>;
};

function useSwipeStyle(swipeX: SharedValue<number>, swipeY: SharedValue<number>, index: number) {
  return useAnimatedStyle(() => {
    const isActive = index === 0;
    const isNext = index === 1;
    const isAfterNext = index > 1;

    let translateX = 0;
    let translateY = 0;
    let scale = 1;
    let rotate = "0deg";

    if (isActive) {
      translateX = swipeX.value;
      translateY = swipeY.value;
      rotate = `${interpolate(swipeX.value, [-width / 2, 0, width / 2], [-16, 0, 15])}deg`;
    } else if (isNext) {
      scale = interpolate(Math.abs(swipeX.value), [0, width], [0.95, 1]);
      translateY = interpolate(Math.abs(swipeX.value), [0, width], [-28, 0]);
    } else if (isAfterNext) {
      scale = interpolate(index, [2, 5], [0.9, 0.8]);
      translateY = interpolate(index, [2, 5], [-56, -96]);
    }

    return {
      transform: [
        { translateX: withSpring(translateX, SPRING_CONFIG) },
        { translateY: withSpring(translateY, SPRING_CONFIG) },
        { scale: withSpring(scale, SPRING_CONFIG) },
        { rotate: withSpring(rotate, SPRING_CONFIG) },
      ],

      zIndex: isActive ? 100 : 100 - index,
    };
  }, [index, swipeX, swipeY]);
}

export default function SwipeableCard({ children, index, swipeX, swipeY }: SwipeableCardProps) {
  const animatedStyle = useSwipeStyle(swipeX, swipeY, index);

  return <Animated.View style={[styles.card, animatedStyle]}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  card: {
    position: "absolute",
  },
});
