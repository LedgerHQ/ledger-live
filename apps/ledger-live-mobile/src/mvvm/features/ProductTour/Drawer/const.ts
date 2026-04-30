export const PAGE_TRACKING_PRODUCT_TOUR = "Product Tour";

export type ProductTourPrimaryAction = "done" | "swap" | "stake" | "card" | "portfolio";

export const PRODUCT_TOUR_SLIDES: readonly {
  readonly primaryAction: ProductTourPrimaryAction;
  readonly primaryLabelKey: string;
}[] = [
  { primaryAction: "portfolio", primaryLabelKey: "productTour.portfolio.cta" },
  { primaryAction: "stake", primaryLabelKey: "productTour.stake.cta" },
  { primaryAction: "card", primaryLabelKey: "productTour.card.cta" },
  { primaryAction: "swap", primaryLabelKey: "productTour.swap.cta" },
  { primaryAction: "done", primaryLabelKey: "common.done" },
];

export const PRODUCT_TOUR_TOTAL_SLIDES = PRODUCT_TOUR_SLIDES.length;
export const PRODUCT_TOUR_LAST_SLIDE_INDEX = PRODUCT_TOUR_TOTAL_SLIDES - 1;
