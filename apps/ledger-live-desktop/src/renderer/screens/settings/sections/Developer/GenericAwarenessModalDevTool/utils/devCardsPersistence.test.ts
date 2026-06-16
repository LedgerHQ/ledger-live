import {
  GenericAwarenessModalLayout,
  type GenericAwarenessModalCarousel,
  type GenericAwarenessModalFeatureIntro,
  type GenericAwarenessModalPrompt,
} from "@ledgerhq/live-common/genericAwarenessModal";
import {
  DEV_GENERIC_AWARENESS_MODAL_CARDS_STORAGE_KEY,
  loadPersistedDevGenericAwarenessModalCards,
  persistDevGenericAwarenessModalCards,
} from "./devCardsPersistence";

const validCarouselSlide = {
  title: "Slide title",
  subtitle: "Slide subtitle",
  imageUrlLight: "https://example.com/light.png",
  imageUrlDark: "",
  primaryButtonLabel: "Primary",
  primaryButtonLink: "https://example.com",
  navigationButtonLabel: "Continue",
};

const validCarouselCard: GenericAwarenessModalCarousel = {
  layout: GenericAwarenessModalLayout.Carousel,
  id: "carousel-campaign",
  isReady: true,
  data: [validCarouselSlide],
};

const validFeatureIntroCard: GenericAwarenessModalFeatureIntro = {
  layout: GenericAwarenessModalLayout.FeatureIntro,
  id: "feature-intro-campaign",
  title: "Title",
  subtitle: "Subtitle",
  imageUrlLight: "https://example.com/light.png",
  imageUrlDark: "",
  primaryButtonLabel: "Primary",
  primaryButtonLink: "https://example.com",
  secondaryButtonLabel: "Secondary",
  secondaryButtonLink: "https://example.com/secondary",
  items: [{ icon: "Shield", title: "Item", subtitle: "Item subtitle" }],
  isReady: true,
};

const validPromptCard: GenericAwarenessModalPrompt = {
  layout: GenericAwarenessModalLayout.Prompt,
  id: "prompt-campaign",
  title: "Title",
  subtitle: "Subtitle",
  imageUrlLight: "https://example.com/light.png",
  imageUrlDark: "",
  primaryButtonLabel: "Primary",
  primaryButtonLink: "https://example.com",
  secondaryButtonLabel: "Secondary",
  secondaryButtonLink: "https://example.com/secondary",
};

describe("devCardsPersistence", () => {
  beforeEach(() => {
    globalThis.localStorage.clear();
  });

  it("should persist and load valid carousel cards with validated slide fields", () => {
    persistDevGenericAwarenessModalCards([validCarouselCard]);

    expect(loadPersistedDevGenericAwarenessModalCards()).toEqual([validCarouselCard]);
  });

  it("should drop carousel cards with invalid slide fields when loading", () => {
    globalThis.localStorage.setItem(
      DEV_GENERIC_AWARENESS_MODAL_CARDS_STORAGE_KEY,
      JSON.stringify([
        validCarouselCard,
        {
          ...validCarouselCard,
          id: "invalid-carousel",
          data: [{ ...validCarouselSlide, navigationButtonLabel: undefined }],
        },
      ]),
    );

    expect(loadPersistedDevGenericAwarenessModalCards()).toEqual([validCarouselCard]);
  });

  it("should drop carousel cards missing isReady when loading", () => {
    globalThis.localStorage.setItem(
      DEV_GENERIC_AWARENESS_MODAL_CARDS_STORAGE_KEY,
      JSON.stringify([
        {
          layout: GenericAwarenessModalLayout.Carousel,
          id: "missing-is-ready",
          data: [validCarouselSlide],
        },
      ]),
    );

    expect(loadPersistedDevGenericAwarenessModalCards()).toEqual([]);
  });

  it("should persist and load valid feature intro cards", () => {
    persistDevGenericAwarenessModalCards([validFeatureIntroCard]);

    expect(loadPersistedDevGenericAwarenessModalCards()).toEqual([validFeatureIntroCard]);
  });

  it("should persist and load valid prompt cards", () => {
    persistDevGenericAwarenessModalCards([validPromptCard]);

    expect(loadPersistedDevGenericAwarenessModalCards()).toEqual([validPromptCard]);
  });

  it("should drop prompt cards with invalid fields when loading", () => {
    globalThis.localStorage.setItem(
      DEV_GENERIC_AWARENESS_MODAL_CARDS_STORAGE_KEY,
      JSON.stringify([
        validPromptCard,
        {
          ...validPromptCard,
          id: "invalid-prompt",
          secondaryButtonLabel: undefined,
        },
      ]),
    );

    expect(loadPersistedDevGenericAwarenessModalCards()).toEqual([validPromptCard]);
  });

  it("should clear storage when persisting an empty list", () => {
    persistDevGenericAwarenessModalCards([validCarouselCard]);
    persistDevGenericAwarenessModalCards([]);

    expect(
      globalThis.localStorage.getItem(DEV_GENERIC_AWARENESS_MODAL_CARDS_STORAGE_KEY),
    ).toBeNull();
    expect(loadPersistedDevGenericAwarenessModalCards()).toEqual([]);
  });
});
