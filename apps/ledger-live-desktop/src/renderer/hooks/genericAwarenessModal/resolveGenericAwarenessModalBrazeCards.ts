import type { GenericAwarenessModalBrazeCard } from "@ledgerhq/live-common/genericAwarenessModal";
import { getMockGenericAwarenessModalBrazeCards } from "./getMockGenericAwarenessModalBrazeCards";

export const resolveGenericAwarenessModalBrazeCards = (
  brazeCards: GenericAwarenessModalBrazeCard[],
): GenericAwarenessModalBrazeCard[] => {
  if (brazeCards.length > 0) {
    return brazeCards;
  }
  if (__DEV__) {
    return getMockGenericAwarenessModalBrazeCards();
  }
  return [];
};
