import portfolioAnimation from "./animations/portfolio.lottie";
import stakeAnimation from "./animations/stake.lottie";
import cardAnimation from "./animations/card.lottie";
import swapAnimation from "./animations/swap.lottie";
import fundAnimation from "./animations/deposit.lottie";

export const PAGE_TRACKING_PRODUCT_TOUR = "Product Tour";

export type ProductTourPrimaryAction = "fund" | "swap" | "stake" | "card" | "portfolio";

export const PRODUCT_TOUR_SLIDES: readonly {
  readonly primaryAction: ProductTourPrimaryAction;
  readonly primaryLabelKey: string;
  readonly titleKey: string;
  readonly subTitleKey: string;
  readonly lottieSrc: number;
}[] = [
  {
    primaryAction: "fund",
    primaryLabelKey: "productTour.fund.cta",
    titleKey: "productTour.fund.title",
    subTitleKey: "productTour.fund.subTitle",
    lottieSrc: fundAnimation,
  },
  {
    primaryAction: "portfolio",
    primaryLabelKey: "productTour.portfolio.cta",
    titleKey: "productTour.portfolio.title",
    subTitleKey: "productTour.portfolio.subTitle",
    lottieSrc: portfolioAnimation,
  },
  {
    primaryAction: "stake",
    primaryLabelKey: "productTour.stake.cta",
    titleKey: "productTour.stake.title",
    subTitleKey: "productTour.stake.subTitle",
    lottieSrc: stakeAnimation,
  },
  {
    primaryAction: "card",
    primaryLabelKey: "productTour.card.cta",
    titleKey: "productTour.card.title",
    subTitleKey: "productTour.card.subTitle",
    lottieSrc: cardAnimation,
  },
  {
    primaryAction: "swap",
    primaryLabelKey: "productTour.swap.cta",
    titleKey: "productTour.swap.title",
    subTitleKey: "productTour.swap.subTitle",
    lottieSrc: swapAnimation,
  },
];

export const PRODUCT_TOUR_TOTAL_SLIDES = PRODUCT_TOUR_SLIDES.length;
export const PRODUCT_TOUR_LAST_SLIDE_INDEX = PRODUCT_TOUR_TOTAL_SLIDES - 1;
