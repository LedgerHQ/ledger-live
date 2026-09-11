import type { Features } from "@shared/feature-flags";
import type { WalletV4Tour, WalletV4TourSlide } from "LLM/components/WalletV4TourDrawer";
import contactDark from "./assets/contact-dark.webp";
import contactLight from "./assets/contact-light.webp";
import introDark from "./assets/intro-dark.webp";
import introLight from "./assets/intro-light.webp";
import payDark from "./assets/pay-dark.webp";
import payLight from "./assets/pay-light.webp";
import payNoCardDark from "./assets/pay-nocard-dark.webp";
import payNoCardLight from "./assets/pay-nocard-light.webp";
import yieldDark from "./assets/yield-dark.webp";
import yieldLight from "./assets/yield-light.webp";

export const PAGE_TRACKING_Q3_WALLET_V4_TOUR = "Q3 Wallet V4 Tour";

type ReleaseTourVariant = NonNullable<NonNullable<Features["releaseTour"]["params"]>["variant"]>;

const SLIDES_LIST_HEIGHT = 440;

const PROGRESS_HEIGHT = 94;
const FOOTER_HEIGHT = 56;

const introSlide: WalletV4TourSlide = {
  titleKey: "q3WalletV4Tour.intro.title",
  subTitleKey: "q3WalletV4Tour.intro.subTitle",
  imageSrc: { light: introLight, dark: introDark },
};

const contactSlide: WalletV4TourSlide = {
  titleKey: "q3WalletV4Tour.contact.title",
  subTitleKey: "q3WalletV4Tour.contact.subTitle",
  imageSrc: { light: contactLight, dark: contactDark },
};

const contactNoPaySlide: WalletV4TourSlide = {
  titleKey: "q3WalletV4Tour.contactNoPay.title",
  subTitleKey: "q3WalletV4Tour.contactNoPay.subTitle",
  imageSrc: { light: contactLight, dark: contactDark },
};

const paySlide: WalletV4TourSlide = {
  titleKey: "q3WalletV4Tour.pay.title",
  subTitleKey: "q3WalletV4Tour.pay.subTitle",
  imageSrc: { light: payLight, dark: payDark },
};

const payNoCardSlide: WalletV4TourSlide = {
  titleKey: "q3WalletV4Tour.payNoCard.title",
  subTitleKey: "q3WalletV4Tour.payNoCard.subTitle",
  imageSrc: { light: payNoCardLight, dark: payNoCardDark },
};

const yieldSlide: WalletV4TourSlide = {
  titleKey: "q3WalletV4Tour.yield.title",
  subTitleKey: "q3WalletV4Tour.yield.subTitle",
  imageSrc: { light: yieldLight, dark: yieldDark },
};

const q3TourBase: Omit<WalletV4Tour, "slides"> = {
  page: PAGE_TRACKING_Q3_WALLET_V4_TOUR,
  testID: "q3-wallet-v4-tour-slides-container",
  copy: {
    startKey: "q3WalletV4Tour.cta.start",
    nextKey: "q3WalletV4Tour.cta.next",
    doneKey: "q3WalletV4Tour.cta.done",
  },
  layout: {
    slidesListHeight: SLIDES_LIST_HEIGHT,
    slidesContainerHeight: SLIDES_LIST_HEIGHT + PROGRESS_HEIGHT + FOOTER_HEIGHT,
    progressMarginTop: "s56",
    title: {
      typography: "heading4SemiBold",
      marginTop: "s24",
    },
  },
};

const Q3_TOURS_BY_VARIANT: Record<"q3_a" | "q3_b" | "q3_b2", WalletV4Tour> = {
  q3_a: {
    ...q3TourBase,
    slides: [introSlide, contactSlide, paySlide, yieldSlide],
  },
  q3_b: { ...q3TourBase, slides: [introSlide, contactNoPaySlide, yieldSlide] },
  q3_b2: {
    ...q3TourBase,
    slides: [introSlide, contactSlide, payNoCardSlide, yieldSlide],
  },
};

export function getQ3WalletV4Tour(variant: ReleaseTourVariant | undefined): WalletV4Tour {
  if (variant === "q3_b" || variant === "q3_b2") {
    return Q3_TOURS_BY_VARIANT[variant];
  }
  return Q3_TOURS_BY_VARIANT.q3_a;
}

export const Q3_WALLET_V4_TOUR = Q3_TOURS_BY_VARIANT.q3_a;
