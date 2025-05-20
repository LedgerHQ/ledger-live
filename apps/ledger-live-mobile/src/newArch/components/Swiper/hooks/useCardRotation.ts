import { useMemo } from "react";

const MAX_VISIBLE_CARDS = 3;

export function useCardRotation<T>(cardIndex: number, cards: T[]) {
  return useMemo(() => {
    const visibleCards = [];
    const totalCards = cards.length;

    // 3 first cards to see the front animation and still smooth
    for (let i = 0; i < MAX_VISIBLE_CARDS; i++) {
      const index = (cardIndex + i) % totalCards;
      visibleCards.push(cards[index]);
    }
    // Last card to see the back animation
    const lastIndex = (cardIndex - 1 + totalCards) % totalCards;
    visibleCards.push(cards[lastIndex]);

    return visibleCards;
  }, [cardIndex, cards]);
}
