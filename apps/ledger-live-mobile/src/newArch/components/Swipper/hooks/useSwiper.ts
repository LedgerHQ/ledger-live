import { useCallback, useState } from "react";
import { Dimensions } from "react-native";
import { Gesture } from "react-native-gesture-handler";
import { runOnJS, useSharedValue, withSpring } from "react-native-reanimated";
import { useCardRotation } from "./useCardRotation";

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

function createGesture(
  swipeX: { value: number },
  swipeY: { value: number },
  handleSwipeComplete: () => void,
) {
  return Gesture.Pan()
    .onUpdate(event => {
      swipeX.value = event.translationX;
      swipeY.value = event.translationY;
    })
    .onEnd(event => {
      const { velocityX, velocityY } = event;

      // Swipe horizontal
      if (
        Math.abs(velocityX) > SWIPE_CONFIG.VELOCITY_THRESHOLD ||
        Math.abs(swipeX.value) > SWIPE_CONFIG.THRESHOLD_X
      ) {
        const directionX = Math.sign(swipeX.value);
        swipeX.value = withSpring(directionX * width * SWIPE_CONFIG.MULTIPLIER_X, {
          velocity: velocityX,
          damping: SWIPE_CONFIG.DAMPING,
        });
        swipeY.value = withSpring(velocityY * SWIPE_CONFIG.VELOCITY_Y_MULTIPLIER, {
          damping: SWIPE_CONFIG.DAMPING,
        });
        runOnJS(setTimeout)(handleSwipeComplete, SWIPE_CONFIG.TIMEOUT);
      }
      // Swipe vertical
      else if (
        Math.abs(velocityY) > SWIPE_CONFIG.VELOCITY_THRESHOLD ||
        Math.abs(swipeY.value) > SWIPE_CONFIG.THRESHOLD_Y
      ) {
        const directionY = Math.sign(swipeY.value);
        swipeX.value = withSpring(0, {
          velocity: velocityX,
          damping: SWIPE_CONFIG.DAMPING,
        });
        swipeY.value = withSpring(directionY * height * SWIPE_CONFIG.MULTIPLIER_Y, {
          velocity: velocityY,
          damping: SWIPE_CONFIG.DAMPING,
        });
        runOnJS(setTimeout)(handleSwipeComplete, SWIPE_CONFIG.TIMEOUT);
      } else {
        // Reset position if swipe doesn't meet threshold
        swipeX.value = withSpring(0, {
          velocity: velocityX,
          damping: SWIPE_CONFIG.DAMPING,
        });
        swipeY.value = withSpring(0, {
          velocity: velocityY,
          damping: SWIPE_CONFIG.DAMPING,
        });
      }
    });
}

export function useSwiper<T>(initialCards: T[]) {
  const [cardIndex, setCardIndex] = useState(0);
  const activeIndex = useSharedValue(0);
  const swipeX = useSharedValue(0);
  const swipeY = useSharedValue(0);

  const cards = useCardRotation(cardIndex, initialCards);

  const handleSwipeComplete = useCallback(() => {
    setCardIndex((prev: number) => (prev + 1) % initialCards.length);
    activeIndex.value = (activeIndex.value + 1) % initialCards.length;
    swipeX.value = 0;
    swipeY.value = 0;
  }, [setCardIndex, activeIndex, initialCards.length, swipeX, swipeY]);

  const gesture = createGesture(swipeX, swipeY, handleSwipeComplete);

  return { cards, gesture, swipeX, swipeY };
}
