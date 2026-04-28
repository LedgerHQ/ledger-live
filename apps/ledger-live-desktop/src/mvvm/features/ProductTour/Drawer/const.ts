export type ProductTourPrimaryAction = "fund" | "swap" | "stake" | "card" | "portfolio";

export const PRODUCT_TOUR_SLIDES: readonly {
  readonly primaryAction: ProductTourPrimaryAction;
  readonly primaryLabelKey: string;
}[] = [
  {
    primaryAction: "fund",
    primaryLabelKey: "productTour.cta.fundYourWallet",
  },
  {
    primaryAction: "swap",
    primaryLabelKey: "productTour.cta.discoverSwap",
  },
  {
    primaryAction: "stake",
    primaryLabelKey: "productTour.cta.growYourRewards",
  },
  {
    primaryAction: "card",
    primaryLabelKey: "productTour.cta.spendYourCrypto",
  },
  {
    primaryAction: "portfolio",
    primaryLabelKey: "productTour.cta.everythingAtAGlance",
  },
];

export const PRODUCT_TOUR_SLIDE_COUNT = PRODUCT_TOUR_SLIDES.length;
export const PRODUCT_TOUR_LAST_SLIDE_INDEX = PRODUCT_TOUR_SLIDE_COUNT - 1;
