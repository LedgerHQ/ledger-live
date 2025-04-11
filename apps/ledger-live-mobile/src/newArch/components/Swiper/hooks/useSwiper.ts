import { useCallback, useState } from "react";
import { useSharedValue } from "react-native-reanimated";
import { useCardRotation } from "./useCardRotation";
import { createGesture } from "../utils/gesture";

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
