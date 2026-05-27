import { GenericAwarenessModalContentCard } from "./types";

/**
 * Gets a content card by its id. If not provided, the first app start card is returned.
 * @param contentCards - The content cards to search through.
 * @param id - The id of the content card to search for.
 * @returns The content card if found, otherwise undefined.
 */
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
