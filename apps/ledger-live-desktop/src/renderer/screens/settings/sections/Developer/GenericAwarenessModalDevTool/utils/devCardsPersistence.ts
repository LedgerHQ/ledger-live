import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalCarousel,
  type GenericAwarenessModalCarouselSlide,
  type GenericAwarenessModalContentCard,
  type GenericAwarenessModalFeatureIntro,
  type GenericAwarenessModalPrompt,
} from "@ledgerhq/live-common/genericAwarenessModal";

export const DEV_GENERIC_AWARENESS_MODAL_CARDS_STORAGE_KEY =
  "ledger-live-desktop.devGenericAwarenessModalCards";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isCarouselSlide = (value: unknown): value is GenericAwarenessModalCarouselSlide =>
  isRecord(value) &&
  typeof value.title === "string" &&
  typeof value.subtitle === "string" &&
  typeof value.imageUrlLight === "string" &&
  typeof value.imageUrlDark === "string" &&
  typeof value.primaryButtonLabel === "string" &&
  typeof value.primaryButtonLink === "string" &&
  typeof value.navigationButtonLabel === "string";

const isCarouselCard = (value: unknown): value is GenericAwarenessModalCarousel =>
  isRecord(value) &&
  value.layout === GenericAwarenessModalLayout.Carousel &&
  typeof value.id === "string" &&
  typeof value.isReady === "boolean" &&
  Array.isArray(value.data) &&
  value.data.every(isCarouselSlide);

const isFeatureIntroCard = (value: unknown): value is GenericAwarenessModalFeatureIntro =>
  isRecord(value) &&
  value.layout === GenericAwarenessModalLayout.FeatureIntro &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.subtitle === "string" &&
  typeof value.imageUrlLight === "string" &&
  typeof value.imageUrlDark === "string" &&
  typeof value.primaryButtonLabel === "string" &&
  typeof value.primaryButtonLink === "string" &&
  typeof value.secondaryButtonLabel === "string" &&
  typeof value.secondaryButtonLink === "string" &&
  Array.isArray(value.items);

const isPromptCard = (value: unknown): value is GenericAwarenessModalPrompt =>
  isRecord(value) &&
  value.layout === GenericAwarenessModalLayout.Prompt &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  typeof value.subtitle === "string" &&
  typeof value.imageUrlLight === "string" &&
  typeof value.imageUrlDark === "string" &&
  typeof value.primaryButtonLabel === "string" &&
  typeof value.primaryButtonLink === "string" &&
  typeof value.secondaryButtonLabel === "string" &&
  typeof value.secondaryButtonLink === "string";

const isContentCard = (value: unknown): value is GenericAwarenessModalContentCard =>
  isCarouselCard(value) || isFeatureIntroCard(value) || isPromptCard(value);

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
