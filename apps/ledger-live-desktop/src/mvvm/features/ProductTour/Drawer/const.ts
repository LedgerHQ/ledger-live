export const PAGE_TRACKING_PRODUCT_TOUR = "Product Tour";

export type ProductTourPrimaryAction = "fund" | "swap" | "stake" | "card" | "portfolio";

export const PRODUCT_TOUR_SLIDES: readonly {
  readonly primaryAction: ProductTourPrimaryAction;
  readonly primaryLabelKey: string;
  readonly titleKey: string;
  readonly subTitleKey: string;
}[] = [
  {
    primaryAction: "fund",
    primaryLabelKey: "productTour.cta.fundYourWallet",
    titleKey: "productTour.slides.fund.title",
    subTitleKey: "productTour.slides.fund.subTitle",
  },
  {
    primaryAction: "swap",
    primaryLabelKey: "productTour.cta.discoverSwap",
    titleKey: "productTour.slides.swap.title",
    subTitleKey: "productTour.slides.swap.subTitle",
  },
  {
    primaryAction: "stake",
    primaryLabelKey: "productTour.cta.growYourRewards",
    titleKey: "productTour.slides.earn.title",
    subTitleKey: "productTour.slides.earn.subTitle",
  },
  {
    primaryAction: "card",
    primaryLabelKey: "productTour.cta.spendYourCrypto",
    titleKey: "productTour.slides.card.title",
    subTitleKey: "productTour.slides.card.subTitle",
  },
  {
    primaryAction: "portfolio",
    primaryLabelKey: "productTour.cta.everythingAtAGlance",
    titleKey: "productTour.slides.portfolio.title",
    subTitleKey: "productTour.slides.portfolio.subTitle",
  },
];

export const PRODUCT_TOUR_SLIDE_COUNT = PRODUCT_TOUR_SLIDES.length;
export const PRODUCT_TOUR_LAST_SLIDE_INDEX = PRODUCT_TOUR_SLIDE_COUNT - 1;
