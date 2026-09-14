import type { WalletV4Tour } from "LLM/components/WalletV4TourDrawer";
import portfolioDark from "./assets/portfolio-dark.webp";
import portfolioLight from "./assets/portfolio-light.webp";
import balanceDark from "./assets/balance-dark.webp";
import balanceLight from "./assets/balance-light.webp";
import returnsDark from "./assets/returns-dark.webp";
import returnsLight from "./assets/returns-light.webp";
import earnDark from "./assets/earn-dark.webp";
import earnLight from "./assets/earn-light.webp";
import protocolsDark from "./assets/protocols-dark.webp";
import protocolsLight from "./assets/protocols-light.webp";

export const PAGE_TRACKING_Q2_WALLET_V4_TOUR = "Q2 Wallet V4 Tour";

const SLIDES_LIST_HEIGHT = 440;

const PROGRESS_HEIGHT = 80;
const FOOTER_HEIGHT = 64;

export const Q2_WALLET_V4_TOUR: WalletV4Tour = {
  page: PAGE_TRACKING_Q2_WALLET_V4_TOUR,
  testID: "q2-wallet-v4-tour-slides-container",
  copy: {
    startKey: "q2WalletV4Tour.cta.start",
    nextKey: "q2WalletV4Tour.cta.next",
    doneKey: "q2WalletV4Tour.cta.done",
  },
  layout: {
    slidesListHeight: SLIDES_LIST_HEIGHT,
    slidesContainerHeight: SLIDES_LIST_HEIGHT + PROGRESS_HEIGHT + FOOTER_HEIGHT,
    progressMarginTop: "s40",
    title: {
      typography: "heading3SemiBold",
      minHeight: "s80",
    },
  },
  slides: [
    {
      titleKey: "q2WalletV4Tour.portfolio.title",
      imageSrc: { light: portfolioLight, dark: portfolioDark },
    },
    {
      titleKey: "q2WalletV4Tour.balance.title",
      subTitleKey: "q2WalletV4Tour.balance.subTitle",
      imageSrc: { light: balanceLight, dark: balanceDark },
    },
    {
      titleKey: "q2WalletV4Tour.returns.title",
      subTitleKey: "q2WalletV4Tour.returns.subTitle",
      imageSrc: { light: returnsLight, dark: returnsDark },
    },
    {
      titleKey: "q2WalletV4Tour.earn.title",
      subTitleKey: "q2WalletV4Tour.earn.subTitle",
      imageSrc: { light: earnLight, dark: earnDark },
    },
    {
      titleKey: "q2WalletV4Tour.protocols.title",
      subTitleKey: "q2WalletV4Tour.protocols.subTitle",
      imageSrc: { light: protocolsLight, dark: protocolsDark },
    },
  ],
};
