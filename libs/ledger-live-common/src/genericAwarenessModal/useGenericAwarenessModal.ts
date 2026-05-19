import { GenericAwarenessModalContentCard } from "./types";

export function useGenericAwarenessModal(
  contentCards: GenericAwarenessModalContentCard[],
  id?: string,
) {
  return contentCards.find(card => {
    if (!id) {
      return card.id.startsWith("APP_START");
    }
    return card.id === id;
  });
}
