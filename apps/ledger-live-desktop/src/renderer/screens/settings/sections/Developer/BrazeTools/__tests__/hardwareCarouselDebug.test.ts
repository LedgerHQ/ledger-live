import { ALWAYS_ON_CATEGORY_ID } from "LLD/features/DynamicContent/utils/constants";
import { ContentCardsLayout, ContentCardsType, LocationContentCard } from "~/types/dynamicContent";
import {
  buildDefaultHardwareCarouselValues,
  buildHardwareCarouselDebugCards,
  buildRandomLedgerImageUrl,
  getHardwareCarouselProductImage,
  HARDWARE_CAROUSEL_DEFAULT_LINK,
  HARDWARE_CAROUSEL_LOCAL_IMAGE_URLS,
  HARDWARE_CAROUSEL_PRODUCTS,
  HARDWARE_CAROUSEL_SAMPLE_PRODUCTS,
} from "../hardwareCarouselDebug";

describe("hardwareCarouselDebug", () => {
  it("should mirror mobile topWalletHardwareCarousel preset keys", () => {
    const defaults = buildDefaultHardwareCarouselValues();

    expect(defaults.categoryTitle).toBe("");
    expect(defaults.productTitle).toBe(HARDWARE_CAROUSEL_PRODUCTS[0]);
    expect(defaults.tag).toBe("30% off");
    expect(defaults.link).toBe(HARDWARE_CAROUSEL_DEFAULT_LINK);
    expect(defaults.mediaUrl).toBe(getHardwareCarouselProductImage(HARDWARE_CAROUSEL_PRODUCTS[0]));
  });

  it("should use bundled app device images for random media and sample cards", () => {
    expect(HARDWARE_CAROUSEL_LOCAL_IMAGE_URLS.length).toBeGreaterThan(0);
    expect(HARDWARE_CAROUSEL_LOCAL_IMAGE_URLS).toContain(buildRandomLedgerImageUrl());
    HARDWARE_CAROUSEL_SAMPLE_PRODUCTS.forEach(sample => {
      expect(HARDWARE_CAROUSEL_LOCAL_IMAGE_URLS).toContain(sample.mediaUrl);
    });
  });

  it("should give sample cards a shop link so they stay clickable", () => {
    HARDWARE_CAROUSEL_SAMPLE_PRODUCTS.forEach(sample => {
      expect(sample.link).toBe(HARDWARE_CAROUSEL_DEFAULT_LINK);
    });

    const { card } = buildHardwareCarouselDebugCards(
      buildDefaultHardwareCarouselValues(),
      "debug-card-link",
    );

    expect(card.extras?.link).toBe(HARDWARE_CAROUSEL_DEFAULT_LINK);
  });

  it("should build an alwayson category shell and a small_square child card", () => {
    const { category, card } = buildHardwareCarouselDebugCards(
      {
        ...buildDefaultHardwareCarouselValues(),
        categoryTitle: "Touchscreen offers",
        productTitle: "Nano Pod",
        subDescription: "$50",
        order: "1",
      },
      "debug-card-1",
    );

    expect(category).toMatchObject({
      categoryId: ALWAYS_ON_CATEGORY_ID,
      location: LocationContentCard.Portfolio,
      title: "Touchscreen offers",
      cardsLayout: ContentCardsLayout.carousel,
      cardsType: ContentCardsType.smallSquare,
      isDismissable: true,
    });
    expect(card.extras).toMatchObject({
      categoryId: ALWAYS_ON_CATEGORY_ID,
      type: ContentCardsType.smallSquare,
      title: "Nano Pod",
      subDescription: "$50",
      tag: "30% off",
      order: "1",
    });
  });
});
