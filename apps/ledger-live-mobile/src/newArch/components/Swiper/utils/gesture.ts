import { Dimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS, withSpring } from "react-native-reanimated";
import { GestureParams, SwipeValues } from "../types";
import { SwipeDirection } from "../enums";

const { width, height } = Dimensions.get("window");

const SWIPE_CONFIG = {
  DAMPING: 15,
  MULTIPLIER_X: 1.5,
  MULTIPLIER_Y: 1.5,
  VELOCITY_THRESHOLD: 400,
  VELOCITY_Y_MULTIPLIER: 0.3,
  THRESHOLD_X: width * 0.3,
  THRESHOLD_Y: height * 0.3,
  TIMEOUT: 250,
};

function resetGesture({ swipeX, swipeY, velocityX, velocityY }: GestureParams) {
  "worklet";
  swipeX.value = withSpring(0, {
    velocity: velocityX,
    damping: SWIPE_CONFIG.DAMPING,
  });
  swipeY.value = withSpring(0, {
    velocity: velocityY,
    damping: SWIPE_CONFIG.DAMPING,
  });
}

function handleGesture(
  direction: SwipeDirection,
  { swipeX, swipeY, velocityX, velocityY }: GestureParams,
) {
  "worklet";
  if (direction === SwipeDirection.Horizontal) {
    const directionX = Math.sign(swipeX.value);
    swipeX.value = withSpring(directionX * width * SWIPE_CONFIG.MULTIPLIER_X, {
      velocity: velocityX,
      damping: SWIPE_CONFIG.DAMPING,
    });
    swipeY.value = withSpring(velocityY * SWIPE_CONFIG.VELOCITY_Y_MULTIPLIER, {
      damping: SWIPE_CONFIG.DAMPING,
    });
  } else if (direction === SwipeDirection.Vertical) {
    const directionY = Math.sign(swipeY.value);
    swipeX.value = withSpring(0, {
      velocity: velocityX,
      damping: SWIPE_CONFIG.DAMPING,
    });
    swipeY.value = withSpring(directionY * height * SWIPE_CONFIG.MULTIPLIER_Y, {
      velocity: velocityY,
      damping: SWIPE_CONFIG.DAMPING,
    });
  }
}

export const canSwipe = (value: number, velocity: number, threshold: number) => {
  "worklet";
  return Math.abs(velocity) > SWIPE_CONFIG.VELOCITY_THRESHOLD || Math.abs(value) > threshold;
};
const canSwipeHorizontal = (value: number, velocity: number, threshold: number) => {
  "worklet";
  return canSwipe(value, velocity, threshold);
};
const canSwipeVertical = (value: number, velocity: number, threshold: number) => {
  "worklet";
  return canSwipe(value, velocity, threshold);
};

function createGesture(swipeX: SwipeValues, swipeY: SwipeValues, handleSwipeComplete: () => void) {
  return Gesture.Pan()
    .onUpdate(event => {
      swipeX.value = event.translationX;
      swipeY.value = event.translationY;
    })
    .onEnd(event => {
      const params: GestureParams = {
        swipeX,
        swipeY,
        velocityX: event.velocityX,
        velocityY: event.velocityY,
      };

      if (canSwipeHorizontal(params.swipeX.value, params.velocityX, SWIPE_CONFIG.THRESHOLD_X)) {
        handleGesture(SwipeDirection.Horizontal, params);
        runOnJS(setTimeout)(handleSwipeComplete, SWIPE_CONFIG.TIMEOUT);
      } else if (
        canSwipeVertical(params.swipeY.value, params.velocityY, SWIPE_CONFIG.THRESHOLD_Y)
      ) {
        handleGesture(SwipeDirection.Vertical, params);
        runOnJS(setTimeout)(handleSwipeComplete, SWIPE_CONFIG.TIMEOUT);
      } else {
        resetGesture(params);
      }
    });
}

export { resetGesture, handleGesture, createGesture };
