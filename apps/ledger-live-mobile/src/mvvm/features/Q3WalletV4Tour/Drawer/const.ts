import type { WalletV4Tour } from "LLM/components/WalletV4TourDrawer";
import contactDark from "./assets/contact-dark.webp";
import contactLight from "./assets/contact-light.webp";
import introDark from "./assets/intro-dark.webp";
import introLight from "./assets/intro-light.webp";
import payDark from "./assets/pay-dark.webp";
import payLight from "./assets/pay-light.webp";
import yieldDark from "./assets/yield-dark.webp";
import yieldLight from "./assets/yield-light.webp";

export const PAGE_TRACKING_Q3_WALLET_V4_TOUR = "Q3 Wallet V4 Tour";

const SLIDES_LIST_HEIGHT = 440;

// Figma: 56 above the dots, 6 for the dots themselves, 32 below, then a 56 tall CTA.
const PROGRESS_HEIGHT = 94;
const FOOTER_HEIGHT = 56;

export const Q3_WALLET_V4_TOUR: WalletV4Tour = {
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
  slides: [
    {
      titleKey: "q3WalletV4Tour.intro.title",
      subTitleKey: "q3WalletV4Tour.intro.subTitle",
      imageSrc: { light: introLight, dark: introDark },
    },
    {
      titleKey: "q3WalletV4Tour.contact.title",
      subTitleKey: "q3WalletV4Tour.contact.subTitle",
      imageSrc: { light: contactLight, dark: contactDark },
    },
    {
      titleKey: "q3WalletV4Tour.pay.title",
      subTitleKey: "q3WalletV4Tour.pay.subTitle",
      imageSrc: { light: payLight, dark: payDark },
    },
    {
      titleKey: "q3WalletV4Tour.yield.title",
      subTitleKey: "q3WalletV4Tour.yield.subTitle",
      imageSrc: { light: yieldLight, dark: yieldDark },
    },
  ],
};
