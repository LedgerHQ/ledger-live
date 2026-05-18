import React from "react";
import { Dimensions, StyleSheet } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
  withSpring,
  WithSpringConfig,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const FOLLOW_DISTANCE = width * 0.45;

const SPRING_CONFIG: WithSpringConfig = {
  damping: 30,
  stiffness: 400,
  overshootClamping: true,
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
    let rotateDeg = 0;

    if (isActive) {
      translateX = swipeX.value;
      translateY = swipeY.value;
      rotateDeg = interpolate(swipeX.value, [-width / 2, 0, width / 2], [-16, 0, 15]);
    } else if (isNext) {
      scale = interpolate(
        Math.abs(swipeX.value),
        [0, FOLLOW_DISTANCE],
        [0.95, 1],
        Extrapolation.CLAMP,
      );
      translateY = interpolate(
        Math.abs(swipeX.value),
        [0, FOLLOW_DISTANCE],
        [-28, 0],
        Extrapolation.CLAMP,
      );
    } else if (isAfterNext) {
      scale = interpolate(
        Math.abs(swipeX.value),
        [0, FOLLOW_DISTANCE],
        [0.9, 0.95],
        Extrapolation.CLAMP,
      );
      translateY = interpolate(
        Math.abs(swipeX.value),
        [0, FOLLOW_DISTANCE],
        [-56, -28],
        Extrapolation.CLAMP,
      );
    }

    return {
      transform: [
        { translateX: isActive ? translateX : withSpring(translateX, SPRING_CONFIG) },
        { translateY: isActive ? translateY : withSpring(translateY, SPRING_CONFIG) },
        { scale: isActive ? scale : withSpring(scale, SPRING_CONFIG) },
        { rotate: `${rotateDeg}deg` },
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
