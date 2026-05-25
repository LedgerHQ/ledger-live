import type { GenericAwarenessModalContentCard } from "@ledgerhq/live-common/genericAwarenessModal";
import {
  loadPersistedDevGenericAwarenessModalCards,
  persistDevGenericAwarenessModalCards,
} from "./devCardsPersistence";

let devCards: GenericAwarenessModalContentCard[] = loadPersistedDevGenericAwarenessModalCards();

const syncPersistence = (): void => {
  persistDevGenericAwarenessModalCards(devCards);
};

export const getDevGenericAwarenessModalCards = (): GenericAwarenessModalContentCard[] => [
  ...devCards,
];

export const upsertDevGenericAwarenessModalCard = (
  card: GenericAwarenessModalContentCard,
): GenericAwarenessModalContentCard[] => {
  devCards = [...devCards.filter(c => c.id !== card.id), card];
  syncPersistence();
  return getDevGenericAwarenessModalCards();
};

export const removeDevGenericAwarenessModalCard = (campaignId: string): void => {
  devCards = devCards.filter(c => c.id !== campaignId);
  syncPersistence();
};

export const clearDevGenericAwarenessModalCards = (): void => {
  devCards = [];
  syncPersistence();
};

export const setDevGenericAwarenessModalCards = (
  cards: GenericAwarenessModalContentCard[],
): void => {
  devCards = [...cards];
  syncPersistence();
};
