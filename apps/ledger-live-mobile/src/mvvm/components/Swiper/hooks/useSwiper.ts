import { useCallback, useState, useEffect } from "react";
import { useSharedValue } from "react-native-reanimated";
import { useCardRotation } from "./useCardRotation";
import { createGesture } from "../utils/gesture";

export function useSwiper<T>(
  initialCards: T[],
  currentIndex: number,
  onIndexChange: (index: number) => void,
) {
  const [cardIndex, setCardIndex] = useState(currentIndex);
  const activeIndex = useSharedValue(currentIndex);
  const swipeX = useSharedValue(0);
  const swipeY = useSharedValue(0);

  const cards = useCardRotation(cardIndex, initialCards);

  const handleSwipeComplete = useCallback(() => {
    const nextIndex = (cardIndex + 1) % initialCards.length;
    setCardIndex(nextIndex);
    activeIndex.value = nextIndex;
    onIndexChange(nextIndex);
  }, [cardIndex, initialCards.length, onIndexChange, activeIndex]);

  // RN New Arch requires animation values to be reset after React commits the cardIndex change and re-renders
  // This ensures the cards array (from useCardRotation) reflects the new order
  // before resetting animations, preventing the swiped card from briefly reappearing on top
  useEffect(() => {
    swipeX.value = 0;
    swipeY.value = 0;
  }, [cardIndex, swipeX, swipeY]);

  const gesture = createGesture(swipeX, swipeY, handleSwipeComplete);

  return { cards, gesture, swipeX, swipeY };
}
