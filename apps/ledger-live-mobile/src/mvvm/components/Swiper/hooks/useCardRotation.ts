import { useMemo } from "react";

export function useCardRotation<T>(cardIndex: number, cards: T[]) {
  return useMemo(() => {
    const visibleCards = [];
    const totalCards = cards.length;
    const maxCardsToShow = Math.min(3, totalCards);

    // 3 first cards to see the front animation and still smooth
    for (let i = 0; i < maxCardsToShow; i++) {
      const index = (cardIndex + i) % totalCards;
      visibleCards.push(cards[index]);
    }
    // Last card to see the back animation
    if (totalCards > maxCardsToShow) {
      const lastIndex = (cardIndex - 1 + totalCards) % totalCards;
      visibleCards.push(cards[lastIndex]);
    }

    return visibleCards;
  }, [cardIndex, cards]);
}
