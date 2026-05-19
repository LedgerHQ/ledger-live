import { GenericAwarenessModalContentCard } from "./types";

export function getGenericAwarenessModalContentCard(
  contentCards: readonly GenericAwarenessModalContentCard[],
  id?: string,
): GenericAwarenessModalContentCard | undefined {
  return contentCards.find(card => {
    if (!id) {
      return card.id.startsWith("APP_START");
    }
    return card.id === id;
  });
}
