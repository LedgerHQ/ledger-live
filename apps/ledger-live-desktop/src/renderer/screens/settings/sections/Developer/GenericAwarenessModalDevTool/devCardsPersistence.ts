import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalCarousel,
  type GenericAwarenessModalContentCard,
  type GenericAwarenessModalFeatureIntro,
} from "@ledgerhq/live-common/genericAwarenessModal";

export const DEV_GENERIC_AWARENESS_MODAL_CARDS_STORAGE_KEY =
  "ledger-live-desktop.devGenericAwarenessModalCards";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isCarouselCard = (value: unknown): value is GenericAwarenessModalCarousel =>
  isRecord(value) &&
  value.layout === GenericAwarenessModalLayout.Carousel &&
  typeof value.id === "string" &&
  Array.isArray(value.data);

const isFeatureIntroCard = (value: unknown): value is GenericAwarenessModalFeatureIntro =>
  isRecord(value) &&
  value.layout === GenericAwarenessModalLayout.FeatureIntro &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.subtitle === "string" &&
  typeof value.imageUrl === "string" &&
  typeof value.primaryButtonLabel === "string" &&
  typeof value.primaryButtonLink === "string" &&
  typeof value.secondaryButtonLabel === "string" &&
  typeof value.secondaryButtonLink === "string" &&
  Array.isArray(value.items);

const isContentCard = (value: unknown): value is GenericAwarenessModalContentCard =>
  isCarouselCard(value) || isFeatureIntroCard(value);

const parsePersistedDevCards = (raw: unknown): GenericAwarenessModalContentCard[] => {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.filter(isContentCard);
};

export const loadPersistedDevGenericAwarenessModalCards =
  (): GenericAwarenessModalContentCard[] => {
    if (globalThis.localStorage === undefined) {
      return [];
    }

    try {
      const raw = globalThis.localStorage.getItem(DEV_GENERIC_AWARENESS_MODAL_CARDS_STORAGE_KEY);
      if (!raw) {
        return [];
      }

      return parsePersistedDevCards(JSON.parse(raw));
    } catch {
      return [];
    }
  };

export const persistDevGenericAwarenessModalCards = (
  cards: readonly GenericAwarenessModalContentCard[],
): void => {
  if (globalThis.localStorage === undefined) {
    return;
  }

  if (cards.length === 0) {
    globalThis.localStorage.removeItem(DEV_GENERIC_AWARENESS_MODAL_CARDS_STORAGE_KEY);
    return;
  }

  globalThis.localStorage.setItem(
    DEV_GENERIC_AWARENESS_MODAL_CARDS_STORAGE_KEY,
    JSON.stringify(cards),
  );
};
