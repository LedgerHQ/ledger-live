import type { Card as BrazeCard } from "@braze/web-sdk";

import { ALWAYS_ON_CATEGORY_ID } from "LLD/features/DynamicContent/utils/constants";
import apexImage from "~/renderer/images/devices/apex.png";
import blueImage from "~/renderer/images/devices/blue.png";
import flexImage from "~/renderer/images/devices/flex.png";
import nanoSImage from "~/renderer/images/devices/nanoS.png";
import nanoSPImage from "~/renderer/images/devices/nanoSP.png";
import nanoXImage from "~/renderer/images/devices/nanoX.png";
import staxImage from "~/renderer/images/devices/stax.png";
import {
  CategoryContentCard,
  ContentCardsLayout,
  ContentCardsType,
  LocationContentCard,
} from "~/types/dynamicContent";

export const DEBUG_CARD_PREFIX = "debug-local-content-card";

export const HARDWARE_CAROUSEL_LOCAL_IMAGE_URLS = [
  staxImage,
  flexImage,
  apexImage,
  blueImage,
  nanoSPImage,
  nanoXImage,
  nanoSImage,
] as const;

export const HARDWARE_CAROUSEL_PRODUCTS = ["Ledger Stax", "Nano Pod", "Ledger Flex"] as const;

export const HARDWARE_CAROUSEL_DEFAULT_LINK =
  "https://shop.ledger.com/pages/hardware-wallets-comparison";

export const HARDWARE_CAROUSEL_SAMPLE_PRODUCTS = [
  {
    productTitle: "Nano Pod",
    subDescription: "$50",
    tag: "30% off",
    mediaUrl: apexImage,
    link: HARDWARE_CAROUSEL_DEFAULT_LINK,
  },
  {
    productTitle: "Nano Case",
    subDescription: "$89",
    tag: "",
    mediaUrl: blueImage,
    link: HARDWARE_CAROUSEL_DEFAULT_LINK,
  },
  {
    productTitle: "Ledger Flex™",
    subDescription: "",
    tag: "$50 off",
    mediaUrl: flexImage,
    link: HARDWARE_CAROUSEL_DEFAULT_LINK,
  },
] as const;

const HARDWARE_CAROUSEL_PRODUCT_IMAGES: Record<
  (typeof HARDWARE_CAROUSEL_PRODUCTS)[number],
  string
> = {
  "Ledger Stax": staxImage,
  "Nano Pod": apexImage,
  "Ledger Flex": flexImage,
};

export type HardwareCarouselBuilderValues = Readonly<{
  categoryTitle: string;
  categoryCta: string;
  categoryLink: string;
  productTitle: string;
  subDescription: string;
  tag: string;
  mediaUrl: string;
  link: string;
  order: string;
}>;

export function getHardwareCarouselProductImage(productTitle: string): string | undefined {
  return HARDWARE_CAROUSEL_PRODUCT_IMAGES[
    productTitle as (typeof HARDWARE_CAROUSEL_PRODUCTS)[number]
  ];
}

export function buildRandomLedgerImageUrl(): string {
  const range = HARDWARE_CAROUSEL_LOCAL_IMAGE_URLS.length;
  const maxUnbiased = Math.floor(0x1_0000_0000 / range) * range;
  let randomValue: number;

  do {
    [randomValue] = crypto.getRandomValues(new Uint32Array(1));
  } while (randomValue >= maxUnbiased);

  return HARDWARE_CAROUSEL_LOCAL_IMAGE_URLS[randomValue % range];
}

/** Mirrors mobile `topWalletHardwareCarousel` preset defaults. */
export function buildDefaultHardwareCarouselValues(): HardwareCarouselBuilderValues {
  return {
    categoryTitle: "",
    categoryCta: "",
    categoryLink: "",
    productTitle: HARDWARE_CAROUSEL_PRODUCTS[0],
    subDescription: "",
    tag: "30% off",
    mediaUrl: getHardwareCarouselProductImage(HARDWARE_CAROUSEL_PRODUCTS[0]) ?? staxImage,
    link: HARDWARE_CAROUSEL_DEFAULT_LINK,
    order: "0",
  };
}

export function buildHardwareCarouselDebugCards(
  values: HardwareCarouselBuilderValues,
  cardId = `${DEBUG_CARD_PREFIX}-top-wallet-hardware-${Date.now()}`,
): { category: CategoryContentCard; card: BrazeCard } {
  const categoryCta = values.categoryCta.trim();
  const categoryLink = categoryCta ? values.categoryLink.trim() : "";

  const category: CategoryContentCard = {
    id: `${ALWAYS_ON_CATEGORY_ID}-category-${cardId}`,
    categoryId: ALWAYS_ON_CATEGORY_ID,
    location: LocationContentCard.Portfolio,
    created: new Date(),
    order: Number(values.order) || 0,
    cardsLayout: ContentCardsLayout.carousel,
    cardsType: ContentCardsType.smallSquare,
    type: ContentCardsType.category,
    title: values.categoryTitle.trim(),
    description: "",
    cta: categoryCta,
    link: categoryLink,
    isDismissable: true,
    isMock: true,
  };

  const extras: Record<string, string> = {
    platform: "desktop",
    type: ContentCardsType.smallSquare,
    categoryId: ALWAYS_ON_CATEGORY_ID,
    title: values.productTitle.trim(),
    order: values.order,
    media: values.mediaUrl.trim(),
    mediaType: "image",
    link: values.link.trim(),
  };

  if (values.subDescription.trim()) {
    extras.subDescription = values.subDescription.trim();
  }
  if (values.tag.trim()) {
    extras.tag = values.tag.trim();
  }

  const card = {
    id: cardId,
    created: new Date(),
    viewed: false,
    extras,
  } as unknown as BrazeCard;

  return { category, card };
}
