import { useMemo } from "react";

export function useCardRotation<T>(cardIndex: number, cards: T[]) {
  return useMemo(() => {
    const rotatedCards = [...cards];
    const firstCards = rotatedCards.splice(0, cardIndex);
    return [...rotatedCards, ...firstCards];
  }, [cardIndex, cards]);
}
